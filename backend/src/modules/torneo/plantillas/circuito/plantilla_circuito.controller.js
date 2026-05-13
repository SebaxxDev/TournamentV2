import prisma from '../../../../config/db.js';

export const obtenerPlantillaCircuito = async (req, res) => {
  const { id } = req.params;

  try {
    const plantilla = await prisma.circuitoPlantilla.findUnique({
      where: { id_plantilla: Number(id) },
      include: { detalles: { orderBy: { posicion: 'asc' } } },
    });

    if (!plantilla) {
      return res.status(404).json({
        ok: false,
        codigo: 'PLANTILLA_NO_ENCONTRADA',
        mensaje: 'La plantilla solicitada no existe.',
      });
    }

    return res.json({ ok: true, datos: plantilla });
  } catch (error) {
    console.error('Error al obtener plantilla de circuito:', error);
    return res.status(500).json({
      ok: false,
      codigo: 'ERROR_SERVIDOR',
      mensaje: 'Error al obtener la plantilla.',
    });
  }
};

export const listarPlantillasCircuito = async (req, res) => {
  try {
    const plantillas = await prisma.circuitoPlantilla.findMany({
      orderBy: { created_at: 'asc' },
      include: {
        detalles: { orderBy: { posicion: 'asc' } },
      },
    });

    return res.json({ ok: true, datos: plantillas });
  } catch (error) {
    console.error('Error al listar plantillas de circuito:', error);
    return res.status(500).json({
      ok: false,
      codigo: 'ERROR_SERVIDOR',
      mensaje: 'Error al obtener las plantillas de puntos.',
    });
  }
};

export const crearPlantillaCircuito = async (req, res) => {
  const { nombre, puntos_participacion, top_bonus_cantidad, detalles } = req.body;

  try {
    const plantilla = await prisma.$transaction(async (tx) => {
      const creada = await tx.circuitoPlantilla.create({
        data: {
          nombre,
          puntos_participacion,
          top_bonus_cantidad: top_bonus_cantidad ?? detalles.length,
          detalles: {
            create: detalles.map((d) => ({
              posicion: d.posicion,
              puntos_puesto: d.puntos_puesto,
              porcentaje_extra: d.porcentaje_extra,
            })),
          },
        },
      });

      return tx.circuitoPlantilla.findUnique({
        where: { id_plantilla: creada.id_plantilla },
        include: { detalles: { orderBy: { posicion: 'asc' } } },
      });
    });

    return res.status(201).json({ ok: true, datos: plantilla });
  } catch (error) {
    console.error('Error al crear plantilla de circuito:', error);
    return res.status(500).json({
      ok: false,
      codigo: 'ERROR_SERVIDOR',
      mensaje: 'Error al crear la plantilla de puntos.',
    });
  }
};

export const eliminarPlantillaCircuito = async (req, res) => {
  const { id } = req.params;

  try {
    const existente = await prisma.circuitoPlantilla.findUnique({
      where: { id_plantilla: Number(id) },
    });

    if (!existente) {
      return res.status(404).json({
        ok: false,
        codigo: 'PLANTILLA_NO_ENCONTRADA',
        mensaje: 'La plantilla solicitada no existe.',
      });
    }

    const enUso = await prisma.poker.count({
      where: { id_plantilla_origen: Number(id) },
    });

    if (enUso > 0) {
      return res.status(409).json({
        ok: false,
        codigo: 'PLANTILLA_EN_USO',
        mensaje: 'No se puede eliminar: hay torneos que usan esta plantilla.',
      });
    }

    await prisma.circuitoPlantilla.delete({
      where: { id_plantilla: Number(id) },
    });

    return res.json({ ok: true, datos: { id_plantilla: Number(id) } });
  } catch (error) {
    console.error('Error al eliminar plantilla de circuito:', error);
    return res.status(500).json({
      ok: false,
      codigo: 'ERROR_SERVIDOR',
      mensaje: 'Error al eliminar la plantilla.',
    });
  }
};
