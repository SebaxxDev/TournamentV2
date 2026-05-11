import rateLimit from 'express-rate-limit'

const limitadorLogin = rateLimit({
  windowMs: (parseInt(process.env.VENTANA_LOGIN_MINUTOS) || 15) * 60 * 1000,
  max: parseInt(process.env.MAX_LOGIN_INTENTOS) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      ok: false,
      codigo: 'DEMASIADOS_INTENTOS',
      mensaje: 'Demasiados intentos de inicio de sesion. Intente nuevamente mas tarde.',
    })
  },
})

export default limitadorLogin