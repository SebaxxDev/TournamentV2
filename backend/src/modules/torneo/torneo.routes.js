import { Router } from 'express';
import { crearTorneo, listarTorneos, obtenerTorneo, obtenerEstadoControl, publicarTorneo, obtenerEstadisticasDashboard } from './torneo.controller.js';
import verificarToken from '../../middlewares/auth.middleware.js';
import verificarRol from '../../middlewares/roles.middleware.js';
import validar from '../../middlewares/validate.middleware.js';
import { crearTorneoSchema } from './torneo.schema.js';

const router = Router();

router.get(
  '/',
  verificarToken,
  verificarRol('ADMIN', 'DIRECTOR', 'SUPERVISOR'),
  listarTorneos
);

router.get(
  '/:id',
  verificarToken,
  verificarRol('ADMIN', 'DIRECTOR', 'SUPERVISOR'),
  obtenerTorneo
);

router.post(
  '/',
  verificarToken,
  verificarRol('ADMIN', 'DIRECTOR'),
  validar(crearTorneoSchema),
  crearTorneo
);

router.get(
  '/dashboard/estadisticas',
  verificarToken,
  verificarRol('ADMIN', 'DIRECTOR', 'SUPERVISOR'),
  obtenerEstadisticasDashboard
);

router.get(
  '/:id/control',
  verificarToken,
  verificarRol('ADMIN', 'DIRECTOR', 'SUPERVISOR'),
  obtenerEstadoControl
);

router.patch(
  '/:id/publicar',
  verificarToken,
  verificarRol('ADMIN', 'DIRECTOR'),
  publicarTorneo
);

export default router;