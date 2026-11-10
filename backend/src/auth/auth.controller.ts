import { Controller, Get, Req, Res, UseGuards } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Request, Response } from "express";
import { Repository } from "typeorm";
import { AuthenticatedGuard } from "./authenticated.guard";
import { GoogleAuthGuard } from "./google-auth.guard";
import { CurrentUser } from "./current-user.decorator";
import { User } from "../entities/user.entity";

// Stable identity for the dev/test bypass user, so repeated test-logins reuse
// the same User row (and its projects) rather than piling up duplicates.
const TEST_USER_GOOGLE_ID = "dev-test-user";
const TEST_USER_EMAIL = "dev@example.com";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly config: ConfigService,
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  // Where to send the browser after OAuth / logout: the SPA's origin, not this
  // service. In prod the Client is a separate origin (Cloudflare) from the
  // Tracking Service, so a bare redirect("/") would land on the API host (404),
  // which is exactly what happened before this was wired up.
  private frontendOrigin(): string {
    return this.config.get<string>("FRONTEND_ORIGIN", "http://localhost:5174");
  }

  @Get("google")
  @UseGuards(GoogleAuthGuard)
  googleLogin(): void {
    // Passport redirects to Google; nothing to do here.
  }

  // Dev/test-only bypass that mints a real session without the Google OAuth
  // round-trip — so a full-functionality backend can be exercised locally (and
  // by future e2e tests) without real Google credentials. Mirrors tempo-app's
  // /auth/test-login. Hard-disabled in production: returns 404 so the route is
  // indistinguishable from not existing.
  @Get("test-login")
  async testLogin(@Req() req: Request, @Res() res: Response): Promise<void> {
    if (process.env.NODE_ENV === "production") {
      res.status(404).json({ message: "Not found" });
      return;
    }

    let user = await this.users.findOne({ where: { googleId: TEST_USER_GOOGLE_ID } });
    if (!user) {
      user = await this.users.save(
        this.users.create({ googleId: TEST_USER_GOOGLE_ID, email: TEST_USER_EMAIL }),
      );
    }

    await new Promise<void>((resolve, reject) => {
      req.login(user as User, (err) => (err ? reject(err) : resolve()));
    });

    res.json({ ok: true });
  }

  // Lets the client discover the signed-in user (or get a 401 when there
  // isn't one) — the only way the SPA can tell whether a session exists,
  // since the session cookie is HttpOnly. Returns just the fields the client
  // needs, not the whole User row.
  @Get("me")
  @UseGuards(AuthenticatedGuard)
  me(@CurrentUser() user: User): { id: string; email: string } {
    return { id: user.id, email: user.email };
  }

  @Get("google/callback")
  @UseGuards(GoogleAuthGuard)
  googleCallback(@Res() res: Response): void {
    res.redirect(this.frontendOrigin());
  }

  @Get("logout")
  logout(@Req() req: Request, @Res() res: Response): void {
    req.logout(() => res.redirect(this.frontendOrigin()));
  }
}
