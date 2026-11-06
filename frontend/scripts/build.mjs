import { config } from "dotenv";
import esbuild from "esbuild";
import { cpSync, mkdirSync, rmSync } from "node:fs";

const mode = process.argv.includes("--production") ? "production" : "development";
config({ path: `.env.${mode}` });

const define = {
  "process.env.API_BASE_URL": JSON.stringify(process.env.API_BASE_URL),
};

// Assembles dist/ as the full site root — index.html, manifest, service
// worker, and theme CSS alongside the bundle — so it's exactly what gets
// published (matches Cloudflare Workers' [assets] directory) and so dev
// serves the same layout as production.
function assembleStaticAssets() {
  rmSync("dist", { recursive: true, force: true });
  mkdirSync("dist/theme", { recursive: true });
  cpSync("index.html", "dist/index.html");
  cpSync("manifest.json", "dist/manifest.json");
  cpSync("sw.js", "dist/sw.js");
  cpSync("src/app.css", "dist/app.css");
  cpSync("theme/tokens.css", "dist/theme/tokens.css");
  cpSync("theme/components.css", "dist/theme/components.css");
}

assembleStaticAssets();

const buildOptions = {
  entryPoints: ["src/index.js"],
  bundle: true,
  outfile: "dist/app.js",
  define,
  minify: mode === "production",
};

if (process.argv.includes("--serve")) {
  const ctx = await esbuild.context(buildOptions);
  await ctx.watch();
  const { host, port } = await ctx.serve({ servedir: "dist", port: 5174 });
  console.log(`Serving on http://${host}:${port}`);
} else {
  await esbuild.build(buildOptions);
}
