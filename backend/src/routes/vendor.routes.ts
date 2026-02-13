import { Router } from 'express';
import {
  getVendors,
  getVendorStats,
  getVendorById,
  createVendor,
  updateVendor,
  deleteVendor,
  assignInventory,
  registerSale,
  closeShift,
} from '../controllers/vendor.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas principales
router.get('/', getVendors);
router.get('/stats', getVendorStats);
router.get('/:id', getVendorById);
router.post('/', createVendor);
router.put('/:id', updateVendor);
router.delete('/:id', deleteVendor);

// Rutas de operaciones
router.post('/:id/assign-inventory', assignInventory);
router.post('/:id/register-sale', registerSale);
router.post('/:id/close-shift', closeShift);

export default router;
