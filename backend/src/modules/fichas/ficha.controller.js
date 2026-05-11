import prisma from '../../config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function listarFichas(req, res) {
  try {
    const fichas = await prisma.catalogoFicha.findMany({
      orderBy: { created_at: 'asc' },
    })

    return res.json({ ok: true, datos: fichas })
  } catch (error) {
    return res.status(500).json({
      ok: false,
      codigo: 'ERROR_INTERNO',
      mensaje: 'Error al listar fichas',
    })
  }
}

export async function obtenerFicha(req, res) {
  try {
    const id_ficha = parseInt(req.params.id);

    const ficha = await prisma.catalogoFicha.findUnique({
      where: { id_ficha },
    });

    if (!ficha) {
      return res.status(404).json({
        ok: false,
        codigo: 'FICHA_NO_ENCONTRADA',
        mensaje: 'La ficha no existe',
      });
    }

    return res.json({ ok: true, datos: ficha });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      codigo: 'ERROR_INTERNO',
      mensaje: 'Error al obtener ficha',
    });
  }
}

export async function crearFicha(req, res) {
  try {
    const { nombre, color } = req.body;

    if (!req.file) {
      return res.status(400).json({
        ok: false,
        codigo: 'IMAGEN_REQUERIDA',
        mensaje: 'La imagen es obligatoria',
      });
    }

    const img_path = `/uploads/fichas/${req.file.filename}`;

    const ficha = await prisma.catalogoFicha.create({
      data: { nombre, color, img_path },
    });

    return res.status(201).json({ ok: true, datos: ficha });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      codigo: 'ERROR_INTERNO',
      mensaje: 'Error al crear ficha',
    });
  }
}

export async function editarFicha(req, res) {
  try {
    const id_ficha = parseInt(req.params.id);
    const { nombre, color } = req.body;

    const ficha = await prisma.catalogoFicha.findUnique({
      where: { id_ficha },
    });

    if (!ficha) {
      return res.status(404).json({
        ok: false,
        codigo: 'FICHA_NO_ENCONTRADA',
        mensaje: 'La ficha no existe',
      });
    }

    const datos = {};
    if (nombre !== undefined) datos.nombre = nombre;
    if (color !== undefined) datos.color = color;

    // Si se sube nueva imagen, eliminar la anterior del disco
    if (req.file) {
      if (ficha.img_path) {
        const rutaAnterior = path.join(__dirname, '../../', ficha.img_path);
        if (fs.existsSync(rutaAnterior)) {
          fs.unlinkSync(rutaAnterior);
        }
      }
      datos.img_path = `/uploads/fichas/${req.file.filename}`;
    }

    const fichaActualizada = await prisma.catalogoFicha.update({
      where: { id_ficha },
      data: datos,
    });

    return res.json({ ok: true, datos: fichaActualizada });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      codigo: 'ERROR_INTERNO',
      mensaje: 'Error al editar ficha',
    });
  }
}

export async function cambiarEstadoFicha(req, res) {
  try {
    const id_ficha = parseInt(req.params.id);

    const ficha = await prisma.catalogoFicha.findUnique({
      where: { id_ficha },
    });

    if (!ficha) {
      return res.status(404).json({
        ok: false,
        codigo: 'FICHA_NO_ENCONTRADA',
        mensaje: 'La ficha no existe',
      });
    }

    const fichaActualizada = await prisma.catalogoFicha.update({
      where: { id_ficha },
      data: { activo: !ficha.activo },
    });

    return res.json({ ok: true, datos: fichaActualizada });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      codigo: 'ERROR_INTERNO',
      mensaje: 'Error al cambiar estado',
    });
  }
}

export async function eliminarFicha(req, res) {
  try {
    const id_ficha = parseInt(req.params.id);

    const ficha = await prisma.catalogoFicha.findUnique({
      where: { id_ficha },
    });

    if (!ficha) {
      return res.status(404).json({
        ok: false,
        codigo: 'FICHA_NO_ENCONTRADA',
        mensaje: 'La ficha no existe',
      });
    }

    // Eliminar imagen del disco antes de borrar el registro
    if (ficha.img_path) {
      const rutaImagen = path.join(__dirname, '../../', ficha.img_path);
      if (fs.existsSync(rutaImagen)) {
        fs.unlinkSync(rutaImagen);
      }
    }

    await prisma.catalogoFicha.delete({
      where: { id_ficha },
    });

    return res.json({ ok: true, datos: { mensaje: 'Ficha eliminada correctamente' } });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      codigo: 'ERROR_INTERNO',
      mensaje: 'Error al eliminar ficha',
    });
  }
}