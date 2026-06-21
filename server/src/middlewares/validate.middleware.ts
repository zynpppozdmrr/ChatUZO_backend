import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema, ZodError } from 'zod';

export const validate = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if ((error as ZodError).name === 'ZodError') {
        const zodError = error as ZodError;
        res.status(400).json({
          message: 'Validation hatası',
          errors: zodError.issues.map((err) => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
        return;
      }

      res.status(500).json({
        message: 'Validation sırasında bir hata oluştu.'
      });
    }
  };
};
