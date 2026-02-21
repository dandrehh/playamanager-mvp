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
        },
        sales: {
          where: {
            saleTime: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
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

export const getVendorById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { companyId } = req.user!;

    const vendor = await prisma.vendor.findFirst({
      where: { id, companyId },
      include: {
        currentShiftInventory: {
          include: {
            product: true
          }
        },
        sales: {
          include: {
            items: {
              include: {
                product: true
              }
            }
          },
          orderBy: { saleTime: 'desc' },
          take: 20
        }
      }
    });

    if (!vendor) {
      return res.status(404).json({ message: 'Vendedor no encontrado' });
    }

    res.json(vendor);
  } catch (error) {
    console.error('Error fetching vendor:', error);
    res.status(500).json({ message: 'Error al obtener vendedor' });
  }
};

export const createVendor = async (req: Request, res: Response) => {
  try {
    const { companyId } = req.user!;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'El nombre es requerido' });
    }

    const vendor = await prisma.vendor.create({
      data: {
        name: name.trim(),
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

export const updateVendor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { companyId } = req.user!;
    const { name } = req.body;

    const vendor = await prisma.vendor.findFirst({
      where: { id, companyId }
    });

    if (!vendor) {
      return res.status(404).json({ message: 'Vendedor no encontrado' });
    }

    const updated = await prisma.vendor.update({
      where: { id },
      data: {
        name: name?.trim() || vendor.name
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating vendor:', error);
    res.status(500).json({ message: 'Error al actualizar vendedor' });
  }
};

export const deleteVendor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { companyId } = req.user!;

    const vendor = await prisma.vendor.findFirst({
      where: { id, companyId }
    });

    if (!vendor) {
      return res.status(404).json({ message: 'Vendedor no encontrado' });
    }

    await prisma.vendor.delete({ where: { id } });

    res.json({ message: 'Vendedor eliminado' });
  } catch (error) {
    console.error('Error deleting vendor:', error);
    res.status(500).json({ message: 'Error al eliminar vendedor' });
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

export const assignInventory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { inventory } = req.body;
    const { companyId } = req.user!;

    if (!inventory || !Array.isArray(inventory) || inventory.length === 0) {
      return res.status(400).json({ message: 'Debes especificar items a asignar' });
    }

    const vendor = await prisma.vendor.findUnique({
      where: { id }
    });

    if (!vendor || vendor.companyId !== companyId) {
      return res.status(404).json({ message: 'Vendedor no encontrado' });
    }

    const isFirstAssignment = !vendor.isActive;

    await prisma.$transaction(async (tx) => {
      // Si es el primer turno del día, iniciar turno
      if (isFirstAssignment) {
        await tx.vendor.update({
          where: { id },
          data: {
            currentShiftStart: new Date(),
            isActive: true
          }
        });
      }

      // Procesar cada producto
      for (const item of inventory) {
        // Buscar si ya existe asignación para este producto
        const existing = await tx.vendorInventoryAssignment.findFirst({
          where: {
            vendorId: id,
            productId: item.productId
          }
        });

        if (existing) {
          // SUMAR a la cantidad existente
          await tx.vendorInventoryAssignment.update({
            where: { id: existing.id },
            data: {
              quantityStart: existing.quantityStart + item.quantity,
              quantityCurrent: existing.quantityCurrent + item.quantity
            }
          });
        } else {
          // Crear nueva asignación
          await tx.vendorInventoryAssignment.create({
            data: {
              vendorId: id,
              productId: item.productId,
              quantityStart: item.quantity,
              quantityCurrent: item.quantity
            }
          });
        }
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
    console.error('Error assigning inventory:', error);
    res.status(500).json({ message: 'Error al asignar inventario' });
  }
};

export const registerSale = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { items } = req.body;
    const { companyId } = req.user!;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Debes especificar items vendidos' });
    }

    const vendor = await prisma.vendor.findUnique({
      where: { id }
    });

    if (!vendor || vendor.companyId !== companyId) {
      return res.status(404).json({ message: 'Vendedor no encontrado' });
    }

    if (!vendor.isActive) {
      return res.status(400).json({ message: 'El vendedor no tiene turno activo' });
    }

    const totalAmount = items.reduce(
      (sum: number, item: any) => sum + item.quantity * item.unitPrice,
      0
    );

    const sale = await prisma.vendorSale.create({
      data: {
        vendorId: id,
        companyId,
        totalAmount,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.quantity * item.unitPrice
          }))
        }
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    // Actualizar inventario (restar vendido)
    for (const item of items) {
      await prisma.vendorInventoryAssignment.updateMany({
        where: {
          vendorId: id,
          productId: item.productId
        },
        data: {
          quantityCurrent: {
            decrement: item.quantity
          }
        }
      });
    }

    res.status(201).json(sale);
  } catch (error) {
    console.error('Error registering sale:', error);
    res.status(500).json({ message: 'Error al registrar venta' });
  }
};

export const closeShift = async (req: Request, res: Response) => {
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

    if (!vendor.isActive) {
      return res.status(400).json({ message: 'El vendedor no tiene turno activo' });
    }

    // Calcular resumen del turno
    const summary = {
      totalAssigned: vendor.currentShiftInventory.reduce((sum, item) => sum + item.quantityStart, 0),
      totalRemaining: vendor.currentShiftInventory.reduce((sum, item) => sum + item.quantityCurrent, 0),
      totalSold: vendor.currentShiftInventory.reduce((sum, item) => sum + (item.quantityStart - item.quantityCurrent), 0)
    };

    await prisma.$transaction(async (tx) => {
      // Limpiar inventario
      await tx.vendorInventoryAssignment.deleteMany({
        where: { vendorId: id }
      });

      // Cerrar turno
      await tx.vendor.update({
        where: { id },
        data: {
          currentShiftStart: null,
          isActive: false
        }
      });
    });

    res.json({ 
      message: 'Turno cerrado exitosamente',
      summary
    });
  } catch (error) {
    console.error('Error closing shift:', error);
    res.status(500).json({ message: 'Error al cerrar turno' });
  }
};
