import { Router } from 'express';
import {
  obtenerPlantillaCircuito,
  listarPlantillasCircuito,
  crearPlantillaCircuito,
  eliminarPlantillaCircuito,
} from './plantilla_circuito.controller.js';
import verificarToken from '../../../../middlewares/auth.middleware.js';
import verificarRol from '../../../../middlewares/roles.middleware.js';
import validar from '../../../../middlewares/validate.middleware.js';
import { crearPlantillaCircuitoSchema } from './plantilla_circuito.schema.js';

const router = Router();

router.get(
  '/',
  verificarToken,
  verificarRol('ADMIN', 'DIRECTOR'),
  listarPlantillasCircuito
);

router.get(
  '/:id',
  verificarToken,
  verificarRol('ADMIN', 'DIRECTOR'),
  obtenerPlantillaCircuito
);

router.post(
  '/',
  verificarToken,
  verificarRol('ADMIN', 'DIRECTOR'),
  validar(crearPlantillaCircuitoSchema),
  crearPlantillaCircuito
);

router.delete(
  '/:id',
  verificarToken,
  verificarRol('ADMIN', 'DIRECTOR'),
  eliminarPlantillaCircuito
);

export default router;
