import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny, ZodError } from 'zod';

/**
 * Express middleware to validate request structures against Zod schemas.
 * 
 * Validates req.body, req.query, and req.params if the respective schemas are provided.
 */
export const validateRequest = (schema: {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body);
      }
      if (schema.query) {
        req.query = (await schema.query.parseAsync(req.query)) as any;
      }
      if (schema.params) {
        req.params = (await schema.params.parseAsync(req.params)) as any;
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const zodError = error as ZodError<any>;
        return res.status(400).json({
          error: 'Validation failed',
          issues: zodError.issues.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        });
      }
      return res.status(500).json({ error: 'Internal server error during validation' });
    }
  };
};
