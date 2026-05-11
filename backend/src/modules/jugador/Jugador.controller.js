import prisma from '../../config/db.js'

export const listarJugadores = async (req, res) => {
  const { busqueda = '', pagina = '1', limite = '20' } = req.query

  const paginaNum = Math.max(1, parseInt(pagina))
  const limiteNum = Math.min(100, Math.max(1, parseInt(limite)))
  const saltar = (paginaNum - 1) * limiteNum

  const where = busqueda.trim()
    ? {
        OR: [
          { rut: { contains: busqueda.trim(), mode: 'insensitive' } },
          { nombre_completo: { contains: busqueda.trim(), mode: 'insensitive' } },
        ],
      }
    : {}

  try {
    const [jugadores, total] = await Promise.all([
      prisma.jugador.findMany({
        where,
        orderBy: { nombre_completo: 'asc' },
        skip: saltar,
        take: limiteNum,
        select: {
          rut: true,
          nombre_completo: true,
          email: true,
          telefono: true,
          nacionalidad: true,
          genero: true,
          activo: true,
          lista_negra: true,
          created_at: true,
        },
      }),
      prisma.jugador.count({ where }),
    ])

    return res.json({
      ok: true,
      datos: {
        jugadores,
        paginacion: {
          total,
          pagina: paginaNum,
          limite: limiteNum,
          totalPaginas: Math.ceil(total / limiteNum),
        },
      },
    })
  } catch (error) {
    console.error('Error en listarJugadores:', error)
    return res.status(500).json({
      ok: false,
      codigo: 'ERROR_INTERNO',
      mensaje: 'Error interno del servidor.',
    })
  }
}

export const obtenerJugador = async (req, res) => {
  const { rut } = req.params

  try {
    const jugador = await prisma.jugador.findUnique({
      where: { rut },
      select: {
        rut: true,
        nombre_completo: true,
        email: true,
        telefono: true,
        nacionalidad: true,
        profesion: true,
        genero: true,
        domicilio: true,
        fecha_nacimiento: true,
        activo: true,
        lista_negra: true,
        motivo_lista_negra: true,
        created_at: true,
        updated_at: true,
      },
    })

    if (!jugador) {
      return res.status(404).json({
        ok: false,
        codigo: 'JUGADOR_NO_ENCONTRADO',
        mensaje: 'El jugador no existe.',
      })
    }

    return res.json({ ok: true, datos: jugador })
  } catch (error) {
    console.error('Error en obtenerJugador:', error)
    return res.status(500).json({
      ok: false,
      codigo: 'ERROR_INTERNO',
      mensaje: 'Error interno del servidor.',
    })
  }
}

export const crearJugador = async (req, res) => {
  const {
    rut, nombre_completo, email, telefono,
    nacionalidad, profesion, genero, domicilio, fecha_nacimiento,
  } = req.body

  try {
    const existente = await prisma.jugador.findUnique({ where: { rut } })

    if (existente) {
      return res.status(409).json({
        ok: false,
        codigo: 'RUT_DUPLICADO',
        mensaje: 'Ya existe un jugador registrado con ese RUT.',
      })
    }

    const jugador = await prisma.jugador.create({
      data: {
        rut,
        nombre_completo,
        email: email ?? null,
        telefono: telefono ?? null,
        nacionalidad: nacionalidad ?? null,
        profesion: profesion ?? null,
        genero: genero ?? null,
        domicilio: domicilio ?? null,
        fecha_nacimiento: fecha_nacimiento ? new Date(fecha_nacimiento) : null,
      },
      select: {
        rut: true,
        nombre_completo: true,
        email: true,
        telefono: true,
        nacionalidad: true,
        genero: true,
        activo: true,
        lista_negra: true,
        created_at: true,
      },
    })

    return res.status(201).json({ ok: true, datos: jugador })
  } catch (error) {
    console.error('Error en crearJugador:', error)
    return res.status(500).json({
      ok: false,
      codigo: 'ERROR_INTERNO',
      mensaje: 'Error interno del servidor.',
    })
  }
}

