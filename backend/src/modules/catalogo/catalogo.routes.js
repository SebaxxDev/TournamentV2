import { Router } from 'express';
import { listarJuegos } from './catalogo.controller.js';
import verificarToken from '../../middlewares/auth.middleware.js';

const router = Router();

router.get('/juegos', verificarToken, listarJuegos);

export default router;