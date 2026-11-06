import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

// googleId is the durable identifier (Google account's stable subject id),
// not an app-local username/password — see DESIGN.org, Open Questions:
// "Future shared identity across the suite".
@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true })
  googleId!: string;

  @Column()
  email!: string;
}
