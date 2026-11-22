import { defineConfig } from "vite";
import { createGameApp } from "./scripts/game-files.mjs";

export default defineConfig({
  plugins: [{
    name: "local-kittens-game",
    configureServer(server) {
      server.middlewares.use("/jeu", createGameApp());
    },
  }],
});
