import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  id: number;
}

export interface AuthRequest extends Request {
  user?: { id: number };
}

export const protect = (req: AuthRequest, res: Response, next: NextFunction) => {
  let token: string | undefined;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
    try {
      if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET not defined");
      const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
      req.user = { id: decoded.id };
      next();
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};
