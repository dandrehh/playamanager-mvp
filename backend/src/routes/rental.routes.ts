import { Router } from 'express';
import {
  getRentals,
  getRentalById,
  createRental,
  updateRental,
  closeRental,
  voidRental,
  getRentalStats,
  addItemsToRental
} from '../controllers/rental.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// GET /api/rentals/stats
router.get('/stats', getRentalStats);

// GET /api/rentals
router.get('/', getRentals);

// GET /api/rentals/:id
router.get('/:id', getRentalById);

// POST /api/rentals
router.post('/', createRental);

// PUT /api/rentals/:id
router.put('/:id', updateRental);

// PUT /api/rentals/:id/add-items - Agregar productos a arriendo activo
router.put('/:id/add-items', addItemsToRental);

// POST /api/rentals/:id/close
router.post('/:id/close', closeRental);

// DELETE /api/rentals/:id (void)
router.delete('/:id', voidRental);

export default router;
