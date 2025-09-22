import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  outDir: "dist",
  format: ["cjs", "esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  target: "es2020",
  splitting: false,
  treeshake: true,
  minify: false,
  esbuildOptions(options) {
    // Keep `__dirname`/`__filename` behavior consistent for CJS where needed.
    options.define = {
      ...(options.define || {}),
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "production"),
    };
  },
});
