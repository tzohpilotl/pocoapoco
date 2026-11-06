import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { PassportSerializer } from "@nestjs/passport";
import { Repository } from "typeorm";
import { User } from "../entities/user.entity";

@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {
    super();
  }

  serializeUser(user: User, done: (err: Error | null, id: string) => void): void {
    done(null, user.id);
  }

  async deserializeUser(
    id: string,
    done: (err: Error | null, user: User | null) => void,
  ): Promise<void> {
    const user = await this.users.findOne({ where: { id } });
    done(null, user);
  }
}
