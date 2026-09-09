import { describe, it, expect, vi } from "vitest";
import { usersService } from "./users.service.js";
import { usersRepository } from "../repositories/users.repository.js";

vi.mock("../repositories/users.repository.js", () => ({
  usersRepository: {
    findById: vi.fn(),
  },
}));

describe("usersService", () => {
  it("returns the requested user", async () => {
    const user = {
      id: "user-1",
      name: "Test User",
      email: "test@example.com",
      role: "USER" as const,
      createdAt: new Date(),
    };
    vi.mocked(usersRepository.findById).mockResolvedValue(user);

    await expect(usersService.getUserById(user.id)).resolves.toEqual(user);
  });

  it("throws when the requested user does not exist", async () => {
    vi.mocked(usersRepository.findById).mockResolvedValue(null);

    await expect(usersService.getUserById("missing")).rejects.toMatchObject({
      statusCode: 404,
      message: "User not found",
    });
  });
});
