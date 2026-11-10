import { ExecutionContext, Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Request } from "express";

// Apply to the Google OAuth routes (/auth/google and its callback).
//
// The plain AuthGuard("google") authenticates the request and populates
// req.user, but it never calls req.logIn() — so Passport never serializes the
// user into the session store, and the login doesn't survive the redirect
// (every later request comes back unauthenticated). Overriding canActivate to
// call super.logIn() explicitly is what persists the session. On the initial
// /auth/google redirect route super.canActivate() throws before we reach the
// logIn call, so this only establishes a session on the callback.
@Injectable()
export class GoogleAuthGuard extends AuthGuard("google") {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const activate = (await super.canActivate(context)) as boolean;
    const request = context.switchToHttp().getRequest<Request>();
    await super.logIn(request);
    return activate;
  }
}
