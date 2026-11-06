import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { ProjectStatus } from "./project-status.entity";
import { User } from "./user.entity";

@Entity()
export class Project {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: "userId" })
  user!: User;

  @Column()
  userId!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  description?: string;

  @ManyToOne(() => ProjectStatus, { nullable: false })
  @JoinColumn({ name: "projectStatusId" })
  projectStatus!: ProjectStatus;

  @Column()
  projectStatusId!: string;
}
