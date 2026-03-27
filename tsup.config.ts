import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  tsconfig: "./tsconfig.lib.json",
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: false,
  external: ["react", "react-dom", "next", "@google/generative-ai"],
  treeshake: true,
  outDir: "dist",
  esbuildOptions(options) {
    options.jsx = "automatic";
  },
});
