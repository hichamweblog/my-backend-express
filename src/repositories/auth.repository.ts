import { prisma } from "../config/db.js";

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
} as const;

export const authRepository = {
  findUserByEmail: (email: string) =>
    prisma.user.findUnique({
      where: { email },
    }),

  findUserById: (id: string) =>
    prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true },
    }),

  createUser: (data: { name: string; email: string; password: string }) =>
    prisma.user.create({
      data,
      select: publicUserSelect,
    }),

  createRefreshToken: (data: {
    token: string;
    userId: string;
    expiresAt: Date;
  }) => prisma.refreshToken.create({ data }),

  findRefreshToken: (token: string) =>
    prisma.refreshToken.findUnique({
      where: { token },
    }),

  rotateRefreshToken: (
    oldToken: string,
    newToken: { token: string; userId: string; expiresAt: Date },
  ) =>
    prisma.$transaction([
      prisma.refreshToken.delete({ where: { token: oldToken } }),
      prisma.refreshToken.create({ data: newToken }),
    ]),

  deleteRefreshToken: (token: string) =>
    prisma.refreshToken.deleteMany({
      where: { token },
    }),
};