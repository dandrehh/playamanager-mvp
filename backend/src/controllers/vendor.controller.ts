import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/vendors - Listar todos los vendedores
export const getVendors = async (req: Request, res: Response) => {
  try {
    const { companyId } = (req as any).user;
    const { status } = req.query;

    const where: any = { companyId };
    if (status) {
      where.status = status;
    }

    const vendors = await prisma.vendor.findMany({
      where,
      include: {
        inventoryAssignments: {
          where: { isActive: true },
          include: {
            product: true,
          },
        },
        _count: {
          select: {
            sales: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ vendors });
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({ message: 'Error al obtener vendedores' });
  }
};

// GET /api/vendors/stats - Estadísticas de vendedores
export const getVendorStats = async (req: Request, res: Response) => {
  try {
    const { companyId } = (req as any).user;

    const activeVendors = await prisma.vendor.count({
      where: { companyId, status: 'ACTIVE' },
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todaySales = await prisma.vendorSale.aggregate({
      where: {
        companyId,
        createdAt: { gte: todayStart },
      },
      _sum: { totalAmount: true },
      _count: true,
    });

    res.json({
      stats: {
        activeVendors,
        todaySales: todaySales._count || 0,
        todayRevenue: todaySales._sum.totalAmount || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching vendor stats:', error);
    res.status(500).json({ message: 'Error al obtener estadísticas' });
  }
};

// GET /api/vendors/:id - Obtener un vendedor específico
export const getVendorById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { companyId } = (req as any).user;

    const vendor = await prisma.vendor.findFirst({
      where: { id, companyId },
      include: {
        inventoryAssignments: {
          where: { isActive: true },
          include: {
            product: true,
          },
        },
        sales: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!vendor) {
      return res.status(404).json({ message: 'Vendedor no encontrado' });
    }

    res.json({ vendor });
  } catch (error) {
    console.error('Error fetching vendor:', error);
    res.status(500).json({ message: 'Error al obtener vendedor' });
  }
};

// POST /api/vendors - Crear nuevo vendedor
export const createVendor = async (req: Request, res: Response) => {
  try {
    const { companyId } = (req as any).user;
    const { name, phone } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'El nombre es requerido' });
    }

    const vendor = await prisma.vendor.create({
      data: {
        name: name.trim(),
        phone: phone?.trim() || null,
        companyId,
      },
    });

    res.status(201).json({ vendor, message: 'Vendedor creado exitosamente' });
  } catch (error) {
    console.error('Error creating vendor:', error);
    res.status(500).json({ message: 'Error al crear vendedor' });
  }
};

// PUT /api/vendors/:id - Actualizar vendedor
export const updateVendor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { companyId } = (req as any).user;
    const { name, phone, status } = req.body;

    const vendor = await prisma.vendor.findFirst({
      where: { id, companyId },
    });

    if (!vendor) {
      return res.status(404).json({ message: 'Vendedor no encontrado' });
    }

    const updated = await prisma.vendor.update({
      where: { id },
      data: {
        name: name?.trim() || vendor.name,
        phone: phone?.trim() || vendor.phone,
        status: status || vendor.status,
      },
    });

    res.json({ vendor: updated, message: 'Vendedor actualizado' });
  } catch (error) {
    console.error('Error updating vendor:', error);
    res.status(500).json({ message: 'Error al actualizar vendedor' });
  }
};

// DELETE /api/vendors/:id - Eliminar vendedor
export const deleteVendor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { companyId } = (req as any).user;

    const vendor = await prisma.vendor.findFirst({
      where: { id, companyId },
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

// POST /api/vendors/:id/assign-inventory - Asignar inventario
export const assignInventory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { companyId } = (req as any).user;
    const { items } = req.body; // [{ productId, quantity }]

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Debes especificar items a asignar' });
    }

    const vendor = await prisma.vendor.findFirst({
      where: { id, companyId },
      include: {
        inventoryAssignments: {
          where: { isActive: false },
          orderBy: { closedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!vendor) {
      return res.status(404).json({ message: 'Vendedor no encontrado' });
    }

    // Validación: Verificar si ya cerró turno HOY
    if (vendor.inventoryAssignments.length > 0) {
      const lastClosed = vendor.inventoryAssignments[0];
      if (lastClosed.closedAt) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const closedDate = new Date(lastClosed.closedAt);
        closedDate.setHours(0, 0, 0, 0);

        if (closedDate.getTime() === today.getTime()) {
          return res.status(400).json({
            message: 'Este vendedor ya cerró turno hoy. No puede abrir nuevo turno hasta mañana.',
          });
        }
      }
    }

    // Procesar cada item: actualizar si existe y está activo, crear si no existe
    const assignments = [];
    
    for (const item of items) {
      // Buscar asignación activa existente para este producto
      const existing = await prisma.vendorInventoryAssignment.findFirst({
        where: {
          vendorId: id,
          productId: item.productId,
          isActive: true,
        },
        include: {
          product: true,
        },
      });

      if (existing) {
        // Actualizar: sumar la nueva cantidad a la asignada (RECARGA durante turno activo)
        const updated = await prisma.vendorInventoryAssignment.update({
          where: { id: existing.id },
          data: {
            quantityAssigned: existing.quantityAssigned + item.quantity,
          },
          include: {
            product: true,
          },
        });
        assignments.push(updated);
      } else {
        // Crear nueva asignación (NUEVO TURNO)
        const created = await prisma.vendorInventoryAssignment.create({
          data: {
            vendorId: id,
            productId: item.productId,
            quantityAssigned: item.quantity,
          },
          include: {
            product: true,
          },
        });
        assignments.push(created);
      }
    }

    // Activar vendedor si no lo está
    if (vendor.status === 'INACTIVE') {
      await prisma.vendor.update({
        where: { id },
        data: { status: 'ACTIVE' },
      });
    }

    res.json({
      assignments,
      message: vendor.status === 'ACTIVE' 
        ? 'Inventario recargado exitosamente'
        : 'Inventario asignado exitosamente. Turno iniciado.',
    });
  } catch (error) {
    console.error('Error assigning inventory:', error);
    res.status(500).json({ message: 'Error al asignar inventario' });
  }
};

// POST /api/vendors/:id/register-sale - Registrar venta
export const registerSale = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { companyId } = (req as any).user;
    const { items } = req.body; // [{ productId, quantity, unitPrice }]

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Debes especificar items vendidos' });
    }

    const vendor = await prisma.vendor.findFirst({
      where: { id, companyId },
    });

    if (!vendor) {
      return res.status(404).json({ message: 'Vendedor no encontrado' });
    }

    // Calcular total
    const totalAmount = items.reduce(
      (sum: number, item: any) => sum + item.quantity * item.unitPrice,
      0
    );

    // Crear venta con items
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
            subtotal: item.quantity * item.unitPrice,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Actualizar inventario (marcar como vendido)
    for (const item of items) {
      await prisma.vendorInventoryAssignment.updateMany({
        where: {
          vendorId: id,
          productId: item.productId,
          isActive: true,
        },
        data: {
          quantitySold: {
            increment: item.quantity,
          },
        },
      });
    }

    // Actualizar total de ventas del vendedor
    await prisma.vendor.update({
      where: { id },
      data: {
        totalSalesToday: {
          increment: totalAmount,
        },
      },
    });

    res.status(201).json({ sale, message: 'Venta registrada exitosamente' });
  } catch (error) {
    console.error('Error registering sale:', error);
    res.status(500).json({ message: 'Error al registrar venta' });
  }
};

// POST /api/vendors/:id/close-shift - Cerrar turno del vendedor
export const closeShift = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { companyId } = (req as any).user;
    const { returns } = req.body; // [{ productId, quantityReturned }]

    const vendor = await prisma.vendor.findFirst({
      where: { id, companyId },
    });

    if (!vendor) {
      return res.status(404).json({ message: 'Vendedor no encontrado' });
    }

    // CRÍTICO: Cerrar TODAS las asignaciones activas del turno
    // Esto libera el inventario para el próximo turno
    
    // Obtener todas las asignaciones activas
    const activeAssignments = await prisma.vendorInventoryAssignment.findMany({
      where: {
        vendorId: id,
        isActive: true,
      },
    });

    // Cerrar cada asignación con las devoluciones correspondientes
    for (const assignment of activeAssignments) {
      // Buscar si hay devolución específica para este producto
      const returnInfo = returns?.find((r: any) => r.productId === assignment.productId);
      
      // Calcular cantidad devuelta
      // Si no hay info de devolución, asumir que todo lo no vendido se devuelve
      const quantityReturned = returnInfo?.quantityReturned ?? 
        (assignment.quantityAssigned - assignment.quantitySold);

      await prisma.vendorInventoryAssignment.update({
        where: { id: assignment.id },
        data: {
          quantityReturned,
          isActive: false,
          closedAt: new Date(),
        },
      });
    }

    // Desactivar vendedor y resetear ventas
    await prisma.vendor.update({
      where: { id },
      data: {
        status: 'INACTIVE',
        totalSalesToday: 0,
      },
    });

    res.json({ message: 'Turno cerrado exitosamente' });
  } catch (error) {
    console.error('Error closing shift:', error);
    res.status(500).json({ message: 'Error al cerrar turno' });
  }
};
