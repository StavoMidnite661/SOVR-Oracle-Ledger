import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

// ============================================
// SECURITY MIDDLEWARE - Enterprise Grade
// ============================================

/**
 * Helmet security headers
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://mainnet.base.org", "https://*.basescan.org"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
});

/**
 * Rate limiting for API protection
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per window
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Stricter rate limit for sensitive operations
 */
export const strictRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Too many sensitive operations. Please wait.' },
});

/**
 * Request sanitization middleware
 */
export function sanitizeRequest(req: Request, res: Response, next: NextFunction) {
  // Basic sanitization for common injection vectors
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .trim();
    }
    if (Array.isArray(obj)) return obj.map(sanitize);
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        sanitized[key] = sanitize(obj[key]);
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);

  next();
}

/**
 * PCI-sensitive data masking helper
 */
export function maskSensitiveData(data: any, fields: string[] = ['password', 'ssn', 'taxId', 'bankAccountNumber', 'routingNumber']): any {
  if (!data || typeof data !== 'object') return data;

  const masked = { ...data };

  for (const field of fields) {
    if (masked[field]) {
      const value = String(masked[field]);
      masked[field] = value.length > 4 
        ? '****' + value.slice(-4) 
        : '****';
    }
  }

  return masked;
}

/**
 * Audit logging middleware for compliance
 */
export function auditLogMiddleware(tableName: string, action: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    
    res.send = function (body) {
      const user = (req as any).user;
      
      // Log sensitive actions
      if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        console.log(`[AUDIT] ${action} on ${tableName} by ${user?.email || 'anonymous'} | IP: ${req.ip}`);
        
        // In production, this would write to pciAuditLog table
        // await db.insert(schema.pciAuditLog).values({...})
      }
      
      return originalSend.call(this, body);
    };
    
    next();
  };
}

export default {
  securityHeaders,
  apiRateLimiter,
  strictRateLimiter,
  sanitizeRequest,
  maskSensitiveData,
  auditLogMiddleware,
};