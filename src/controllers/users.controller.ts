import { Request, Response } from "express";
import { usersService } from "../services/users.service.js";
import type { AuthRequest } from "../types/request.js";
import { AppError } from "../utils/AppError.js";

export const usersController = {
  getAll: async (req: Request, res: Response) => {
    const users = await usersService.getAllUsers();
    res.json(users);
  },

  getMe: async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw AppError.unauthorized("Not authenticated");
    }

    const user = await usersService.getMe(req.user.userId);
    res.json(user);
  },

  updateMe: async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw AppError.unauthorized("Not authenticated");
    }

    const user = await usersService.updateMe(req.user.userId, req.body);
    res.json(user);
  },

  remove: async (req: Request, res: Response) => {
    await usersService.deleteUser(String(req.params.id));
    res.status(204).send();
  },
};
