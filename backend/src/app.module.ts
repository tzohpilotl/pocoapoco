import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "./auth/auth.module";
import { Project } from "./entities/project.entity";
import { ProjectStatus } from "./entities/project-status.entity";
import { ProjectStatusConfiguration } from "./entities/project-status-configuration.entity";
import { ProjectStatusLog } from "./entities/project-status-log.entity";
import { User } from "./entities/user.entity";
import { ProjectsModule } from "./projects/projects.module";
import { ProjectStatusesModule } from "./project-statuses/project-statuses.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: "postgres",
        host: config.get<string>("DB_HOST", "localhost"),
        port: config.get<number>("DB_PORT", 5432),
        username: config.get<string>("DB_USER", "tracking_service"),
        password: config.get<string>("DB_PASSWORD", "tracking_service"),
        database: config.get<string>("DB_NAME", "tracking_service"),
        entities: [User, Project, ProjectStatus, ProjectStatusLog, ProjectStatusConfiguration],
        synchronize: false,
      }),
    }),
    AuthModule,
    ProjectsModule,
    ProjectStatusesModule,
  ],
})
export class AppModule {}
