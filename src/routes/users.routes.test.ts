import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../app.js";

describe("users routes", () => {
  it("returns 404 for an unknown users endpoint", async () => {
    const response = await request(app).get("/users/unknown");

    expect(response.status).toBe(404);
    expect(response.body.error).toContain("Route not found");
  });
});
