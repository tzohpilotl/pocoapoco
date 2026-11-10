import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import connectPgSimple = require("connect-pg-simple");
import session = require("express-session");
import passport = require("passport");
import { Pool } from "pg";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  // In production the client (Cloudflare) and this service live on different
  // origins, so the session cookie is cross-site: it needs SameSite=None;
  // Secure, which in turn requires the browser to see the request as HTTPS.
  // Behind Caddy that means trusting the proxy's X-Forwarded-Proto.
  const isProd = config.get<string>("NODE_ENV") === "production";

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Allow the SPA's origin to send credentialed (cookie-bearing) requests.
  // FRONTEND_ORIGIN is the deployed client in prod; defaults to the local
  // esbuild dev server otherwise.
  app.enableCors({
    origin: config.get<string>("FRONTEND_ORIGIN", "http://localhost:5174"),
    credentials: true,
  });

  if (isProd) {
    app.set("trust proxy", 1);
  }

  const PgSession = connectPgSimple(session);
  app.use(
    session({
      store: new PgSession({
        pool: new Pool({
          host: config.get<string>("DB_HOST", "localhost"),
          port: config.get<number>("DB_PORT", 5432),
          user: config.get<string>("DB_USER", "tracking_service"),
          password: config.get<string>("DB_PASSWORD", "tracking_service"),
          database: config.get<string>("DB_NAME", "tracking_service"),
        }),
        createTableIfMissing: true,
      }),
      // config.get's default only applies when the key is undefined, not when
      // it's present-but-empty (as in .env.example) — hence the `||` fallback.
      secret: config.get<string>("SESSION_SECRET") || "dev-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        // Cross-site in prod (Cloudflare client -> this service), same-site
        // locally. SameSite=None is only honored alongside Secure.
        sameSite: isProd ? "none" : "lax",
        secure: isProd,
      },
    }),
  );
  app.use(passport.initialize());
  app.use(passport.session());

  await app.listen(config.get<number>("PORT", 3002));
}

bootstrap();
