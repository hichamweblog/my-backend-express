import type { z } from "zod";
import {
  createUserSchema,
  paginationSchema,
  updateUserSchema,
  userParamsSchema,
} from "../schemas/user.schema.js";

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UserParamsInput = z.infer<typeof userParamsSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface PublicUser extends User {
  role: "USER" | "ADMIN";
  createdAt: Date;
}
