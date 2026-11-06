import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import connectPgSimple = require("connect-pg-simple");
import session = require("express-session");
import passport = require("passport");
import { Pool } from "pg";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

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
      cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 },
    }),
  );
  app.use(passport.initialize());
  app.use(passport.session());

  await app.listen(config.get<number>("PORT", 3002));
}

bootstrap();
