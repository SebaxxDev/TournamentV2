const validar = (schema) => {
  return (req, res, next) => {
    const resultado = schema.safeParse(req.body)

    if (!resultado.success) {
      const errores = resultado.error.errors.map((e) => ({
        campo: e.path.join('.'),
        mensaje: e.message,
      }))

      return res.status(400).json({
        ok: false,
        codigo: 'DATOS_INVALIDOS',
        mensaje: 'Los datos enviados no son validos.',
        datos: { errores },
      })
    }

    req.body = resultado.data
    next()
  }
}

export default validar