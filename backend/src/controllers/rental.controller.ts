import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validación para crear arriendo
const rentalItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive()
});

const createRentalSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  customerIdPhoto: z.string().url().optional(),
  items: z.array(rentalItemSchema).min(1, 'At least one item is required')
});

/**
 * GET /api/rentals
 * Obtiene todos los arriendos de la empresa
 */
export const getRentals = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    const { status } = req.query;

    const rentals = await prisma.rental.findMany({
      where: {
        companyId,
        ...(status && { status: status as any })
      },
      include: {
        items: {
          include: {
            product: true
          }
        },
        user: {
          select: {
            username: true,
            fullName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      count: rentals.length,
      rentals
    });

  } catch (error) {
    console.error('Get rentals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/rentals/:id
 * Obtiene un arriendo específico con sus detalles
 */
export const getRentalById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;

    const rental = await prisma.rental.findFirst({
      where: {
        id,
        companyId
      },
      include: {
        items: {
          include: {
            product: true
          }
        },
        user: {
          select: {
            username: true,
            fullName: true
          }
        }
      }
    });

    if (!rental) {
      return res.status(404).json({ 
        error: 'Rental not found',
        message: 'The requested rental does not exist'
      });
    }

    res.json({
      success: true,
      rental
    });

  } catch (error) {
    console.error('Get rental error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * POST /api/rentals
 * Crea un nuevo arriendo con sus items
 */
export const createRental = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    const userId = req.user?.userId;
    
    if (!companyId || !userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { customerName, customerIdPhoto, items } = createRentalSchema.parse(req.body);

    // Calcular total
    let totalAmount = 0;
    const processedItems = items.map(item => {
      const subtotal = item.quantity * item.unitPrice;
      totalAmount += subtotal;
      return {
        ...item,
        subtotal
      };
    });

    // Crear arriendo con items en una transacción
    const rental = await prisma.rental.create({
      data: {
        customerName,
        customerIdPhoto,
        totalAmount,
        companyId,
        userId,
        items: {
          create: processedItems
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

    res.status(201).json({
      success: true,
      message: 'Rental created successfully',
      rental
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error',
        details: error.errors 
      });
    }

    console.error('Create rental error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * PUT /api/rentals/:id
 * Actualiza un arriendo (principalmente para modificar items antes de cerrar)
 */
export const updateRental = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;

    // Verificar que el rental existe y está activo
    const existingRental = await prisma.rental.findFirst({
      where: { 
        id, 
        companyId,
        status: 'ACTIVE'
      }
    });

    if (!existingRental) {
      return res.status(404).json({ 
        error: 'Rental not found or already closed',
        message: 'The rental cannot be modified'
      });
    }

    const { customerName, items } = req.body;

    // Si se modifican items, recalcular total
    let updateData: any = {};
    
    if (customerName) {
      updateData.customerName = customerName;
    }

    if (items && items.length > 0) {
      // Eliminar items anteriores
      await prisma.rentalItem.deleteMany({
        where: { rentalId: id }
      });

      // Calcular nuevo total
      let totalAmount = 0;
      const processedItems = items.map((item: any) => {
        const subtotal = item.quantity * item.unitPrice;
        totalAmount += subtotal;
        return {
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal
        };
      });

      updateData.totalAmount = totalAmount;
      updateData.items = {
        create: processedItems
      };
    }

    const rental = await prisma.rental.update({
      where: { id },
      data: updateData,
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Rental updated successfully',
      rental
    });

  } catch (error) {
    console.error('Update rental error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * POST /api/rentals/:id/close
 * Cierra un arriendo (marca como completado)
 */
export const closeRental = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;

    const rental = await prisma.rental.findFirst({
      where: { 
        id, 
        companyId,
        status: 'ACTIVE'
      }
    });

    if (!rental) {
      return res.status(404).json({ 
        error: 'Rental not found or already closed',
        message: 'Cannot close this rental'
      });
    }

    const closedRental = await prisma.rental.update({
      where: { id },
      data: {
        status: 'CLOSED',
        endTime: new Date()
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Rental closed successfully',
      rental: closedRental
    });

  } catch (error) {
    console.error('Close rental error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * DELETE /api/rentals/:id
 * Anula un arriendo
 */
export const voidRental = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;

    const rental = await prisma.rental.findFirst({
      where: { id, companyId }
    });

    if (!rental) {
      return res.status(404).json({ 
        error: 'Rental not found'
      });
    }

    await prisma.rental.update({
      where: { id },
      data: { status: 'VOIDED' }
    });

    res.json({
      success: true,
      message: 'Rental voided successfully'
    });

  } catch (error) {
    console.error('Void rental error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/rentals/stats
 * Obtiene estadísticas de arriendos (para KPIs)
 */
export const getRentalStats = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.companyId;

    const activeRentals = await prisma.rental.count({
      where: {
        companyId,
        status: 'ACTIVE'
      }
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayRentals = await prisma.rental.count({
      where: {
        companyId,
        createdAt: {
          gte: todayStart
        }
      }
    });

    const todayRevenue = await prisma.rental.aggregate({
      where: {
        companyId,
        status: 'CLOSED',
        createdAt: {
          gte: todayStart
        }
      },
      _sum: {
        totalAmount: true
      }
    });

    res.json({
      success: true,
      stats: {
        activeRentals,
        todayRentals,
        todayRevenue: todayRevenue._sum.totalAmount || 0
      }
    });

  } catch (error) {
    console.error('Get rental stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * PUT /api/rentals/:id/modify
 * Modifica un arriendo activo (agregar/quitar items)
 */
export const modifyRental = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;
    const { itemsToAdd, itemsToRemove } = req.body;

    // Verificar que el arriendo existe y está activo
    const rental = await prisma.rental.findFirst({
      where: {
        id,
        companyId,
        status: 'ACTIVE'
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!rental) {
      return res.status(404).json({ message: 'Arriendo no encontrado o no está activo' });
    }

    // Procesar items a eliminar
    if (itemsToRemove && itemsToRemove.length > 0) {
      for (const itemId of itemsToRemove) {
        await prisma.rentalItem.delete({
          where: { id: itemId }
        });
      }
    }

    // Procesar items a agregar
    if (itemsToAdd && itemsToAdd.length > 0) {
      for (const item of itemsToAdd) {
        await prisma.rentalItem.create({
          data: {
            rentalId: id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.quantity * item.unitPrice
          }
        });
      }
    }

    // Recalcular el total
    const updatedItems = await prisma.rentalItem.findMany({
      where: { rentalId: id }
    });

    const newTotal = updatedItems.reduce((sum, item) => sum + item.subtotal, 0);

    // Actualizar el arriendo con el nuevo total
    const updatedRental = await prisma.rental.update({
      where: { id },
      data: {
        totalAmount: newTotal
      },
      include: {
        items: {
          include: {
            product: true
          }
        },
        user: {
          select: {
            username: true,
            fullName: true
          }
        }
      }
    });

    // Crear registro de historial de modificación
    await prisma.rentalModification.create({
      data: {
        rentalId: id,
        userId: req.user?.id || '',
        itemsAdded: itemsToAdd?.length || 0,
        itemsRemoved: itemsToRemove?.length || 0,
        previousTotal: rental.totalAmount,
        newTotal: newTotal,
        modifiedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Arriendo modificado exitosamente',
      rental: updatedRental
    });

  } catch (error) {
    console.error('Modify rental error:', error);
    res.status(500).json({ message: 'Error al modificar arriendo' });
  }
};

/**
 * GET /api/rentals/:id/modifications
 * Obtiene el historial de modificaciones de un arriendo
 */
export const getRentalModifications = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;

    // Verificar que el arriendo pertenece a la empresa
    const rental = await prisma.rental.findFirst({
      where: {
        id,
        companyId
      }
    });

    if (!rental) {
      return res.status(404).json({ message: 'Arriendo no encontrado' });
    }

    const modifications = await prisma.rentalModification.findMany({
      where: { rentalId: id },
      include: {
        user: {
          select: {
            username: true,
            fullName: true
          }
        }
      },
      orderBy: { modifiedAt: 'desc' }
    });

    res.json({
      success: true,
      modifications
    });

  } catch (error) {
    console.error('Get rental modifications error:', error);
    res.status(500).json({ message: 'Error al obtener historial' });
  }
};
/**
 * PUT /api/rentals/:id/add-items
 * Agregar productos a un arriendo activo
 */
export const addItemsToRental = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;
    const { items } = req.body; // [{ productId, quantity, unitPrice }]

    // Verificar que el arriendo existe y está activo
    const rental = await prisma.rental.findFirst({
      where: {
        id,
        companyId,
        status: 'ACTIVE'
      }
    });

    if (!rental) {
      return res.status(404).json({ message: 'Arriendo no encontrado o no está activo' });
    }

    // Agregar los nuevos items
    for (const item of items) {
      await prisma.rentalItem.create({
        data: {
          rentalId: id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.quantity * item.unitPrice
        }
      });
    }

    // Recalcular el total
    const allItems = await prisma.rentalItem.findMany({
      where: { rentalId: id }
    });

    const newTotal = allItems.reduce((sum, item) => sum + item.subtotal, 0);

    // Actualizar el arriendo con el nuevo total
    const updatedRental = await prisma.rental.update({
      where: { id },
      data: {
        totalAmount: newTotal
      },
      include: {
        items: {
          include: {
            product: true
          }
        },
        user: {
          select: {
            username: true,
            fullName: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Productos agregados exitosamente',
      rental: updatedRental
    });

  } catch (error) {
    console.error('Add items to rental error:', error);
    res.status(500).json({ message: 'Error al agregar productos' });
  }
};
