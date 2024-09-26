import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

enum SchemaType {
  Body = "body",
  Query = "query",
  Params = "params",
}

function validate(schema: ZodSchema, type: SchemaType) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req[type]);
      if (!result.success) {
        return res.status(400).json({
          error: result.error.message,
          message: `Invalid request ${type}.`,
        });
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}

export const validateBody = (schema: ZodSchema) => validate(schema, SchemaType.Body);
export const validateQuery = (schema: ZodSchema) => validate(schema, SchemaType.Query);
export const validateParams = (schema: ZodSchema) => validate(schema, SchemaType.Params);
