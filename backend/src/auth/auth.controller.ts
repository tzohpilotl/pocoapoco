import { Controller, Get, Req, Res, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Request, Response } from "express";

@Controller("auth")
export class AuthController {
  @Get("google")
  @UseGuards(AuthGuard("google"))
  googleLogin(): void {
    // Passport redirects to Google; nothing to do here.
  }

  @Get("google/callback")
  @UseGuards(AuthGuard("google"))
  googleCallback(@Res() res: Response): void {
    res.redirect("/");
  }

  @Get("logout")
  logout(@Req() req: Request, @Res() res: Response): void {
    req.logout(() => res.redirect("/"));
  }
}
