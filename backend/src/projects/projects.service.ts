import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Project } from "../entities/project.entity";
import { ProjectStatusLog } from "../entities/project-status-log.entity";
import { CreateProjectDto } from "./dto/create-project.dto";
import { UpdateProjectStatusDto } from "./dto/update-project-status.dto";

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projects: Repository<Project>,
    @InjectRepository(ProjectStatusLog)
    private readonly projectStatusLogs: Repository<ProjectStatusLog>,
  ) {}

  findAllForUser(userId: string): Promise<Project[]> {
    return this.projects.find({ where: { userId } });
  }

  create(userId: string, dto: CreateProjectDto): Promise<Project> {
    const project = this.projects.create({ ...dto, userId });
    return this.projects.save(project);
  }

  async updateStatus(
    userId: string,
    projectId: string,
    dto: UpdateProjectStatusDto,
  ): Promise<Project> {
    const project = await this.projects.findOne({ where: { id: projectId, userId } });
    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    project.projectStatusId = dto.projectStatusId;
    await this.projects.save(project);

    await this.projectStatusLogs.save(
      this.projectStatusLogs.create({
        projectId,
        projectStatusId: dto.projectStatusId,
        notes: dto.notes,
      }),
    );

    return project;
  }
}
