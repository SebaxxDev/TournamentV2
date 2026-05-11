import prisma from '../../config/db.js';

export const listarJuegos = async (req, res) => {
  try {
    const juegos = await prisma.catalogoJuego.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
    });

    return res.json({ ok: true, datos: juegos });
  } catch (error) {
    console.error('Error al listar juegos:', error);
    return res.status(500).json({
      ok: false,
      codigo: 'ERROR_SERVIDOR',
      mensaje: 'Error al obtener el catálogo de juegos.',
    });
  }
};