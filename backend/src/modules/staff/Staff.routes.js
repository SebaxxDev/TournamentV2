import { Router } from 'express'
import {
  listarStaff,
  obtenerStaff,
  crearStaff,
  editarStaff,
  cambiarEstadoStaff,
  eliminarStaff,
} from './staff.controller.js'
import verificarToken from '../../middlewares/auth.middleware.js'
import verificarRol from '../../middlewares/roles.middleware.js'
import validar from '../../middlewares/validate.middleware.js'
import { schemaCrearStaff, schemaEditarStaff, schemaEstadoStaff } from './staff.schema.js'

const router = Router()

router.use(verificarToken)
router.use(verificarRol('ADMIN', 'DIRECTOR'))

router.get('/', listarStaff)
router.get('/:id', obtenerStaff)
router.post('/', validar(schemaCrearStaff), crearStaff)
router.put('/:id', validar(schemaEditarStaff), editarStaff)
router.patch('/:id/estado', validar(schemaEstadoStaff), cambiarEstadoStaff)
router.delete('/:id', verificarRol('ADMIN'), eliminarStaff)

export default router