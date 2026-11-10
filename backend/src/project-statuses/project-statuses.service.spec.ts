import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { ProjectStatus } from "../entities/project-status.entity";
import { ProjectStatusesService } from "./project-statuses.service";

describe("ProjectStatusesService", () => {
  let service: ProjectStatusesService;
  let statuses: { find: jest.Mock };

  beforeEach(async () => {
    statuses = { find: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        ProjectStatusesService,
        { provide: getRepositoryToken(ProjectStatus), useValue: statuses },
      ],
    }).compile();

    service = module.get(ProjectStatusesService);
  });

  it("returns the whole catalog ordered by name", async () => {
    const catalog = [
      { id: "1", name: "first contact" },
      { id: "2", name: "interviewed" },
    ];
    statuses.find.mockResolvedValue(catalog);

    const result = await service.findAll();

    expect(statuses.find).toHaveBeenCalledWith({ order: { name: "ASC" } });
    expect(result).toBe(catalog);
  });
});
