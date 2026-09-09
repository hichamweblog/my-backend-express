import { Request, Response } from "express";
import { authService } from "../services/auth.service.js";

import env from "../config/env.js";

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production", // allow HTTP in local dev only
  sameSite: "strict" as const,
};

export const authController = {
  register: async (req: Request, res: Response) => {
    const { name, email, password } = req.body;
    const user = await authService.register(name, email, password);
    res.status(201).json({ id: user.id, name: user.name, email: user.email });
  },

  login: async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const { accessToken, refreshToken, user } = await authService.login(
      email,
      password,
    );

    res.cookie("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    });
    res.cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ id: user.id, name: user.name, role: user.role });
  },

  refresh: async (req: Request, res: Response) => {
    const oldToken = req.cookies.refreshToken;
    const { accessToken, refreshToken } = await authService.refresh(oldToken);

    res.cookie("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    });
    res.cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ message: "Token refreshed" });
  },
  logout: async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;
    await authService.logout(refreshToken);

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.json({ message: "Logged out" });
  },
};
