import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.email("Invalid email address"),
});

export const updateUserSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(100).optional(),
    email: z.email("Invalid email address").optional(),
  })
  .refine((data) => data.name !== undefined || data.email !== undefined, {
    message: "At least one field is required",
  });

export const userParamsSchema = z.object({
  id: z.uuid("Invalid user ID"),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
