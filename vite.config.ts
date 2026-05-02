import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/bitbard.ts",
      fileName: "bitbard",
      formats: ["es"],
    },
    outDir: "dist",
    target: "node24",
    rolldownOptions: {
      external: [/^node:/, "pdfkit"],
      output: {
        entryFileNames: "bitbard.js",
      },
    },
  },
});
