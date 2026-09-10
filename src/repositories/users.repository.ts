import { prisma } from "../config/db.js";
import type { PublicUser, UpdateUserInput } from "../types/user.js";

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
} as const;

export const usersRepository = {
  findAll: () =>
    prisma.user.findMany({
      select: publicUserSelect,
      orderBy: { createdAt: "desc" },
    }),

  findById: (id: string) =>
    prisma.user.findUnique({
      where: { id },
      select: publicUserSelect,
    }),

  findByEmail: (email: string) =>
    prisma.user.findUnique({
      where: { email },
      select: { id: true },
    }),

  update: (id: string, updates: UpdateUserInput) =>
    prisma.user.update({
      where: { id },
      data: updates,
      select: publicUserSelect,
    }),

  delete: (id: string) =>
    prisma.$transaction([
      prisma.refreshToken.deleteMany({ where: { userId: id } }),
      prisma.user.delete({ where: { id } }),
    ]),
};
