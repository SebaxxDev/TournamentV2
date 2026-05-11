import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import verificarToken from '../../middlewares/auth.middleware.js'
import verificarRol from '../../middlewares/roles.middleware.js'
import validar from '../../middlewares/validate.middleware.js'
import { schemaCrearFicha, schemaEditarFicha } from './ficha.schema.js';
import {
  listarFichas,
  obtenerFicha,
  crearFicha,
  editarFicha,
  cambiarEstadoFicha,
  eliminarFicha,
} from './ficha.controller.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const almacenamiento = multer.diskStorage({
  destination: (req, file, cb) => {
    const destino = path.join(__dirname, '../../uploads/fichas');
    cb(null, destino);
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname);
    cb(null, `ficha_${Date.now()}${extension}`);
  },
});

const filtroImagenes = (req, file, cb) => {
  const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
  if (tiposPermitidos.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten imagenes JPG, PNG o WebP'));
  }
};

const subir = multer({
  storage: almacenamiento,
  fileFilter: filtroImagenes,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const router = Router();

router.use(verificarToken);

router.get('/',        verificarRol('ADMIN', 'DIRECTOR'), listarFichas);
router.get('/:id',     verificarRol('ADMIN', 'DIRECTOR'), obtenerFicha);
router.post('/',       verificarRol('ADMIN', 'DIRECTOR'), subir.single('imagen'), validar(schemaCrearFicha), crearFicha);
router.put('/:id',     verificarRol('ADMIN', 'DIRECTOR'), subir.single('imagen'), validar(schemaEditarFicha), editarFicha);
router.patch('/:id/estado', verificarRol('ADMIN', 'DIRECTOR'), cambiarEstadoFicha);
router.delete('/:id',  verificarRol('ADMIN'), eliminarFicha);

export default router;