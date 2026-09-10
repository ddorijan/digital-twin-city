import { Request, Response, NextFunction } from 'express';
import { randomBytes, createHash, timingSafeEqual } from 'crypto';

// Simple in-memory session storage (for production use Redis or JWT)
// Maps token -> expiry timestamp (ms)
const sessions = new Map<string, number>();
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_PASSWORD) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('ADMIN_PASSWORD environment variable must be set in production');
  }
  console.warn('⚠️  ADMIN_PASSWORD not set - using insecure default "admin123" for local development only.');
}
const EFFECTIVE_PASSWORD = ADMIN_PASSWORD || 'admin123';

// Constant-time comparison that also normalizes length via hashing, avoiding
// both content and length timing leaks.
const safeCompare = (a: string, b: string): boolean => {
  const hashA = createHash('sha256').update(a).digest();
  const hashB = createHash('sha256').update(b).digest();
  return timingSafeEqual(hashA, hashB);
};

// Periodically sweep expired sessions so abandoned tokens don't linger forever
setInterval(() => {
  const now = Date.now();
  for (const [token, expiresAt] of sessions) {
    if (expiresAt <= now) sessions.delete(token);
  }
}, 60 * 60 * 1000).unref();

export const login = (req: Request, res: Response) => {
  const { password } = req.body;

  if (typeof password === 'string' && safeCompare(password, EFFECTIVE_PASSWORD)) {
    // Generate unpredictable session token
    const token = `session_${randomBytes(32).toString('hex')}`;
    sessions.set(token, Date.now() + SESSION_TTL_MS);

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
  const expiresAt = token ? sessions.get(token) : undefined;

  if (!token || !expiresAt || expiresAt <= Date.now()) {
    if (token) sessions.delete(token);
    return res.status(403).json({
      success: false,
      message: 'Unauthorized - Invalid, expired, or missing token'
    });
  }

  // Sliding expiration - active sessions stay alive
  sessions.set(token, Date.now() + SESSION_TTL_MS);
  next();
};
