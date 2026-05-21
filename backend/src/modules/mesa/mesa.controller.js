import prisma from '../../config/db.js'

// GET /api/mesas/torneo/:idTorneo
export const listarMesas = async (req, res) => {
  const idTorneo = Number(req.params.idTorneo)

  const mesas = await prisma.mesa.findMany({
    where: { id_torneo: idTorneo },
    orderBy: { numero_mesa: 'asc' },
    include: {
      asientos: {
        orderBy: { numero_asiento: 'asc' },
        include: {
          inscripcion: {
            select: {
              id_inscripcion: true,
              jugador: { select: { nombre_completo: true } },
            },
          },
        },
      },
    },
  })

  const datos = mesas.map((m) => ({
    id_mesa:     m.id_mesa,
    numero_mesa: m.numero_mesa,
    estado:      m.estado,
    asientos: m.asientos.map((a) => ({
      id_asiento:      a.id_asiento,
      numero_asiento:  a.numero_asiento,
      id_inscripcion:  a.id_inscripcion,
      nombre_jugador:  a.inscripcion?.jugador?.nombre_completo ?? null,
    })),
  }))

  return res.json({ ok: true, datos })
}

// POST /api/mesas
export const crearMesa = async (req, res) => {
  const idTorneo = Number(req.body.idTorneo)

  // Determinar siguiente numero de mesa
  const ultima = await prisma.mesa.findFirst({
    where:   { id_torneo: idTorneo },
    orderBy: { numero_mesa: 'desc' },
  })
  const siguienteNumero = (ultima?.numero_mesa ?? 0) + 1

  const mesa = await prisma.mesa.create({
    data: {
      id_torneo:   idTorneo,
      numero_mesa: siguienteNumero,
      capacidad:   10,
      asientos: {
        create: Array.from({ length: 10 }, (_, i) => ({ numero_asiento: i + 1 })),
      },
    },
    include: {
      asientos: { orderBy: { numero_asiento: 'asc' } },
    },
  })

  return res.status(201).json({ ok: true, datos: mesa })
}

// DELETE /api/mesas/:idMesa
export const eliminarMesa = async (req, res) => {
  const idMesa = Number(req.params.idMesa)

  // Verificar que ningún asiento esté ocupado
  const asientoOcupado = await prisma.asiento.findFirst({
    where: { id_mesa: idMesa, id_inscripcion: { not: null } },
  })
  if (asientoOcupado) {
    return res.status(409).json({
      ok: false,
      codigo: 'MESA_CON_JUGADORES',
      mensaje: 'No se puede eliminar una mesa que tiene jugadores sentados.',
    })
  }

  // Eliminar asientos primero, luego mesa
  await prisma.asiento.deleteMany({ where: { id_mesa: idMesa } })
  await prisma.mesa.delete({ where: { id_mesa: idMesa } })

  return res.json({ ok: true, datos: { mensaje: 'Mesa eliminada correctamente' } })
}

// POST /api/mesas/:idMesa/asiento  — agregar un asiento
export const agregarAsiento = async (req, res) => {
  const idMesa = Number(req.params.idMesa)

  const asientos = await prisma.asiento.findMany({
    where:   { id_mesa: idMesa },
    orderBy: { numero_asiento: 'desc' },
  })

  if (asientos.length >= 10) {
    return res.status(400).json({
      ok: false,
      codigo: 'CAPACIDAD_MAXIMA',
      mensaje: 'Una mesa no puede tener más de 10 asientos.',
    })
  }

  const siguiente = (asientos[0]?.numero_asiento ?? 0) + 1
  const nuevo = await prisma.asiento.create({
    data: { id_mesa: idMesa, numero_asiento: siguiente },
  })

  return res.status(201).json({ ok: true, datos: nuevo })
}

// DELETE /api/mesas/:idMesa/asiento  — quitar el último asiento libre
export const quitarAsiento = async (req, res) => {
  const idMesa = Number(req.params.idMesa)

  // Buscar el último asiento sin jugador
  const asiento = await prisma.asiento.findFirst({
    where:   { id_mesa: idMesa, id_inscripcion: null },
    orderBy: { numero_asiento: 'desc' },
  })

  if (!asiento) {
    return res.status(400).json({
      ok: false,
      codigo: 'SIN_ASIENTO_LIBRE',
      mensaje: 'No hay asientos libres que quitar.',
    })
  }

  await prisma.asiento.delete({ where: { id_asiento: asiento.id_asiento } })

  return res.json({ ok: true, datos: { mensaje: 'Asiento eliminado' } })
}

// PUT /api/mesas/mover-jugador
export const moverJugador = async (req, res) => {
  const { id_inscripcion, id_asiento_origen, id_asiento_destino } = req.body

  // Verificar que el destino esté libre
  const destino = await prisma.asiento.findUnique({
    where: { id_asiento: id_asiento_destino },
  })

  if (!destino) {
    return res.status(404).json({
      ok: false,
      codigo: 'ASIENTO_NO_ENCONTRADO',
      mensaje: 'El asiento de destino no existe.',
    })
  }

  if (destino.id_inscripcion !== null) {
    return res.status(409).json({
      ok: false,
      codigo: 'ASIENTO_OCUPADO',
      mensaje: 'El asiento de destino ya está ocupado.',
    })
  }

  // Mover: liberar origen, ocupar destino
  await prisma.$transaction([
    prisma.asiento.update({
      where: { id_asiento: id_asiento_origen },
      data:  { id_inscripcion: null },
    }),
    prisma.asiento.update({
      where: { id_asiento: id_asiento_destino },
      data:  { id_inscripcion: id_inscripcion },
    }),
  ])

  return res.json({ ok: true, datos: { mensaje: 'Jugador movido correctamente' } })
}

// PUT /api/mesas/asignar-jugador — primera asignación (sin asiento origen)
export const asignarJugador = async (req, res) => {
  const { id_inscripcion, id_asiento_destino } = req.body

  // Verificar que el jugador no esté ya sentado en otro asiento
  const asientoActual = await prisma.asiento.findFirst({
    where: { id_inscripcion: id_inscripcion },
  })
  if (asientoActual) {
    return res.status(409).json({
      ok: false,
      codigo: 'JUGADOR_YA_SENTADO',
      mensaje: 'El jugador ya tiene un asiento asignado. Usa mover-jugador para cambiarlo.',
    })
  }

  const destino = await prisma.asiento.findUnique({
    where: { id_asiento: id_asiento_destino },
  })

  if (!destino) {
    return res.status(404).json({
      ok: false,
      codigo: 'ASIENTO_NO_ENCONTRADO',
      mensaje: 'El asiento de destino no existe.',
    })
  }

  if (destino.id_inscripcion !== null) {
    return res.status(409).json({
      ok: false,
      codigo: 'ASIENTO_OCUPADO',
      mensaje: 'El asiento de destino ya está ocupado.',
    })
  }

  await prisma.asiento.update({
    where: { id_asiento: id_asiento_destino },
    data:  { id_inscripcion: id_inscripcion },
  })

  return res.json({ ok: true, datos: { mensaje: 'Jugador asignado correctamente' } })
}
