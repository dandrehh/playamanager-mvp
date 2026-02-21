import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../config/database';

// GET /api/users - Listar usuarios (solo admin)
export const getUsers = async (req: Request, res: Response) => {
  try {
    const { companyId, role } = req.user!;

    // Solo admin puede ver usuarios
    if (role !== 'ADMIN' && role !== 'ADMIN_KIOSK') {
      return res.status(403).json({ message: 'No autorizado' });
    }

    const users = await prisma.user.findMany({
      where: { companyId },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error al obtener usuarios' });
  }
};

// POST /api/users - Crear usuario (solo admin)
export const createUser = async (req: Request, res: Response) => {
  try {
    const { companyId, role: userRole } = req.user!;
    const { username, password, fullName, role } = req.body;

    // Solo admin puede crear usuarios
    if (userRole !== 'ADMIN' && userRole !== 'ADMIN_KIOSK') {
      return res.status(403).json({ message: 'No autorizado' });
    }

    // Validaciones
    if (!username || !password || !fullName || !role) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
    }

    if (!['ADMIN_KIOSK', 'OPERATOR'].includes(role)) {
      return res.status(400).json({ message: 'Rol inválido' });
    }

    // Verificar si el username ya existe en la compañía
    const existingUser = await prisma.user.findFirst({
      where: {
        username,
        companyId
      }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'El nombre de usuario ya existe' });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        fullName,
        role,
        companyId,
        isActive: true
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Error al crear usuario' });
  }
};

// PUT /api/users/:id - Actualizar usuario (solo admin)
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { companyId, role: userRole } = req.user!;
    const { isActive, password } = req.body;

    // Solo admin puede actualizar usuarios
    if (userRole !== 'ADMIN' && userRole !== 'ADMIN_KIOSK') {
      return res.status(403).json({ message: 'No autorizado' });
    }

    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user || user.companyId !== companyId) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const updateData: any = {};

    // Actualizar estado activo/inactivo
    if (typeof isActive === 'boolean') {
      updateData.isActive = isActive;
    }

    // Actualizar contraseña si se proporciona
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
      }
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Error al actualizar usuario' });
  }
};
