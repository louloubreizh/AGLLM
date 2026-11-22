import { defineConfig } from "vite";
import { createMotorApp } from "./scripts/motor-reference.mjs";

export default defineConfig({
  appType: "mpa",
  plugins: [{
    name: "motorAGLLM",
    configureServer(server) {
      server.middlewares.use("/motorAGLLM", createMotorApp());
    },
  }],
  server: { host: "127.0.0.1", port: 8080, strictPort: true },
});
