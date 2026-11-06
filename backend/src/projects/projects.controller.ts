import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { AuthenticatedGuard } from "../auth/authenticated.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { User } from "../entities/user.entity";
import { CreateProjectDto } from "./dto/create-project.dto";
import { UpdateProjectStatusDto } from "./dto/update-project-status.dto";
import { ProjectsService } from "./projects.service";

@Controller("projects")
@UseGuards(AuthenticatedGuard)
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.projects.findAllForUser(user.id);
  }

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateProjectDto) {
    return this.projects.create(user.id, dto);
  }

  @Patch(":id/status")
  updateStatus(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() dto: UpdateProjectStatusDto,
  ) {
    return this.projects.updateStatus(user.id, id, dto);
  }
}
