const verificarRol = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({
        ok: false,
        codigo: 'TOKEN_REQUERIDO',
        mensaje: 'Acceso no autorizado.',
      })
    }

    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({
        ok: false,
        codigo: 'ROL_NO_AUTORIZADO',
        mensaje: 'No tiene permisos para realizar esta accion.',
      })
    }

    next()
  }
}

export default verificarRol