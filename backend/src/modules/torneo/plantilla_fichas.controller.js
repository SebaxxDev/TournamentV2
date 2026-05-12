import prisma from '../../config/db.js';

export const listarPlantillasFichas = async (req, res) => {
  try {
    const plantillas = await prisma.plantillaFicha.findMany({
      orderBy: { created_at: 'asc' },
      include: {
        detalles: {
          orderBy: { id_detalle: 'asc' },
          include: { ficha: true },
        },
      },
    });
    return res.json({ ok: true, datos: plantillas });
  } catch (error) {
    console.error('Error al listar plantillas de fichas:', error);
    return res.status(500).json({
      ok: false,
      codigo: 'ERROR_SERVIDOR',
      mensaje: 'Error al obtener las plantillas de fichas.',
    });
  }
};

export const crearPlantillaFicha = async (req, res) => {
  const { nombre, detalles } = req.body;

  try {
    const plantilla = await prisma.$transaction(async (tx) => {
      const creada = await tx.plantillaFicha.create({
        data: {
          nombre,
          detalles: {
            create: detalles.map((d) => ({
              id_ficha_catalogo: d.id_ficha_catalogo,
              valor: d.valor,
              cantidad_por_jugador: d.cantidad_por_jugador,
            })),
          },
        },
      });

      return tx.plantillaFicha.findUnique({
        where: { id_plantilla: creada.id_plantilla },
        include: {
          detalles: {
            orderBy: { id_detalle: 'asc' },
            include: { ficha: true },
          },
        },
      });
    });

    return res.status(201).json({ ok: true, datos: plantilla });
  } catch (error) {
    console.error('Error al crear plantilla de fichas:', error);
    return res.status(500).json({
      ok: false,
      codigo: 'ERROR_SERVIDOR',
      mensaje: 'Error al crear la plantilla de fichas.',
    });
  }
};

export const eliminarPlantillaFicha = async (req, res) => {
  const { id } = req.params;

  try {
    const existente = await prisma.plantillaFicha.findUnique({
      where: { id_plantilla: Number(id) },
    });

    if (!existente) {
      return res.status(404).json({
        ok: false,
        codigo: 'PLANTILLA_NO_ENCONTRADA',
        mensaje: 'La plantilla solicitada no existe.',
      });
    }

    await prisma.plantillaFicha.delete({
      where: { id_plantilla: Number(id) },
    });

    return res.json({ ok: true, datos: { id_plantilla: Number(id) } });
  } catch (error) {
    console.error('Error al eliminar plantilla de fichas:', error);
    return res.status(500).json({
      ok: false,
      codigo: 'ERROR_SERVIDOR',
      mensaje: 'Error al eliminar la plantilla de fichas.',
    });
  }
};
