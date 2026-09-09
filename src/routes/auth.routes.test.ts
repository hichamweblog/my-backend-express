import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import app from "../app.js";
import { authService } from "../services/auth.service.js";
import { AppError } from "../utils/AppError.js";

vi.mock("../services/auth.service.js", () => ({
  authService: {
    register: vi.fn(),
    login: vi.fn(),
    refresh: vi.fn(),
    logout: vi.fn(),
  },
}));

describe("auth routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registers a user through the full HTTP endpoint", async () => {
    vi.mocked(authService.register).mockResolvedValue({
      id: "user-1",
      name: "Test User",
      email: "test@example.com",
      role: "USER",
    } as never);

    const response = await request(app).post("/auth/register").send({
      name: " Test User ",
      email: "test@example.com",
      password: "password123",
    });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      id: "user-1",
      name: "Test User",
      email: "test@example.com",
    });
    expect(authService.register).toHaveBeenCalledWith(
      "Test User",
      "test@example.com",
      "password123",
    );
  });

  it("rejects invalid registration input before the service", async () => {
    const response = await request(app).post("/auth/register").send({
      name: "",
      email: "not-an-email",
      password: "short",
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Validation failed");
    expect(authService.register).not.toHaveBeenCalled();
  });

  it("sets HTTP-only auth cookies on login", async () => {
    vi.mocked(authService.login).mockResolvedValue({
      accessToken: "access-token",
      refreshToken: "refresh-token",
      user: {
        id: "user-1",
        name: "Test User",
        email: "test@example.com",
        role: "USER",
      },
    } as never);

    const response = await request(app).post("/auth/login").send({
      email: "test@example.com",
      password: "password123",
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: "user-1",
      name: "Test User",
      role: "USER",
    });
    expect(response.headers["set-cookie"]).toEqual(
      expect.arrayContaining([
        expect.stringContaining("accessToken=access-token"),
        expect.stringContaining("refreshToken=refresh-token"),
      ]),
    );
  });

  it("returns the service error for an invalid refresh request", async () => {
    vi.mocked(authService.refresh).mockRejectedValue(
      AppError.unauthorized("Invalid refresh token"),
    );

    const response = await request(app).post("/auth/refresh");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Invalid refresh token" });
  });
});
