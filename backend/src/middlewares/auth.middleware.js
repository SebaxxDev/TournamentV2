import jwt from 'jsonwebtoken'

const verificarToken = (req, res, next) => {
  const token = req.cookies?.token

  if (!token) {
    return res.status(401).json({
      ok: false,
      codigo: 'TOKEN_REQUERIDO',
      mensaje: 'Acceso no autorizado. Se requiere autenticacion.',
    })
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.usuario = payload
    next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        ok: false,
        codigo: 'TOKEN_EXPIRADO',
        mensaje: 'La sesion ha expirado. Inicie sesion nuevamente.',
      })
    }

    return res.status(401).json({
      ok: false,
      codigo: 'TOKEN_INVALIDO',
      mensaje: 'Token de autenticacion invalido.',
    })
  }
}

export default verificarToken