export const editarJugador = async (req, res) => {
  const { rut } = req.params
  const {
    nombre_completo, email, telefono,
    nacionalidad, profesion, genero, domicilio, fecha_nacimiento,
  } = req.body

  try {
    const jugador = await prisma.jugador.findUnique({ where: { rut } })

    if (!jugador) {
      return res.status(404).json({
        ok: false,
        codigo: 'JUGADOR_NO_ENCONTRADO',
        mensaje: 'El jugador no existe.',
      })
    }

    const actualizado = await prisma.jugador.update({
      where: { rut },
      data: {
        nombre_completo,
        email: email ?? null,
        telefono: telefono ?? null,
        nacionalidad: nacionalidad ?? null,
        profesion: profesion ?? null,
        genero: genero ?? null,
        domicilio: domicilio ?? null,
        fecha_nacimiento: fecha_nacimiento ? new Date(fecha_nacimiento) : null,
      },
      select: {
        rut: true,
        nombre_completo: true,
        email: true,
        telefono: true,
        nacionalidad: true,
        genero: true,
        activo: true,
        lista_negra: true,
        updated_at: true,
      },
    })

    return res.json({ ok: true, datos: actualizado })
  } catch (error) {
    console.error('Error en editarJugador:', error)
    return res.status(500).json({
      ok: false,
      codigo: 'ERROR_INTERNO',
      mensaje: 'Error interno del servidor.',
    })
  }
}

export const cambiarEstadoJugador = async (req, res) => {
  const { rut } = req.params
  const { activo } = req.body

  try {
    const jugador = await prisma.jugador.findUnique({ where: { rut } })

    if (!jugador) {
      return res.status(404).json({
        ok: false,
        codigo: 'JUGADOR_NO_ENCONTRADO',
        mensaje: 'El jugador no existe.',
      })
    }

    const actualizado = await prisma.jugador.update({
      where: { rut },
      data: { activo },
      select: { rut: true, nombre_completo: true, activo: true },
    })

    return res.json({ ok: true, datos: actualizado })
  } catch (error) {
    console.error('Error en cambiarEstadoJugador:', error)
    return res.status(500).json({
      ok: false,
      codigo: 'ERROR_INTERNO',
      mensaje: 'Error interno del servidor.',
    })
  }
}

export const cambiarListaNegra = async (req, res) => {
  const { rut } = req.params
  const { lista_negra, motivo } = req.body

  try {
    const jugador = await prisma.jugador.findUnique({ where: { rut } })

    if (!jugador) {
      return res.status(404).json({
        ok: false,
        codigo: 'JUGADOR_NO_ENCONTRADO',
        mensaje: 'El jugador no existe.',
      })
    }

    const actualizado = await prisma.jugador.update({
      where: { rut },
      data: {
        lista_negra,
        motivo_lista_negra: lista_negra ? (motivo ?? null) : null,
      },
      select: {
        rut: true,
        nombre_completo: true,
        lista_negra: true,
        motivo_lista_negra: true,
      },
    })

    return res.json({ ok: true, datos: actualizado })
  } catch (error) {
    console.error('Error en cambiarListaNegra:', error)
    return res.status(500).json({
      ok: false,
      codigo: 'ERROR_INTERNO',
      mensaje: 'Error interno del servidor.',
    })
  }
}

export const eliminarJugador = async (req, res) => {
  const { rut } = req.params

  try {
    const jugador = await prisma.jugador.findUnique({
      where: { rut },
      include: { _count: { select: { inscripciones: true } } },
    })

    if (!jugador) {
      return res.status(404).json({
        ok: false,
        codigo: 'JUGADOR_NO_ENCONTRADO',
        mensaje: 'El jugador no existe.',
      })
    }

    if (jugador._count.inscripciones > 0) {
      return res.status(409).json({
        ok: false,
        codigo: 'JUGADOR_CON_HISTORIAL',
        mensaje: `No se puede eliminar este jugador porque tiene ${jugador._count.inscripciones} inscripcion(es) registrada(s).`,
      })
    }

    await prisma.jugador.delete({ where: { rut } })

    return res.json({
      ok: true,
      datos: { mensaje: 'Jugador eliminado correctamente.' },
    })
  } catch (error) {
    console.error('Error en eliminarJugador:', error)
    return res.status(500).json({
      ok: false,
      codigo: 'ERROR_INTERNO',
      mensaje: 'Error interno del servidor.',
    })
  }
}