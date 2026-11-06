import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Project } from "../entities/project.entity";
import { ProjectStatusLog } from "../entities/project-status-log.entity";
import { ProjectsController } from "./projects.controller";
import { ProjectsService } from "./projects.service";

@Module({
  imports: [TypeOrmModule.forFeature([Project, ProjectStatusLog])],
  controllers: [ProjectsController],
  providers: [ProjectsService],
})
export class ProjectsModule {}
