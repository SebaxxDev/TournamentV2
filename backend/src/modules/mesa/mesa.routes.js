import { Router } from 'express'
import verificarToken from '../../middlewares/auth.middleware.js'
import verificarRol from '../../middlewares/roles.middleware.js'
import validar from '../../middlewares/validate.middleware.js'
import { schemaMoverJugador, schemaAsignarJugador } from './mesa.schema.js'
import {
  listarMesas,
  crearMesa,
  eliminarMesa,
  agregarAsiento,
  quitarAsiento,
  moverJugador,
  asignarJugador,
} from './mesa.controller.js'

const router = Router()

// Todos los endpoints requieren autenticacion
router.use(verificarToken)

// Listar mesas de un torneo
router.get(
  '/torneo/:idTorneo',
  verificarRol('ADMIN', 'DIRECTOR', 'SUPERVISOR', 'CAJERO'),
  listarMesas
)

// Crear mesa
router.post(
  '/',
  verificarRol('ADMIN', 'DIRECTOR', 'SUPERVISOR'),
  crearMesa
)

// Eliminar mesa
router.delete(
  '/:idMesa',
  verificarRol('ADMIN', 'DIRECTOR', 'SUPERVISOR'),
  eliminarMesa
)

// Agregar asiento a una mesa
router.post(
  '/:idMesa/asiento',
  verificarRol('ADMIN', 'DIRECTOR', 'SUPERVISOR'),
  agregarAsiento
)

// Quitar asiento de una mesa
router.delete(
  '/:idMesa/asiento',
  verificarRol('ADMIN', 'DIRECTOR', 'SUPERVISOR'),
  quitarAsiento
)

// Mover jugador entre asientos (ya tiene asiento origen)
router.put(
  '/mover-jugador',
  verificarRol('ADMIN', 'DIRECTOR', 'SUPERVISOR'),
  validar(schemaMoverJugador),
  moverJugador
)

// Asignar jugador a un asiento por primera vez (sin asiento origen)
router.put(
  '/asignar-jugador',
  verificarRol('ADMIN', 'DIRECTOR', 'SUPERVISOR'),
  validar(schemaAsignarJugador),
  asignarJugador
)

export default router
