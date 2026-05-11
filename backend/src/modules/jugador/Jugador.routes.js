import { Router } from 'express'
import {
  listarJugadores,
  obtenerJugador,
  crearJugador,
  editarJugador,
  cambiarEstadoJugador,
  cambiarListaNegra,
  eliminarJugador,
} from './jugador.controller.js'
import verificarToken from '../../middlewares/auth.middleware.js'
import verificarRol from '../../middlewares/roles.middleware.js'
import validar from '../../middlewares/validate.middleware.js'
import {
  schemaCrearJugador,
  schemaEditarJugador,
  schemaEstadoJugador,
  schemaListaNegra,
} from './jugador.schema.js'

const router = Router()

router.use(verificarToken)

// Listar y buscar — todos los roles del panel
router.get(
  '/',
  verificarRol('ADMIN', 'DIRECTOR', 'SUPERVISOR', 'CAJERO'),
  listarJugadores
)

// Ver detalle — todos los roles del panel
router.get(
  '/:rut',
  verificarRol('ADMIN', 'DIRECTOR', 'SUPERVISOR', 'CAJERO'),
  obtenerJugador
)

// Crear y editar — ADMIN, DIRECTOR, SUPERVISOR, CAJERO
router.post(
  '/',
  verificarRol('ADMIN', 'DIRECTOR', 'SUPERVISOR', 'CAJERO'),
  validar(schemaCrearJugador),
  crearJugador
)

router.put(
  '/:rut',
  verificarRol('ADMIN', 'DIRECTOR', 'SUPERVISOR', 'CAJERO'),
  validar(schemaEditarJugador),
  editarJugador
)

// Activar/desactivar — solo ADMIN y DIRECTOR
router.patch(
  '/:rut/estado',
  verificarRol('ADMIN', 'DIRECTOR'),
  validar(schemaEstadoJugador),
  cambiarEstadoJugador
)

// Lista negra — solo ADMIN y DIRECTOR
router.patch(
  '/:rut/lista-negra',
  verificarRol('ADMIN', 'DIRECTOR'),
  validar(schemaListaNegra),
  cambiarListaNegra
)

// Eliminar — solo ADMIN, solo si no tiene historial
router.delete(
  '/:rut',
  verificarRol('ADMIN'),
  eliminarJugador
)

export default router