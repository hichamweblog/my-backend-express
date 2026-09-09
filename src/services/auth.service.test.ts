import { beforeEach, describe, expect, it, vi } from "vitest";
import { authRepository } from "../repositories/auth.repository.js";
import { authService } from "./auth.service.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";

vi.mock("../repositories/auth.repository.js", () => ({
  authRepository: {
    findRefreshToken: vi.fn(),
    findUserById: vi.fn(),
    rotateRefreshToken: vi.fn(),
  },
}));

vi.mock("../utils/jwt.js", () => ({
  generateAccessToken: vi.fn(() => "new-access-token"),
  generateRefreshToken: vi.fn(() => "new-refresh-token"),
  verifyRefreshToken: vi.fn(),
}));

describe("authService.refresh", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses the user's current database role when rotating tokens", async () => {
    const oldToken = "old-refresh-token";
    vi.mocked(authRepository.findRefreshToken).mockResolvedValue({
      token: oldToken,
      userId: "user-1",
      expiresAt: new Date(Date.now() + 60_000),
    } as never);
    vi.mocked(verifyRefreshToken).mockReturnValue({
      userId: "user-1",
      role: "ADMIN",
    });
    vi.mocked(authRepository.findUserById).mockResolvedValue({
      id: "user-1",
      role: "USER",
    } as never);

    await expect(authService.refresh(oldToken)).resolves.toEqual({
      accessToken: "new-access-token",
      refreshToken: "new-refresh-token",
    });

    expect(generateAccessToken).toHaveBeenCalledWith({
      userId: "user-1",
      role: "USER",
    });
    expect(generateRefreshToken).toHaveBeenCalledWith({
      userId: "user-1",
      role: "USER",
    });
  });

  it("rejects refresh when the user no longer exists", async () => {
    vi.mocked(authRepository.findRefreshToken).mockResolvedValue({
      token: "old-refresh-token",
      userId: "deleted-user",
      expiresAt: new Date(Date.now() + 60_000),
    } as never);
    vi.mocked(verifyRefreshToken).mockReturnValue({
      userId: "deleted-user",
      role: "USER",
    });
    vi.mocked(authRepository.findUserById).mockResolvedValue(null);

    await expect(authService.refresh("old-refresh-token")).rejects.toMatchObject(
      {
        statusCode: 401,
        message: "Invalid refresh token",
      },
    );
  });
});
