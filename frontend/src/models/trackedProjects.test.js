import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("mithril", () => ({ default: { request: vi.fn() } }));
vi.mock("../config", () => ({ API_BASE_URL: "http://localhost:4000" }));

import m from "mithril";
import TrackedProjects from "./trackedProjects";

describe("TrackedProjects", () => {
  beforeEach(() => {
    TrackedProjects.list = [];
    vi.clearAllMocks();
  });

  it("starts with an empty list", () => {
    expect(TrackedProjects.list).toEqual([]);
  });

  it("loads projects from the API into list", async () => {
    const projects = [
      { id: "1", name: "Acme Corp", description: "Backend engineer role", projectStatusId: 2 },
    ];
    m.request.mockResolvedValue(projects);

    await TrackedProjects.load();

    expect(m.request).toHaveBeenCalledWith({
      method: "GET",
      url: "http://localhost:4000/projects",
      withCredentials: true,
    });
    expect(TrackedProjects.list).toEqual(projects);
  });

  it("propagates a request failure without mutating list", async () => {
    const error = new Error("network down");
    m.request.mockRejectedValue(error);

    await expect(TrackedProjects.load()).rejects.toThrow("network down");
    expect(TrackedProjects.list).toEqual([]);
  });

  it("rejects a non-array response without mutating list", async () => {
    m.request.mockResolvedValue({ not: "an array" });

    await expect(TrackedProjects.load()).rejects.toThrow("Invalid projects response");
    expect(TrackedProjects.list).toEqual([]);
  });

  it("rejects a response with malformed project entries", async () => {
    m.request.mockResolvedValue([{ id: "1" /* missing name */ }]);

    await expect(TrackedProjects.load()).rejects.toThrow("Invalid projects response");
    expect(TrackedProjects.list).toEqual([]);
  });

  it("creates a project then reloads the list", async () => {
    const created = { id: "9", name: "New Co", description: "Role", projectStatusId: "s1" };
    const reloaded = [{ id: "9", name: "New Co", description: "Role", projectStatusId: "s1" }];
    m.request.mockResolvedValueOnce(created); // POST /projects
    m.request.mockResolvedValueOnce(reloaded); // GET /projects reload

    await TrackedProjects.create({ name: "New Co", description: "Role", projectStatusId: "s1" });

    expect(m.request).toHaveBeenNthCalledWith(1, {
      method: "POST",
      url: "http://localhost:4000/projects",
      withCredentials: true,
      body: { name: "New Co", description: "Role", projectStatusId: "s1" },
    });
    expect(m.request).toHaveBeenNthCalledWith(2, {
      method: "GET",
      url: "http://localhost:4000/projects",
      withCredentials: true,
    });
    expect(TrackedProjects.list).toEqual(reloaded);
  });

  it("does not reload the list if the create request fails", async () => {
    m.request.mockRejectedValueOnce(new Error("create failed"));

    await expect(
      TrackedProjects.create({ name: "New Co", projectStatusId: "s1" }),
    ).rejects.toThrow("create failed");

    expect(m.request).toHaveBeenCalledTimes(1);
    expect(TrackedProjects.list).toEqual([]);
  });
});
