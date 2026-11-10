import { Controller, Get, UseGuards } from "@nestjs/common";
import { AuthenticatedGuard } from "../auth/authenticated.guard";
import { ProjectStatusesService } from "./project-statuses.service";

@Controller("project-statuses")
@UseGuards(AuthenticatedGuard)
export class ProjectStatusesController {
  constructor(private readonly statuses: ProjectStatusesService) {}

  @Get()
  findAll() {
    return this.statuses.findAll();
  }
}
