import { Router } from "express";
import { usersController } from "../controllers/users.controller.js";
// import requireAuth from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import { updateUserSchema, userParamsSchema } from "../schemas/user.schema.js";
import { requireRole } from "../middlewares/requireRole.middleware.js";
import { requireAuth } from "../middlewares/requireAuth.middleware.js";

const router = Router();

// Any logged-in user can view their own profile
router.get("/me", requireAuth, usersController.getMe);

// Any logged-in user can update their own profile
router.patch(
  "/me",
  requireAuth,
  validate(updateUserSchema),
  usersController.updateMe,
);

// Only ADMIN can view all users
router.get("/", requireAuth, requireRole("ADMIN"), usersController.getAll);

// Only ADMIN can delete a user
router.delete(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  validate(userParamsSchema, "params"),
  usersController.remove,
);

export default router;
