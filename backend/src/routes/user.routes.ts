import { Router } from 'express';
import { getUsers, createUser, updateUser } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// GET /api/users - Listar usuarios
router.get('/', getUsers);

// POST /api/users - Crear usuario
router.post('/', createUser);

// PUT /api/users/:id - Actualizar usuario (activar/desactivar, cambiar contraseña)
router.put('/:id', updateUser);

export default router;
