import prisma from '../../config/db.js';

// Retorna todas las plantillas con sus reglas ordenadas
export const listarPlantillas = async (req, res) => {
  try {
    const plantillas = await prisma.esquemaPremio.findMany({
      orderBy: { created_at: 'asc' },
      include: {
        reglas: {
          orderBy: [{ posicion: 'asc' }, { rango_min_jugadores: 'asc' }],
        },
      },
    });

    return res.json({ ok: true, datos: plantillas });
  } catch (error) {
    console.error('Error al listar plantillas de premios:', error);
    return res.status(500).json({
      ok: false,
      codigo: 'ERROR_SERVIDOR',
      mensaje: 'Error al obtener las plantillas.',
    });
  }
};

// Crea una plantilla nueva con todas sus reglas en una transacción
export const crearPlantilla = async (req, res) => {
  const { nombre, descripcion, reglas } = req.body;

  try {
    const plantilla = await prisma.$transaction(async (tx) => {
      const esquema = await tx.esquemaPremio.create({
        data: {
          nombre,
          descripcion: descripcion ?? null,
        },
      });

      if (reglas && reglas.length > 0) {
        await tx.reglaPremio.createMany({
          data: reglas.map((r) => ({
            id_esquema: esquema.id_esquema,
            rango_min_jugadores: r.rango_min_jugadores,
            rango_max_jugadores: r.rango_max_jugadores,
            posicion: r.posicion,
            porcentaje: r.porcentaje,
          })),
        });
      }

      return tx.esquemaPremio.findUnique({
        where: { id_esquema: esquema.id_esquema },
        include: {
          reglas: {
            orderBy: [{ posicion: 'asc' }, { rango_min_jugadores: 'asc' }],
          },
        },
      });
    });

    return res.status(201).json({ ok: true, datos: plantilla });
  } catch (error) {
    console.error('Error al crear plantilla de premios:', error);
    return res.status(500).json({
      ok: false,
      codigo: 'ERROR_SERVIDOR',
      mensaje: 'Error al crear la plantilla.',
    });
  }
};

// Elimina una plantilla y sus reglas (cascade definido en el schema)
export const eliminarPlantilla = async (req, res) => {
  const { id } = req.params;

  try {
    const existente = await prisma.esquemaPremio.findUnique({
      where: { id_esquema: Number(id) },
    });

    if (!existente) {
      return res.status(404).json({
        ok: false,
        codigo: 'PLANTILLA_NO_ENCONTRADA',
        mensaje: 'La plantilla solicitada no existe.',
      });
    }

    await prisma.esquemaPremio.delete({
      where: { id_esquema: Number(id) },
    });

    return res.json({ ok: true, datos: { id_esquema: Number(id) } });
  } catch (error) {
    console.error('Error al eliminar plantilla de premios:', error);
    return res.status(500).json({
      ok: false,
      codigo: 'ERROR_SERVIDOR',
      mensaje: 'Error al eliminar la plantilla.',
    });
  }
};