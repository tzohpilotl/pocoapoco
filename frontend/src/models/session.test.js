import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("mithril", () => ({ default: { request: vi.fn() } }));
vi.mock("../config", () => ({ API_BASE_URL: "http://localhost:4000" }));

import m from "mithril";
import Session from "./session";

describe("Session", () => {
  beforeEach(() => {
    Session.current = null;
    vi.clearAllMocks();
  });

  it("starts signed out", () => {
    expect(Session.current).toBeNull();
    expect(Session.isAuthenticated).toBe(false);
  });

  it("loads the current user with credentials and marks the session authenticated", async () => {
    const user = { id: "user-1", email: "jobseeker@example.com" };
    m.request.mockResolvedValue(user);

    const result = await Session.load();

    expect(m.request).toHaveBeenCalledWith({
      method: "GET",
      url: "http://localhost:4000/auth/me",
      withCredentials: true,
    });
    expect(result).toEqual(user);
    expect(Session.current).toEqual(user);
    expect(Session.isAuthenticated).toBe(true);
  });

  it("treats a 401 as signed out, not an error", async () => {
    const unauthorized = Object.assign(new Error("Unauthorized"), { code: 401 });
    m.request.mockRejectedValue(unauthorized);

    const result = await Session.load();

    expect(result).toBeNull();
    expect(Session.current).toBeNull();
    expect(Session.isAuthenticated).toBe(false);
  });

  it("propagates non-401 failures without changing auth state", async () => {
    const serverError = Object.assign(new Error("boom"), { code: 500 });
    m.request.mockRejectedValue(serverError);

    await expect(Session.load()).rejects.toThrow("boom");
    expect(Session.current).toBeNull();
  });

  it("rejects a malformed user response and stays signed out", async () => {
    m.request.mockResolvedValue({ id: "user-1" /* missing email */ });

    await expect(Session.load()).rejects.toThrow("Invalid user response");
    expect(Session.current).toBeNull();
    expect(Session.isAuthenticated).toBe(false);
  });

  it("builds the login URL from the API base", () => {
    expect(Session.loginUrl()).toBe("http://localhost:4000/auth/google");
  });
});
