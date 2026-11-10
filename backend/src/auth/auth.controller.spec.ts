import { AuthController } from "./auth.controller";
import { User } from "../entities/user.entity";

describe("AuthController", () => {
  let users: { findOne: jest.Mock; create: jest.Mock; save: jest.Mock };
  let controller: AuthController;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    users = {
      findOne: jest.fn(),
      create: jest.fn((entity) => entity),
      save: jest.fn((entity) => Promise.resolve({ id: "user-1", ...entity })),
    };
    const config = { get: (_key: string, def?: unknown) => def };
    controller = new AuthController(config as never, users as never);
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it("me returns only the id and email of the current user", () => {
    const user = {
      id: "user-1",
      email: "jobseeker@example.com",
      googleId: "google-sub-123",
    } as User;

    expect(controller.me(user)).toEqual({ id: "user-1", email: "jobseeker@example.com" });
  });

  it("redirects to the frontend origin after the OAuth callback (not the API host)", () => {
    const res = { redirect: jest.fn() };

    controller.googleCallback(res as never);

    expect(res.redirect).toHaveBeenCalledWith("http://localhost:5174");
  });

  it("logs out and redirects to the frontend origin", () => {
    const req = { logout: jest.fn((cb) => cb()) };
    const res = { redirect: jest.fn() };

    controller.logout(req as never, res as never);

    expect(req.logout).toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalledWith("http://localhost:5174");
  });

  describe("test-login", () => {
    function mockRes() {
      return {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
    }

    it("is disabled in production — responds 404 without touching the session", async () => {
      process.env.NODE_ENV = "production";
      const req = { login: jest.fn() };
      const res = mockRes();

      await controller.testLogin(req as never, res as never);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(req.login).not.toHaveBeenCalled();
      expect(users.findOne).not.toHaveBeenCalled();
    });

    it("creates the test user on first use and logs it in", async () => {
      process.env.NODE_ENV = "development";
      users.findOne.mockResolvedValue(null);
      const req = { login: jest.fn((_user, cb) => cb(null)) };
      const res = mockRes();

      await controller.testLogin(req as never, res as never);

      expect(users.create).toHaveBeenCalledWith({
        googleId: "dev-test-user",
        email: "dev@example.com",
      });
      expect(req.login).toHaveBeenCalledWith(
        expect.objectContaining({ googleId: "dev-test-user" }),
        expect.any(Function),
      );
      expect(res.json).toHaveBeenCalledWith({ ok: true });
    });

    it("reuses the existing test user on subsequent logins", async () => {
      process.env.NODE_ENV = "development";
      const existing = { id: "user-1", googleId: "dev-test-user", email: "dev@example.com" };
      users.findOne.mockResolvedValue(existing);
      const req = { login: jest.fn((_user, cb) => cb(null)) };
      const res = mockRes();

      await controller.testLogin(req as never, res as never);

      expect(users.create).not.toHaveBeenCalled();
      expect(req.login).toHaveBeenCalledWith(existing, expect.any(Function));
      expect(res.json).toHaveBeenCalledWith({ ok: true });
    });
  });
});
