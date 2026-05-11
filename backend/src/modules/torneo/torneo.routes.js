import { Router } from 'express';
import { crearTorneo, listarTorneos, obtenerTorneo, publicarTorneo } from './torneo.controller.js';
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

router.patch(
  '/:id/publicar',
  verificarToken,
  verificarRol('ADMIN', 'DIRECTOR'),
  publicarTorneo
);

export default router;