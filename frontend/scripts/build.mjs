import { config } from "dotenv";
import esbuild from "esbuild";

const mode = process.argv.includes("--production") ? "production" : "development";
config({ path: `.env.${mode}` });

const define = {
  "process.env.API_BASE_URL": JSON.stringify(process.env.API_BASE_URL),
};

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
  const { host, port } = await ctx.serve({ servedir: ".", port: 5174 });
  console.log(`Serving on http://${host}:${port}`);
} else {
  await esbuild.build(buildOptions);
}
