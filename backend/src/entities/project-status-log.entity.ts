import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Project } from "./project.entity";
import { ProjectStatus } from "./project-status.entity";

@Entity()
export class ProjectStatusLog {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @CreateDateColumn()
  loggedAt!: Date;

  @ManyToOne(() => Project, { nullable: false })
  @JoinColumn({ name: "projectId" })
  project!: Project;

  @Column()
  projectId!: string;

  @ManyToOne(() => ProjectStatus, { nullable: false })
  @JoinColumn({ name: "projectStatusId" })
  projectStatus!: ProjectStatus;

  @Column()
  projectStatusId!: string;

  // Open Questions: "Project Status Log notes field" — assumed needed, not
  // in the original diagram.
  @Column({ nullable: true })
  notes?: string;
}
