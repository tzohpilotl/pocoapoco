import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, VerifyCallback } from "passport-google-oauth20";
import { Repository } from "typeorm";
import { User } from "../entities/user.entity";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
  constructor(
    config: ConfigService,
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {
    super({
      // Falls back to placeholders so the app can boot without real Google
      // credentials configured yet — /auth/google itself won't work until
      // GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET are set for real (passport-oauth2
      // throws at construction time if clientID/clientSecret are missing).
      clientID: config.get<string>("GOOGLE_CLIENT_ID") || "unset-client-id",
      clientSecret: config.get<string>("GOOGLE_CLIENT_SECRET") || "unset-client-secret",
      callbackURL: config.get<string>("GOOGLE_CALLBACK_URL", "http://localhost:3002/auth/google/callback"),
      scope: ["email", "profile"],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: { id: string; emails?: { value: string }[] },
    done: VerifyCallback,
  ): Promise<void> {
    const googleId = profile.id;
    const email = profile.emails?.[0]?.value ?? "";

    let user = await this.users.findOne({ where: { googleId } });
    if (!user) {
      user = await this.users.save(this.users.create({ googleId, email }));
    }

    done(null, user);
  }
}
