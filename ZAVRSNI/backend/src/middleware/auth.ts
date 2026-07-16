import { Request, Response, NextFunction } from 'express';

// Simple in-memory session storage (for production use Redis or JWT)
const sessions = new Set<string>();

// Simple password for admin (in production use proper auth with hashed passwords)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

export const login = (req: Request, res: Response) => {
  const { password } = req.body;
  
  if (password === ADMIN_PASSWORD) {
    // Generate simple session token
    const token = `session_${Date.now()}_${Math.random().toString(36)}`;
    sessions.add(token);
    
    res.json({
      success: true,
      token,
      message: 'Login successful'
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid password'
    });
  }
};

export const logout = (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (token) {
    sessions.delete(token);
  }
  
  res.json({
    success: true,
    message: 'Logout successful'
  });
};

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token || !sessions.has(token)) {
    return res.status(403).json({
      success: false,
      message: 'Unauthorized - Invalid or missing token'
    });
  }
  
  next();
};
