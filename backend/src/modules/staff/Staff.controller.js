import argon2 from 'argon2'
import prisma from '../../config/db.js'

export const listarStaff = async (req, res) => {
  try {
    const staff = await prisma.staff.findMany({
      where: { eliminado: false },
      orderBy: { created_at: 'desc' },
      select: {
        id_staff: true,
        username: true,
        nombre_completo: true,
        rol: true,
        email: true,
        activo: true,
        created_at: true,
        updated_at: true,
      },
    })

    return res.json({ ok: true, datos: staff })
  } catch (error) {
    console.error('Error en listarStaff:', error)
    return res.status(500).json({
      ok: false,
      codigo: 'ERROR_INTERNO',
      mensaje: 'Error interno del servidor.',
    })
  }
}

export const obtenerStaff = async (req, res) => {
  const { id } = req.params

  try {
    const staff = await prisma.staff.findUnique({
      where: { id_staff: Number(id) },
      select: {
        id_staff: true,
        username: true,
        nombre_completo: true,
        rol: true,
        email: true,
        activo: true,
        created_at: true,
        updated_at: true,
      },
    })

    if (!staff || staff.eliminado) {
      return res.status(404).json({
        ok: false,
        codigo: 'STAFF_NO_ENCONTRADO',
        mensaje: 'El usuario no existe.',
      })
    }

    return res.json({ ok: true, datos: staff })
  } catch (error) {
    console.error('Error en obtenerStaff:', error)
    return res.status(500).json({
      ok: false,
      codigo: 'ERROR_INTERNO',
      mensaje: 'Error interno del servidor.',
    })
  }
}

export const crearStaff = async (req, res) => {
  const { username, password, nombre_completo, rol, email } = req.body

  try {
    const existente = await prisma.staff.findUnique({ where: { username } })

    if (existente) {
      return res.status(409).json({
        ok: false,
        codigo: 'USERNAME_DUPLICADO',
        mensaje: 'El username ya esta en uso.',
      })
    }

    const password_hash = await argon2.hash(password)

    const nuevoStaff = await prisma.staff.create({
      data: {
        username,
        password_hash,
        nombre_completo,
        rol,
        email: email ?? null,
        activo: true,
      },
      select: {
        id_staff: true,
        username: true,
        nombre_completo: true,
        rol: true,
        email: true,
        activo: true,
        created_at: true,
      },
    })

    return res.status(201).json({ ok: true, datos: nuevoStaff })
  } catch (error) {
    console.error('Error en crearStaff:', error)
    return res.status(500).json({
      ok: false,
      codigo: 'ERROR_INTERNO',
      mensaje: 'Error interno del servidor.',
    })
  }
}

export const editarStaff = async (req, res) => {
  const { id } = req.params
  const { nombre_completo, rol, email, password } = req.body

  try {
    const staff = await prisma.staff.findUnique({
      where: { id_staff: Number(id) },
    })

    if (!staff || staff.eliminado) {
      return res.status(404).json({
        ok: false,
        codigo: 'STAFF_NO_ENCONTRADO',
        mensaje: 'El usuario no existe.',
      })
    }

    const data = { nombre_completo, rol, email: email ?? null }

    if (password) {
      data.password_hash = await argon2.hash(password)
    }

    const actualizado = await prisma.staff.update({
      where: { id_staff: Number(id) },
      data,
      select: {
        id_staff: true,
        username: true,
        nombre_completo: true,
        rol: true,
        email: true,
        activo: true,
        updated_at: true,
      },
    })

    return res.json({ ok: true, datos: actualizado })
  } catch (error) {
    console.error('Error en editarStaff:', error)
    return res.status(500).json({
      ok: false,
      codigo: 'ERROR_INTERNO',
      mensaje: 'Error interno del servidor.',
    })
  }
}

export const cambiarEstadoStaff = async (req, res) => {
  const { id } = req.params
  const { activo } = req.body

  try {
    const staff = await prisma.staff.findUnique({
      where: { id_staff: Number(id) },
    })

    if (!staff || staff.eliminado) {
      return res.status(404).json({
        ok: false,
        codigo: 'STAFF_NO_ENCONTRADO',
        mensaje: 'El usuario no existe.',
      })
    }

    if (staff.rol === 'ADMIN' && !activo) {
      return res.status(403).json({
        ok: false,
        codigo: 'OPERACION_NO_PERMITIDA',
        mensaje: 'No se puede desactivar al administrador del sistema.',
      })
    }

    const actualizado = await prisma.staff.update({
      where: { id_staff: Number(id) },
      data: { activo },
      select: {
        id_staff: true,
        username: true,
        nombre_completo: true,
        rol: true,
        activo: true,
      },
    })

    return res.json({ ok: true, datos: actualizado })
  } catch (error) {
    console.error('Error en cambiarEstadoStaff:', error)
    return res.status(500).json({
      ok: false,
      codigo: 'ERROR_INTERNO',
      mensaje: 'Error interno del servidor.',
    })
  }
}

export const eliminarStaff = async (req, res) => {
  const { id } = req.params

  try {
    const staff = await prisma.staff.findUnique({
      where: { id_staff: Number(id) },
    })

    if (!staff || staff.eliminado) {
      return res.status(404).json({
        ok: false,
        codigo: 'STAFF_NO_ENCONTRADO',
        mensaje: 'El usuario no existe.',
      })
    }

    if (staff.rol === 'ADMIN') {
      return res.status(403).json({
        ok: false,
        codigo: 'OPERACION_NO_PERMITIDA',
        mensaje: 'No se puede eliminar al administrador del sistema.',
      })
    }

    await prisma.staff.update({
      where: { id_staff: Number(id) },
      data: {
        eliminado: true,
        eliminado_at: new Date(),
        activo: false,
      },
    })

    return res.json({
      ok: true,
      datos: { mensaje: 'Usuario eliminado correctamente.' },
    })
  } catch (error) {
    console.error('Error en eliminarStaff:', error)
    return res.status(500).json({
      ok: false,
      codigo: 'ERROR_INTERNO',
      mensaje: 'Error interno del servidor.',
    })
  }
}