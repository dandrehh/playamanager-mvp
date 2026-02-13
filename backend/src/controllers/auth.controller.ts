import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validación de datos de login
const loginSchema = z.object({
  companyId: z.string().min(1, 'Company ID is required'),
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required')
});

/**
 * POST /api/auth/login
 * Autentica usuario y retorna JWT token
 */
export const login = async (req: Request, res: Response) => {
  try {
    // Validar datos de entrada
    const { companyId, username, password } = loginSchema.parse(req.body);

    // Buscar la empresa
    const company = await prisma.company.findUnique({
      where: { companyId }
    });

    if (!company) {
      return res.status(401).json({ 
        error: 'Invalid credentials',
        message: 'Company not found'
      });
    }

    // Buscar usuario en esa empresa
    const user = await prisma.user.findFirst({
      where: {
        username,
        companyId: company.id
      }
    });

    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid credentials',
        message: 'User not found'
      });
    }

    // Verificar password
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      return res.status(401).json({ 
        error: 'Invalid credentials',
        message: 'Incorrect password'
      });
    }

    // Generar JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        companyId: company.id,
        companyCode: company.companyId,
        role: user.role,
        username: user.username
      },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Retornar datos del usuario y token
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        company: {
          id: company.id,
          companyId: company.companyId,
          name: company.name,
          location: company.location
        }
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error',
        details: error.errors 
      });
    }

    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'An error occurred during login'
    });
  }
};

/**
 * GET /api/auth/me
 * Retorna datos del usuario autenticado
 */
export const getMe = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        company: {
          select: {
            id: true,
            companyId: true,
            name: true,
            location: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // No enviar password
    const { password, ...userWithoutPassword } = user;

    res.json({
      success: true,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
