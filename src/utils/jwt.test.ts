import jwt from "jsonwebtoken";
import { describe, expect, it, vi } from "vitest";
import {
  generateAccessToken,
  verifyAccessToken,
} from "./jwt.js";

vi.mock("../config/env.js", () => ({
  default: {
    ACCESS_TOKEN_SECRET: "a".repeat(64),
    REFRESH_TOKEN_SECRET: "b".repeat(64),
  },
}));

describe("JWT payload validation", () => {
  it("accepts a valid token payload", () => {
    const token = generateAccessToken({ userId: "user-1", role: "USER" });

    expect(verifyAccessToken(token)).toMatchObject({
      userId: "user-1",
      role: "USER",
    });
  });

  it("rejects a token with an invalid role", () => {
    const token = jwt.sign(
      { userId: "user-1", role: "OWNER" },
      "a".repeat(64),
    );

    expect(() => verifyAccessToken(token)).toThrow();
  });

  it("rejects a token with unexpected claims", () => {
    const token = jwt.sign(
      { userId: "user-1", role: "USER", isAdmin: true },
      "a".repeat(64),
    );

    expect(() => verifyAccessToken(token)).toThrow();
  });
});
