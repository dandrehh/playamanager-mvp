import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validación para crear/actualizar producto
const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  category: z.enum(['RENTAL', 'VENDOR']),
  isActive: z.boolean().optional().default(true)
});

/**
 * GET /api/products
 * Obtiene todos los productos de la empresa
 */
export const getProducts = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    const { category, isActive } = req.query;

    const products = await prisma.product.findMany({
      where: {
        companyId,
        ...(category && { category: category as any }),
        ...(isActive !== undefined && { isActive: isActive === 'true' })
      },
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      count: products.length,
      products
    });

  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/products/:id
 * Obtiene un producto por ID
 */
export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;

    const product = await prisma.product.findFirst({
      where: {
        id,
        companyId
      }
    });

    if (!product) {
      return res.status(404).json({ 
        error: 'Product not found',
        message: 'The requested product does not exist'
      });
    }

    res.json({
      success: true,
      product
    });

  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * POST /api/products
 * Crea un nuevo producto
 */
export const createProduct = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    
    if (!companyId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const data = productSchema.parse(req.body);

    const product = await prisma.product.create({
      data: {
        ...data,
        companyId
      }
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error',
        details: error.errors 
      });
    }

    console.error('Create product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * PUT /api/products/:id
 * Actualiza un producto existente
 */
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;

    // Verificar que el producto existe y pertenece a la empresa
    const existingProduct = await prisma.product.findFirst({
      where: { id, companyId }
    });

    if (!existingProduct) {
      return res.status(404).json({ 
        error: 'Product not found',
        message: 'The requested product does not exist'
      });
    }

    const data = productSchema.partial().parse(req.body);

    const product = await prisma.product.update({
      where: { id },
      data
    });

    res.json({
      success: true,
      message: 'Product updated successfully',
      product
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error',
        details: error.errors 
      });
    }

    console.error('Update product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * DELETE /api/products/:id
 * Elimina un producto (soft delete - marca como inactivo)
 */
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;

    // Verificar que el producto existe
    const product = await prisma.product.findFirst({
      where: { id, companyId }
    });

    if (!product) {
      return res.status(404).json({ 
        error: 'Product not found',
        message: 'The requested product does not exist'
      });
    }

    // Soft delete - marcar como inactivo
    await prisma.product.update({
      where: { id },
      data: { isActive: false }
    });

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
