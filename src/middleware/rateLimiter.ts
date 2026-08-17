import rateLimit from 'express-rate-limit';

// Base global limiter: 100 requests per 15 minutes per IP
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  standardHeaders: true, 
  legacyHeaders: false, 
  message: {
    error: 'Too many requests from this IP, please try again after 15 minutes',
    status: 429
  },
  // Use memory store by default if Redis isn't explicitly configured here
  // The global app rate limit can be extended to use Redis in cluster mode
});

// Stricter limiter for authentication routes: 5 attempts per hour per IP
export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5, 
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many authentication attempts from this IP, please try again after an hour',
    status: 429
  }
});
