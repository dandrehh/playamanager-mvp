import { Request, Response } from 'express';
import prisma from '../config/database';

export const getVendors = async (req: Request, res: Response) => {
  try {
    const { companyId } = req.user!;

    const vendors = await prisma.vendor.findMany({
      where: { companyId },
      include: {
        currentShiftInventory: {
          include: {
            product: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(vendors);
  } catch (error) {
    console.error('Get vendors error:', error);
    res.status(500).json({ message: 'Error al obtener vendedores' });
  }
};

export const createVendor = async (req: Request, res: Response) => {
  try {
    const { companyId } = req.user!;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'El nombre es requerido' });
    }

    const vendor = await prisma.vendor.create({
      data: {
        name,
        companyId,
        isActive: true
      }
    });

    res.status(201).json(vendor);
  } catch (error) {
    console.error('Error creating vendor:', error);
    res.status(500).json({ message: 'Error al crear vendedor' });
  }
};

export const getVendorStats = async (req: Request, res: Response) => {
  try {
    const { companyId } = req.user!;

    const activeVendors = await prisma.vendor.count({
      where: {
        companyId,
        isActive: true
      }
    });

    const totalSalesToday = await prisma.vendorSale.aggregate({
      where: {
        companyId,
        saleTime: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      },
      _sum: {
        totalAmount: true
      }
    });

    res.json({
      activeVendors,
      totalSalesToday: totalSalesToday._sum.totalAmount || 0
    });
  } catch (error) {
    console.error('Error fetching vendor stats:', error);
    res.status(500).json({ message: 'Error al obtener estadísticas' });
  }
};

export const startVendorShift = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { inventory } = req.body;
    const { companyId } = req.user!;

    const vendor = await prisma.vendor.findUnique({
      where: { id }
    });

    if (!vendor || vendor.companyId !== companyId) {
      return res.status(404).json({ message: 'Vendedor no encontrado' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.vendorInventoryAssignment.deleteMany({
        where: { vendorId: id }
      });

      await tx.vendor.update({
        where: { id },
        data: {
          currentShiftStart: new Date(),
          isActive: true
        }
      });

      if (inventory && inventory.length > 0) {
        await tx.vendorInventoryAssignment.createMany({
          data: inventory.map((item: any) => ({
            vendorId: id,
            productId: item.productId,
            quantityStart: item.quantity,
            quantityCurrent: item.quantity
          }))
        });
      }
    });

    const updatedVendor = await prisma.vendor.findUnique({
      where: { id },
      include: {
        currentShiftInventory: {
          include: {
            product: true
          }
        }
      }
    });

    res.json(updatedVendor);
  } catch (error) {
    console.error('Error starting vendor shift:', error);
    res.status(500).json({ message: 'Error al iniciar turno' });
  }
};

export const closeVendorShift = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { companyId } = req.user!;

    const vendor = await prisma.vendor.findUnique({
      where: { id },
      include: {
        currentShiftInventory: true
      }
    });

    if (!vendor || vendor.companyId !== companyId) {
      return res.status(404).json({ message: 'Vendedor no encontrado' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.vendorInventoryAssignment.deleteMany({
        where: { vendorId: id }
      });

      await tx.vendor.update({
        where: { id },
        data: {
          currentShiftStart: null,
          isActive: false
        }
      });
    });

    res.json({ message: 'Turno cerrado exitosamente' });
  } catch (error) {
    console.error('Error closing vendor shift:', error);
    res.status(500).json({ message: 'Error al cerrar turno' });
  }
};
