import type { Request } from "express";

export type RequestPart = "body" | "params" | "query";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: "USER" | "ADMIN";
  };
}
