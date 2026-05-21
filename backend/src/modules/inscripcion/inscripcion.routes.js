import { Router } from 'express'
import {
  crearInscripcion,
  eliminarInscripcion,
  bustOut,
  anularBustOut,
  registrarRebuy,
  anularRebuy,
  asignarFreeChip,
  anularFreeChip,
  asignarAddon,
  anularAddon,
} from './inscripcion.controller.js'
import verificarToken from '../../middlewares/auth.middleware.js'
import verificarRol from '../../middlewares/roles.middleware.js'
import validar from '../../middlewares/validate.middleware.js'
import { schemaCrearInscripcion, schemaBustOut } from './inscripcion.schema.js'

const router = Router()

router.use(verificarToken)

// Inscribir jugador en torneo
router.post(
  '/',
  verificarRol('ADMIN', 'DIRECTOR', 'SUPERVISOR', 'CAJERO'),
  validar(schemaCrearInscripcion),
  crearInscripcion
)

// Eliminar inscripcion del torneo
router.delete(
  '/:id',
  verificarRol('ADMIN', 'DIRECTOR', 'SUPERVISOR'),
  eliminarInscripcion
)

// Bust out — jugador eliminado con ronda y posicion
router.patch(
  '/:id/bust-out',
  verificarRol('ADMIN', 'DIRECTOR', 'SUPERVISOR'),
  validar(schemaBustOut),
  bustOut
)

// Rebuy — solo si esta ELIMINADO y el torneo lo permite
router.patch(
  '/:id/rebuy',
  verificarRol('ADMIN', 'DIRECTOR', 'SUPERVISOR', 'CAJERO'),
  registrarRebuy
)

// Asignar free chip
router.patch(
  '/:id/free-chip',
  verificarRol('ADMIN', 'DIRECTOR', 'SUPERVISOR', 'CAJERO'),
  asignarFreeChip
)

// Asignar add-on
router.patch(
  '/:id/addon',
  verificarRol('ADMIN', 'DIRECTOR', 'SUPERVISOR', 'CAJERO'),
  asignarAddon
)

// Anular bust out — vuelve el jugador a ACTIVO
router.patch(
  '/:id/anular-bust-out',
  verificarRol('ADMIN', 'DIRECTOR', 'SUPERVISOR'),
  anularBustOut
)

// Anular rebuy — quita el ultimo rebuy y vuelve el jugador a ELIMINADO
router.patch(
  '/:id/anular-rebuy',
  verificarRol('ADMIN', 'DIRECTOR', 'SUPERVISOR', 'CAJERO'),
  anularRebuy
)

// Anular free chip — revierte la asignacion
router.patch(
  '/:id/anular-free-chip',
  verificarRol('ADMIN', 'DIRECTOR', 'SUPERVISOR', 'CAJERO'),
  anularFreeChip
)

// Anular add-on — revierte la asignacion
router.patch(
  '/:id/anular-addon',
  verificarRol('ADMIN', 'DIRECTOR', 'SUPERVISOR', 'CAJERO'),
  anularAddon
)

export default router
