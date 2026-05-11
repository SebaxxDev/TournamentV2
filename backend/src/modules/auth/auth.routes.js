import { Router } from 'express'
import { login, logout, obtenerSesion } from './auth.controller.js'
import verificarToken from '../../middlewares/auth.middleware.js'
import validar from '../../middlewares/validate.middleware.js'
import limitadorLogin from '../../middlewares/rateLimit.middleware.js'
import { schemaLogin } from './auth.schema.js'

const router = Router()

router.post('/login', limitadorLogin, validar(schemaLogin), login)
router.post('/logout', verificarToken, logout)
router.get('/sesion', verificarToken, obtenerSesion)

export default router