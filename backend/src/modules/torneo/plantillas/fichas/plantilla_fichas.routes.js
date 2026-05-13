import { Router } from 'express';
import {
  listarPlantillasFichas,
  crearPlantillaFicha,
  eliminarPlantillaFicha,
} from './plantilla_fichas.controller.js';
import verificarToken from '../../../../middlewares/auth.middleware.js';
import verificarRol from '../../../../middlewares/roles.middleware.js';
import validar from '../../../../middlewares/validate.middleware.js';
import { crearPlantillaFichaSchema } from './plantilla_fichas.schema.js';

const router = Router();

router.get(
  '/',
  verificarToken,
  verificarRol('ADMIN', 'DIRECTOR'),
  listarPlantillasFichas
);

router.post(
  '/',
  verificarToken,
  verificarRol('ADMIN', 'DIRECTOR'),
  validar(crearPlantillaFichaSchema),
  crearPlantillaFicha
);

router.delete(
  '/:id',
  verificarToken,
  verificarRol('ADMIN', 'DIRECTOR'),
  eliminarPlantillaFicha
);

export default router;
