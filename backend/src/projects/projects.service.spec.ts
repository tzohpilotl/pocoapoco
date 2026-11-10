import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Project } from "../entities/project.entity";
import { ProjectStatusLog } from "../entities/project-status-log.entity";
import { ProjectsService } from "./projects.service";

describe("ProjectsService", () => {
  let service: ProjectsService;
  let projects: { find: jest.Mock; findOne: jest.Mock; create: jest.Mock; save: jest.Mock };
  let projectStatusLogs: { create: jest.Mock; save: jest.Mock };

  beforeEach(async () => {
    projects = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((entity) => entity),
      save: jest.fn((entity) => Promise.resolve(entity)),
    };
    projectStatusLogs = {
      create: jest.fn((entity) => entity),
      save: jest.fn((entity) => Promise.resolve(entity)),
    };

    const module = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: getRepositoryToken(Project), useValue: projects },
        { provide: getRepositoryToken(ProjectStatusLog), useValue: projectStatusLogs },
      ],
    }).compile();

    service = module.get(ProjectsService);
  });

  it("scopes findAllForUser to the given userId", async () => {
    projects.find.mockResolvedValue([]);

    await service.findAllForUser("user-1");

    expect(projects.find).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      relations: { projectStatus: true },
    });
  });

  it("creates a project owned by the given user", async () => {
    const dto = { name: "Acme", projectStatusId: "status-1" };

    const result = await service.create("user-1", dto as any);

    expect(projects.create).toHaveBeenCalledWith({ ...dto, userId: "user-1" });
    expect(result).toMatchObject({ ...dto, userId: "user-1" });
  });

  it("throws when updating status on a project that doesn't belong to the user", async () => {
    projects.findOne.mockResolvedValue(null);

    await expect(
      service.updateStatus("user-1", "project-1", { projectStatusId: "status-2" } as any),
    ).rejects.toThrow("Project project-1 not found");
  });

  it("updates status and writes a status log entry", async () => {
    projects.findOne.mockResolvedValue({ id: "project-1", userId: "user-1", projectStatusId: "status-1" });

    const dto = { projectStatusId: "status-2", notes: "moved to interview" };
    const result = await service.updateStatus("user-1", "project-1", dto as any);

    expect(result.projectStatusId).toBe("status-2");
    expect(projectStatusLogs.save).toHaveBeenCalledWith(
      expect.objectContaining({ projectId: "project-1", projectStatusId: "status-2", notes: dto.notes }),
    );
  });
});
