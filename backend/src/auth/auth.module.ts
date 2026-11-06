import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "../entities/user.entity";
import { AuthController } from "./auth.controller";
import { GoogleStrategy } from "./google.strategy";
import { SessionSerializer } from "./session-serializer";

@Module({
  imports: [TypeOrmModule.forFeature([User]), PassportModule.register({ session: true })],
  controllers: [AuthController],
  providers: [GoogleStrategy, SessionSerializer],
})
export class AuthModule {}
