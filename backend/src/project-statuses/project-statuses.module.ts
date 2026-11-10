import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ProjectStatus } from "../entities/project-status.entity";
import { ProjectStatusesController } from "./project-statuses.controller";
import { ProjectStatusesService } from "./project-statuses.service";

@Module({
  imports: [TypeOrmModule.forFeature([ProjectStatus])],
  controllers: [ProjectStatusesController],
  providers: [ProjectStatusesService],
})
export class ProjectStatusesModule {}
