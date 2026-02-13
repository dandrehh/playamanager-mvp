import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  userId: string;
  companyId: string;
  role: string;
}

// Extender Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Access token required',
        message: 'No token provided' 
      });
    }

    const secret = process.env.JWT_SECRET || 'fallback_secret';
    
    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        return res.status(403).json({ 
          error: 'Invalid token',
          message: 'Token verification failed' 
        });
      }

      req.user = decoded as JwtPayload;
      next();
    });
  } catch (error) {
    return res.status(500).json({ 
      error: 'Authentication error',
      message: 'Internal server error' 
    });
  }
};

// Middleware para verificar rol de admin
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.role !== 'ADMIN_KIOSK') {
    return res.status(403).json({ 
      error: 'Forbidden',
      message: 'Admin access required' 
    });
  }
  next();
};
