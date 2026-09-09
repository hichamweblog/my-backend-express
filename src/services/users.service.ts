import { usersRepository } from "../repositories/users.repository.js";
import { AppError } from "../utils/AppError.js";
import type { UpdateUserInput } from "../types/user.js";

export const usersService = {
  getAllUsers: async () => {
    return usersRepository.findAll();
  },

  getUserById: async (id: string) => {
    const user = await usersRepository.findById(id);
    if (!user) {
      throw AppError.notFound("User not found");
    }
    return user;
  },

  getMe: async (userId: string) => {
    return usersService.getUserById(userId);
  },

  updateUser: async (id: string, updates: UpdateUserInput) => {
    const currentUser = await usersRepository.findById(id);
    if (!currentUser) {
      throw AppError.notFound("User not found");
    }

    if (updates.email && updates.email !== currentUser.email) {
      const existing = await usersRepository.findByEmail(updates.email);
      if (existing) {
        throw AppError.badRequest("Email already in use");
      }
    }

    return usersRepository.update(id, updates);
  },

  updateMe: async (userId: string, updates: UpdateUserInput) =>
    usersService.updateUser(userId, updates),

  deleteUser: async (id: string) => {
    const user = await usersRepository.findById(id);
    if (!user) {
      throw AppError.notFound("User not found");
    }
    await usersRepository.delete(id);
  },
};
