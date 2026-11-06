import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { Project } from "./project.entity";
import { ProjectStatus } from "./project-status.entity";

@Entity()
export class ProjectStatusConfiguration {
  @PrimaryColumn()
  projectId!: string;

  @ManyToOne(() => Project, { nullable: false })
  @JoinColumn({ name: "projectId" })
  project!: Project;

  @PrimaryColumn()
  projectStatusId!: string;

  @ManyToOne(() => ProjectStatus, { nullable: false })
  @JoinColumn({ name: "projectStatusId" })
  projectStatus!: ProjectStatus;
}
