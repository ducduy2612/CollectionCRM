import { Request, Response, NextFunction } from 'express';

/**
 * Method Override Middleware
 *
 * This middleware handles the X-HTTP-Method-Override header to support
 * cloud workstation environments that filter certain HTTP methods like PUT.
 *
 * When a POST request includes the X-HTTP-Method-Override header,
 * the middleware changes the request method to the specified override method.
 */
export function methodOverride(req: Request, res: Response, next: NextFunction): void {
  // Check if this is a POST request with a method override header
  if (req.method === 'POST' && req.headers['x-http-method-override']) {
    const overrideMethod = req.headers['x-http-method-override'] as string;
    
    // Validate the override method
    const allowedMethods = ['PUT', 'PATCH', 'DELETE'];
    if (allowedMethods.includes(overrideMethod.toUpperCase())) {
      // Override the request method
      req.method = overrideMethod.toUpperCase();
      
      // Remove the override header to prevent it from being passed to downstream services
      delete req.headers['x-http-method-override'];
    }
  }
  
  next();
}