import argon2 from 'argon2'
import jwt from 'jsonwebtoken'
import prisma from '../../config/db.js'

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 15 * 60 * 60 * 1000,
}

export const login = async (req, res) => {
  const { username, password } = req.body

  try {
    const staff = await prisma.staff.findUnique({
      where: { username },
    })

    if (!staff || !staff.activo) {
      return res.status(401).json({
        ok: false,
        codigo: 'CREDENCIALES_INVALIDAS',
        mensaje: 'Usuario o contrasena incorrectos.',
      })
    }

    const passwordValida = await argon2.verify(staff.password_hash, password)

    if (!passwordValida) {
      return res.status(401).json({
        ok: false,
        codigo: 'CREDENCIALES_INVALIDAS',
        mensaje: 'Usuario o contrasena incorrectos.',
      })
    }

    const payload = {
      id: staff.id_staff,
      username: staff.username,
      nombre: staff.nombre_completo,
      rol: staff.rol,
    }

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    })

    res.cookie('token', token, COOKIE_OPTS)

    return res.json({
      ok: true,
      datos: {
        id: staff.id_staff,
        username: staff.username,
        nombre: staff.nombre_completo,
        rol: staff.rol,
      },
    })
  } catch (error) {
    console.error('Error en login:', error)
    return res.status(500).json({
      ok: false,
      codigo: 'ERROR_INTERNO',
      mensaje: 'Error interno del servidor.',
    })
  }
}

export const logout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  })

  return res.json({
    ok: true,
    datos: { mensaje: 'Sesion cerrada correctamente.' },
  })
}

export const obtenerSesion = (req, res) => {
  return res.json({
    ok: true,
    datos: req.usuario,
  })
}