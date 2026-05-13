import { Router } from 'express';
import {
  listarPlantillasCiegas,
  crearPlantillaCiegas,
  eliminarPlantillaCiegas,
} from './plantilla_ciegas.controller.js';
import verificarToken from '../../../../middlewares/auth.middleware.js';
import verificarRol from '../../../../middlewares/roles.middleware.js';
import validar from '../../../../middlewares/validate.middleware.js';
import { crearPlantillaCiegasSchema } from './plantilla_ciegas.schema.js';

const router = Router();

router.get(
  '/',
  verificarToken,
  verificarRol('ADMIN', 'DIRECTOR'),
  listarPlantillasCiegas
);

router.post(
  '/',
  verificarToken,
  verificarRol('ADMIN', 'DIRECTOR'),
  validar(crearPlantillaCiegasSchema),
  crearPlantillaCiegas
);

router.delete(
  '/:id',
  verificarToken,
  verificarRol('ADMIN', 'DIRECTOR'),
  eliminarPlantillaCiegas
);

export default router;
