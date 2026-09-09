import { authRepository } from "../repositories/auth.repository.js";
import { AppError } from "../utils/AppError.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";
import { comparePassword, hashPassword } from "../utils/password.js";

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const authService = {
  register: async (name: string, email: string, password: string) => {
    const existing = await authRepository.findUserByEmail(email);
    if (existing) throw AppError.badRequest("Email already in use");

    return authRepository.createUser({
      name,
      email,
      password: await hashPassword(password),
    });
  },

  login: async (email: string, password: string) => {
    const user = await authRepository.findUserByEmail(email);
    if (!user) throw AppError.unauthorized("Invalid credentials");

    const valid = await comparePassword(password, user.password);
    if (!valid) throw AppError.unauthorized("Invalid credentials");

    const payload = { userId: user.id, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await authRepository.createRefreshToken({
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    });

    return { accessToken, refreshToken, user };
  },

  refresh: async (oldToken: string) => {
    if (!oldToken) throw AppError.unauthorized("Invalid refresh token");

    const stored = await authRepository.findRefreshToken(oldToken);
    if (!stored || stored.expiresAt <= new Date()) {
      throw AppError.unauthorized("Invalid refresh token");
    }

    let payload;
    try {
      payload = verifyRefreshToken(oldToken);
    } catch {
      throw AppError.unauthorized("Invalid refresh token");
    }

    if (payload.userId !== stored.userId) {
      throw AppError.unauthorized("Invalid refresh token");
    }

    const user = await authRepository.findUserById(stored.userId);
    if (!user) {
      throw AppError.unauthorized("Invalid refresh token");
    }

    const newPayload = { userId: user.id, role: user.role };
    const newAccessToken = generateAccessToken(newPayload);
    const newRefreshToken = generateRefreshToken(newPayload);

    await authRepository.rotateRefreshToken(oldToken, {
      token: newRefreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  },

  logout: async (refreshToken: string) => {
    if (refreshToken) {
      await authRepository.deleteRefreshToken(refreshToken);
    }
  },
};
