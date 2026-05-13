import { Router } from 'express';
import { listarPlantillas, crearPlantilla, eliminarPlantilla } from './plantilla_premios.controller.js';
import verificarToken from '../../../../middlewares/auth.middleware.js';
import verificarRol from '../../../../middlewares/roles.middleware.js';
import validar from '../../../../middlewares/validate.middleware.js';
import { crearPlantillaSchema } from './plantilla_premios.schema.js';

const router = Router();

router.get(
  '/',
  verificarToken,
  verificarRol('ADMIN', 'DIRECTOR'),
  listarPlantillas
);

router.post(
  '/',
  verificarToken,
  verificarRol('ADMIN', 'DIRECTOR'),
  validar(crearPlantillaSchema),
  crearPlantilla
);

router.delete(
  '/:id',
  verificarToken,
  verificarRol('ADMIN', 'DIRECTOR'),
  eliminarPlantilla
);

export default router;