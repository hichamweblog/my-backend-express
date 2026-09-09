import { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";
import type { RequestPart } from "../types/request.js";

function validate(schema: ZodType, part: RequestPart = "body") {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[part]);

    if (!result.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: result.error.issues.map((issue) => ({
          path: issue.path,
          message: issue.message,
        })),
      });
    }

    // Replace with the parsed (and coerced/defaulted) data
    req[part] = result.data;
    next();
  };
}

export default validate;
