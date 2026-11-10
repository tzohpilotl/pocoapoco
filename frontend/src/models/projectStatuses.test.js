import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("mithril", () => ({ default: { request: vi.fn() } }));
vi.mock("../config", () => ({ API_BASE_URL: "http://localhost:4000" }));

import m from "mithril";
import ProjectStatuses from "./projectStatuses";

describe("ProjectStatuses", () => {
  beforeEach(() => {
    ProjectStatuses.list = [];
    vi.clearAllMocks();
  });

  it("starts with an empty list", () => {
    expect(ProjectStatuses.list).toEqual([]);
  });

  it("loads the catalog from the API into list", async () => {
    const catalog = [
      { id: "1", name: "first contact" },
      { id: "2", name: "interviewed" },
    ];
    m.request.mockResolvedValue(catalog);

    await ProjectStatuses.load();

    expect(m.request).toHaveBeenCalledWith({
      method: "GET",
      url: "http://localhost:4000/project-statuses",
      withCredentials: true,
    });
    expect(ProjectStatuses.list).toEqual(catalog);
  });

  it("propagates a request failure without mutating list", async () => {
    m.request.mockRejectedValue(new Error("network down"));

    await expect(ProjectStatuses.load()).rejects.toThrow("network down");
    expect(ProjectStatuses.list).toEqual([]);
  });

  it("rejects a non-array response without mutating list", async () => {
    m.request.mockResolvedValue({ not: "an array" });

    await expect(ProjectStatuses.load()).rejects.toThrow("Invalid project statuses response");
    expect(ProjectStatuses.list).toEqual([]);
  });

  it("rejects a response with malformed status entries", async () => {
    m.request.mockResolvedValue([{ id: "1" /* missing name */ }]);

    await expect(ProjectStatuses.load()).rejects.toThrow("Invalid project statuses response");
    expect(ProjectStatuses.list).toEqual([]);
  });
});
