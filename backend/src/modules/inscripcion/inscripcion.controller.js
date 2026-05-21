import prisma from '../../config/db.js'

// Incluye jugador en la respuesta para que el frontend pueda actualizar el store
const incluirJugador = {
  jugador: {
    select: {
      rut: true,
      nombre_completo: true,
      nacionalidad: true,
      genero: true,
    },
  },
}

// ---------------------------------------------------------------------------
// POST /api/inscripciones
// ---------------------------------------------------------------------------
export const crearInscripcion = async (req, res) => {
  const { id_torneo, rut_jugador, tiene_free_chip = false } = req.body

  try {
    const torneo = await prisma.torneo.findUnique({
      where: { id_torneo },
      select: {
        id_torneo: true,
        estado: true,
        capacidad_maxima: true,
        poker: { select: { free_chip_permitido: true } },
      },
    })

    if (!torneo) {
      return res.status(404).json({ ok: false, codigo: 'TORNEO_NO_ENCONTRADO', mensaje: 'El torneo solicitado no existe.' })
    }

    if (torneo.estado === 'FINALIZADO') {
      return res.status(400).json({ ok: false, codigo: 'TORNEO_FINALIZADO', mensaje: 'El torneo ya finalizo y no acepta mas inscripciones.' })
    }

    const jugador = await prisma.jugador.findUnique({
      where: { rut: rut_jugador },
      select: { rut: true, nombre_completo: true, activo: true, lista_negra: true },
    })

    if (!jugador) {
      return res.status(404).json({ ok: false, codigo: 'JUGADOR_NO_ENCONTRADO', mensaje: 'El jugador solicitado no existe.' })
    }

    if (!jugador.activo) {
      return res.status(400).json({ ok: false, codigo: 'JUGADOR_INACTIVO', mensaje: 'El jugador esta inactivo y no puede ser inscrito.' })
    }

    if (jugador.lista_negra) {
      return res.status(400).json({ ok: false, codigo: 'JUGADOR_EN_LISTA_NEGRA', mensaje: 'El jugador esta en lista negra y no puede ser inscrito.' })
    }

    const inscripcionExistente = await prisma.inscripcion.findFirst({
      where: { id_torneo, rut_jugador },
    })

    if (inscripcionExistente) {
      return res.status(400).json({ ok: false, codigo: 'JUGADOR_YA_INSCRITO', mensaje: 'El jugador ya esta inscrito en este torneo.' })
    }

    if (torneo.capacidad_maxima != null) {
      const totalInscritos = await prisma.inscripcion.count({ where: { id_torneo } })
      if (totalInscritos >= torneo.capacidad_maxima) {
        return res.status(400).json({ ok: false, codigo: 'TORNEO_LLENO', mensaje: 'El torneo alcanzo su capacidad maxima de jugadores.' })
      }
    }

    // Solo aplicar free chip si el torneo lo permite
    const aplicarFreeChip = tiene_free_chip && (torneo.poker?.free_chip_permitido ?? false)

    const nuevaInscripcion = await prisma.inscripcion.create({
      data: { id_torneo, rut_jugador, tiene_free_chip: aplicarFreeChip },
      include: incluirJugador,
    })

    return res.status(201).json({ ok: true, datos: { inscripcion: nuevaInscripcion } })
  } catch (error) {
    console.error('Error en crearInscripcion:', error)
    return res.status(500).json({ ok: false, codigo: 'ERROR_INTERNO', mensaje: 'Error interno del servidor.' })
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/inscripciones/:id
// Elimina fisicamente la inscripcion del torneo
// ---------------------------------------------------------------------------
export const eliminarInscripcion = async (req, res) => {
  const id = parseInt(req.params.id)

  try {
    const inscripcion = await prisma.inscripcion.findUnique({ where: { id_inscripcion: id } })

    if (!inscripcion) {
      return res.status(404).json({ ok: false, codigo: 'INSCRIPCION_NO_ENCONTRADA', mensaje: 'La inscripcion no existe.' })
    }

    await prisma.inscripcion.delete({ where: { id_inscripcion: id } })

    return res.json({ ok: true, datos: { id_inscripcion: id } })
  } catch (error) {
    console.error('Error en eliminarInscripcion:', error)
    return res.status(500).json({ ok: false, codigo: 'ERROR_INTERNO', mensaje: 'Error interno del servidor.' })
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/inscripciones/:id/bust-out
// Marca al jugador como ELIMINADO, guarda ronda y posicion final
// ---------------------------------------------------------------------------
export const bustOut = async (req, res) => {
  const id = parseInt(req.params.id)
  const { ronda, pos_final } = req.body

  try {
    const inscripcion = await prisma.inscripcion.findUnique({ where: { id_inscripcion: id } })

    if (!inscripcion) {
      return res.status(404).json({ ok: false, codigo: 'INSCRIPCION_NO_ENCONTRADA', mensaje: 'La inscripcion no existe.' })
    }

    if (inscripcion.estado === 'ELIMINADO') {
      return res.status(400).json({ ok: false, codigo: 'YA_ELIMINADO', mensaje: 'El jugador ya fue eliminado.' })
    }

    const actualizada = await prisma.inscripcion.update({
      where: { id_inscripcion: id },
      data: {
        estado: 'ELIMINADO',
        ronda_eliminacion: ronda,
        pos_final,
        fecha_eliminacion: new Date(),
      },
      include: incluirJugador,
    })

    return res.json({ ok: true, datos: { inscripcion: actualizada } })
  } catch (error) {
    console.error('Error en bustOut:', error)
    return res.status(500).json({ ok: false, codigo: 'ERROR_INTERNO', mensaje: 'Error interno del servidor.' })
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/inscripciones/:id/rebuy
// Solo disponible si el jugador esta ELIMINADO. Vuelve a ACTIVO y agrega
// un registro en historial_rebuys.
// ---------------------------------------------------------------------------
export const registrarRebuy = async (req, res) => {
  const id = parseInt(req.params.id)

  try {
    const inscripcion = await prisma.inscripcion.findUnique({
      where: { id_inscripcion: id },
      include: { torneo: { include: { poker: { select: { rebuy_permitido: true } } } } },
    })

    if (!inscripcion) {
      return res.status(404).json({ ok: false, codigo: 'INSCRIPCION_NO_ENCONTRADA', mensaje: 'La inscripcion no existe.' })
    }

    if (!inscripcion.torneo?.poker?.rebuy_permitido) {
      return res.status(400).json({ ok: false, codigo: 'REBUY_NO_PERMITIDO', mensaje: 'Este torneo no permite rebuys.' })
    }

    if (inscripcion.estado !== 'ELIMINADO') {
      return res.status(400).json({ ok: false, codigo: 'JUGADOR_NO_ELIMINADO', mensaje: 'Solo se puede hacer rebuy si el jugador esta eliminado.' })
    }

    const historialActual = Array.isArray(inscripcion.historial_rebuys)
      ? inscripcion.historial_rebuys
      : []

    const nuevoHistorial = [...historialActual, { fecha: new Date().toISOString() }]

    const actualizada = await prisma.inscripcion.update({
      where: { id_inscripcion: id },
      data: {
        estado: 'ACTIVO',
        ronda_eliminacion: null,
        pos_final: null,
        fecha_eliminacion: null,
        historial_rebuys: nuevoHistorial,
      },
      include: incluirJugador,
    })

    return res.json({ ok: true, datos: { inscripcion: actualizada } })
  } catch (error) {
    console.error('Error en registrarRebuy:', error)
    return res.status(500).json({ ok: false, codigo: 'ERROR_INTERNO', mensaje: 'Error interno del servidor.' })
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/inscripciones/:id/free-chip
// Asigna free chip al jugador si el torneo lo permite
// ---------------------------------------------------------------------------
export const asignarFreeChip = async (req, res) => {
  const id = parseInt(req.params.id)

  try {
    const inscripcion = await prisma.inscripcion.findUnique({
      where: { id_inscripcion: id },
      include: { torneo: { include: { poker: { select: { free_chip_permitido: true } } } } },
    })

    if (!inscripcion) {
      return res.status(404).json({ ok: false, codigo: 'INSCRIPCION_NO_ENCONTRADA', mensaje: 'La inscripcion no existe.' })
    }

    if (!inscripcion.torneo?.poker?.free_chip_permitido) {
      return res.status(400).json({ ok: false, codigo: 'FREE_CHIP_NO_PERMITIDO', mensaje: 'Este torneo no permite free chip.' })
    }

    if (inscripcion.tiene_free_chip) {
      return res.status(400).json({ ok: false, codigo: 'FREE_CHIP_YA_ASIGNADO', mensaje: 'El jugador ya tiene free chip asignado.' })
    }

    const actualizada = await prisma.inscripcion.update({
      where: { id_inscripcion: id },
      data: { tiene_free_chip: true },
      include: incluirJugador,
    })

    return res.json({ ok: true, datos: { inscripcion: actualizada } })
  } catch (error) {
    console.error('Error en asignarFreeChip:', error)
    return res.status(500).json({ ok: false, codigo: 'ERROR_INTERNO', mensaje: 'Error interno del servidor.' })
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/inscripciones/:id/anular-bust-out
// Revierte el bust out: vuelve al jugador a ACTIVO y limpia los campos de eliminacion
// ---------------------------------------------------------------------------
export const anularBustOut = async (req, res) => {
  const id = parseInt(req.params.id)

  try {
    const inscripcion = await prisma.inscripcion.findUnique({ where: { id_inscripcion: id } })

    if (!inscripcion) {
      return res.status(404).json({ ok: false, codigo: 'INSCRIPCION_NO_ENCONTRADA', mensaje: 'La inscripcion no existe.' })
    }

    if (inscripcion.estado !== 'ELIMINADO') {
      return res.status(400).json({ ok: false, codigo: 'JUGADOR_NO_ELIMINADO', mensaje: 'El jugador no esta eliminado.' })
    }

    const actualizada = await prisma.inscripcion.update({
      where: { id_inscripcion: id },
      data: {
        estado: 'ACTIVO',
        ronda_eliminacion: null,
        pos_final: null,
        fecha_eliminacion: null,
      },
      include: incluirJugador,
    })

    return res.json({ ok: true, datos: { inscripcion: actualizada } })
  } catch (error) {
    console.error('Error en anularBustOut:', error)
    return res.status(500).json({ ok: false, codigo: 'ERROR_INTERNO', mensaje: 'Error interno del servidor.' })
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/inscripciones/:id/anular-rebuy
// Quita el ultimo rebuy del historial. Si el jugador esta ACTIVO lo vuelve a
// ELIMINADO (deshace el rebuy que lo reingreso). Solo disponible si tiene rebuys
// y el estado es ACTIVO.
// ---------------------------------------------------------------------------
export const anularRebuy = async (req, res) => {
  const id = parseInt(req.params.id)

  try {
    const inscripcion = await prisma.inscripcion.findUnique({
      where: { id_inscripcion: id },
      include: { torneo: { include: { poker: { select: { rebuy_permitido: true } } } } },
    })

    if (!inscripcion) {
      return res.status(404).json({ ok: false, codigo: 'INSCRIPCION_NO_ENCONTRADA', mensaje: 'La inscripcion no existe.' })
    }

    if (!inscripcion.torneo?.poker?.rebuy_permitido) {
      return res.status(400).json({ ok: false, codigo: 'REBUY_NO_PERMITIDO', mensaje: 'Este torneo no permite rebuys.' })
    }

    const historialActual = Array.isArray(inscripcion.historial_rebuys)
      ? inscripcion.historial_rebuys
      : []

    if (historialActual.length === 0) {
      return res.status(400).json({ ok: false, codigo: 'SIN_REBUYS', mensaje: 'El jugador no tiene rebuys registrados.' })
    }

    if (inscripcion.estado !== 'ACTIVO') {
      return res.status(400).json({ ok: false, codigo: 'ESTADO_INVALIDO', mensaje: 'Solo se puede anular un rebuy si el jugador esta activo.' })
    }

    const nuevoHistorial = historialActual.slice(0, -1)

    const actualizada = await prisma.inscripcion.update({
      where: { id_inscripcion: id },
      data: {
        estado: 'ELIMINADO',
        historial_rebuys: nuevoHistorial,
      },
      include: incluirJugador,
    })

    return res.json({ ok: true, datos: { inscripcion: actualizada } })
  } catch (error) {
    console.error('Error en anularRebuy:', error)
    return res.status(500).json({ ok: false, codigo: 'ERROR_INTERNO', mensaje: 'Error interno del servidor.' })
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/inscripciones/:id/anular-free-chip
// Revierte la asignacion de free chip
// ---------------------------------------------------------------------------
export const anularFreeChip = async (req, res) => {
  const id = parseInt(req.params.id)

  try {
    const inscripcion = await prisma.inscripcion.findUnique({
      where: { id_inscripcion: id },
      include: { torneo: { include: { poker: { select: { free_chip_permitido: true } } } } },
    })

    if (!inscripcion) {
      return res.status(404).json({ ok: false, codigo: 'INSCRIPCION_NO_ENCONTRADA', mensaje: 'La inscripcion no existe.' })
    }

    if (!inscripcion.tiene_free_chip) {
      return res.status(400).json({ ok: false, codigo: 'FREE_CHIP_NO_ASIGNADO', mensaje: 'El jugador no tiene free chip asignado.' })
    }

    const actualizada = await prisma.inscripcion.update({
      where: { id_inscripcion: id },
      data: { tiene_free_chip: false },
      include: incluirJugador,
    })

    return res.json({ ok: true, datos: { inscripcion: actualizada } })
  } catch (error) {
    console.error('Error en anularFreeChip:', error)
    return res.status(500).json({ ok: false, codigo: 'ERROR_INTERNO', mensaje: 'Error interno del servidor.' })
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/inscripciones/:id/addon
// Asigna add-on al jugador si el torneo lo permite
// ---------------------------------------------------------------------------
export const asignarAddon = async (req, res) => {
  const id = parseInt(req.params.id)

  try {
    const inscripcion = await prisma.inscripcion.findUnique({
      where: { id_inscripcion: id },
      include: { torneo: { include: { poker: { select: { addon_permitido: true } } } } },
    })

    if (!inscripcion) {
      return res.status(404).json({ ok: false, codigo: 'INSCRIPCION_NO_ENCONTRADA', mensaje: 'La inscripcion no existe.' })
    }

    if (!inscripcion.torneo?.poker?.addon_permitido) {
      return res.status(400).json({ ok: false, codigo: 'ADDON_NO_PERMITIDO', mensaje: 'Este torneo no permite add-on.' })
    }

    if (inscripcion.tiene_addon) {
      return res.status(400).json({ ok: false, codigo: 'ADDON_YA_ASIGNADO', mensaje: 'El jugador ya tiene add-on asignado.' })
    }

    const actualizada = await prisma.inscripcion.update({
      where: { id_inscripcion: id },
      data: { tiene_addon: true },
      include: incluirJugador,
    })

    return res.json({ ok: true, datos: { inscripcion: actualizada } })
  } catch (error) {
    console.error('Error en asignarAddon:', error)
    return res.status(500).json({ ok: false, codigo: 'ERROR_INTERNO', mensaje: 'Error interno del servidor.' })
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/inscripciones/:id/anular-addon
// Revierte la asignacion de add-on
// ---------------------------------------------------------------------------
export const anularAddon = async (req, res) => {
  const id = parseInt(req.params.id)

  try {
    const inscripcion = await prisma.inscripcion.findUnique({
      where: { id_inscripcion: id },
      include: { torneo: { include: { poker: { select: { addon_permitido: true } } } } },
    })

    if (!inscripcion) {
      return res.status(404).json({ ok: false, codigo: 'INSCRIPCION_NO_ENCONTRADA', mensaje: 'La inscripcion no existe.' })
    }

    if (!inscripcion.tiene_addon) {
      return res.status(400).json({ ok: false, codigo: 'ADDON_NO_ASIGNADO', mensaje: 'El jugador no tiene add-on asignado.' })
    }

    const actualizada = await prisma.inscripcion.update({
      where: { id_inscripcion: id },
      data: { tiene_addon: false },
      include: incluirJugador,
    })

    return res.json({ ok: true, datos: { inscripcion: actualizada } })
  } catch (error) {
    console.error('Error en anularAddon:', error)
    return res.status(500).json({ ok: false, codigo: 'ERROR_INTERNO', mensaje: 'Error interno del servidor.' })
  }
}
