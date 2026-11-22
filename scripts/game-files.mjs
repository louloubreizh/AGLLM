import express from "express";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { root } from "./instance.mjs";

export function createGameApp() {
  const directory = resolve(process.env.KGLLM_GAME_DIR || join(root, "..", "kittensgame-master"));
  const entry = join(directory, "index.html");
  const paths = [
    "config.js", "core.js", "game.js", "i18n.js", "version.json", "build.version.json",
    "server.json", "icon.png", "changelog.txt", "license.txt",
  ];
  const game = express();
  game.disable("x-powered-by");
  game.use((request, response, next) => {
    if (/^\/jeu(?:\?|$)/.test(request.originalUrl)) {
      return response.redirect(308, `/jeu/${request.originalUrl.slice("/jeu".length)}`);
    }
    if (!existsSync(entry)) {
      return response.status(503).type("text").send("Le dossier local de Kittens Game est introuvable.");
    }
    response.set("X-Frame-Options", "SAMEORIGIN");
    next();
  });
  game.get(["/", "/index.html"], (_request, response) => response.sendFile(entry));
  game.get(paths.map((file) => `/${file}`), (request, response) => {
    response.sendFile(request.path.slice(1), { root: directory });
  });
  for (const name of ["js", "lib", "res"]) {
    game.use(`/${name}`, express.static(join(directory, name), { dotfiles: "deny", index: false }));
  }
  return game;
}
