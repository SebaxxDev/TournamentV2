import prisma from '../../config/db.js';

export const listarPlantillasCiegas = async (req, res) => {
  try {
    const plantillas = await prisma.plantillaCiega.findMany({
      orderBy: { created_at: 'asc' },
      include: {
        detalles: {
          orderBy: { orden: 'asc' },
        },
      },
    });
    return res.json({ ok: true, datos: plantillas });
  } catch (error) {
    console.error('Error al listar plantillas de ciegas:', error);
    return res.status(500).json({
      ok: false,
      codigo: 'ERROR_SERVIDOR',
      mensaje: 'Error al obtener las plantillas de ciegas.',
    });
  }
};

export const crearPlantillaCiegas = async (req, res) => {
  const { nombre, detalles } = req.body;

  try {
    const plantilla = await prisma.$transaction(async (tx) => {
      const creada = await tx.plantillaCiega.create({
        data: {
          nombre,
          detalles: {
            create: detalles.map((d) => ({
              orden: d.orden,
              tipo: d.tipo,
              sb: d.sb,
              bb: d.bb,
              ante: d.ante,
              tiempo_segundos: d.tiempo_segundos,
              marcadores: d.marcadores ?? [],
            })),
          },
        },
      });

      return tx.plantillaCiega.findUnique({
        where: { id_plantilla: creada.id_plantilla },
        include: {
          detalles: {
            orderBy: { orden: 'asc' },
          },
        },
      });
    });

    return res.status(201).json({ ok: true, datos: plantilla });
  } catch (error) {
    console.error('Error al crear plantilla de ciegas:', error);
    return res.status(500).json({
      ok: false,
      codigo: 'ERROR_SERVIDOR',
      mensaje: 'Error al crear la plantilla de ciegas.',
    });
  }
};

export const eliminarPlantillaCiegas = async (req, res) => {
  const { id } = req.params;

  try {
    const existente = await prisma.plantillaCiega.findUnique({
      where: { id_plantilla: Number(id) },
    });

    if (!existente) {
      return res.status(404).json({
        ok: false,
        codigo: 'PLANTILLA_NO_ENCONTRADA',
        mensaje: 'La plantilla solicitada no existe.',
      });
    }

    await prisma.plantillaCiega.delete({
      where: { id_plantilla: Number(id) },
    });

    return res.json({ ok: true, datos: { id_plantilla: Number(id) } });
  } catch (error) {
    console.error('Error al eliminar plantilla de ciegas:', error);
    return res.status(500).json({
      ok: false,
      codigo: 'ERROR_SERVIDOR',
      mensaje: 'Error al eliminar la plantilla de ciegas.',
    });
  }
};
