import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ProjectStatus } from "../entities/project-status.entity";

@Injectable()
export class ProjectStatusesService {
  constructor(
    @InjectRepository(ProjectStatus)
    private readonly statuses: Repository<ProjectStatus>,
  ) {}

  // The overall Project Status catalog, for populating a status picker when
  // creating/updating a project. Ordered by name for a stable, predictable
  // list — the data model has no explicit ordering column (see DESIGN.org,
  // Data Model), so a logical pipeline order isn't expressible here yet.
  findAll(): Promise<ProjectStatus[]> {
    return this.statuses.find({ order: { name: "ASC" } });
  }
}
