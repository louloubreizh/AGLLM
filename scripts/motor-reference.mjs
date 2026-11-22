import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { extname, join } from "node:path";
import express from "express";
import { root } from "./instance.mjs";

const motorRoot = join(root, "motorAGLLM");
export const motorDirectory = join(motorRoot, "source");
export const motorRevision = readFileSync(join(motorRoot, "revision.txt"), "utf8").trim();
const entryFiles = new Set([
  "index.html", "config.js", "core.js", "game.js", "i18n.js", "version.json", "build.version.json",
  "server.json", "icon.png", "changelog.txt", "license.txt",
]);
const assetDirectories = new Set(["js", "lib", "res"]);
const policy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "worker-src 'self' blob:",
  "object-src 'none'",
].join("; ");

function git(directory, args) {
  try {
    return execFileSync("git", ["--no-optional-locks", "-C", directory, ...args], {
      encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], windowsHide: true,
    });
  } catch {
    throw new Error("Initialisez motorAGLLM/source avec git submodule update --init motorAGLLM/source.");
  }
}

export function verifyMotor(directory = motorDirectory, expected = motorRevision) {
  if (git(directory, ["rev-parse", "HEAD"]).trim() !== expected) {
    throw new Error("Le moteur de référence n’est pas à la révision attendue.");
  }
  if (git(directory, ["status", "--porcelain=v1", "--untracked-files=all", "--ignored"]).trim()) {
    throw new Error("Le moteur de référence a été modifié. Rétablissez la copie d’origine.");
  }
  return git(directory, ["ls-tree", "-rz", expected]).split("\0").filter(Boolean).map((entry) => {
    const separator = entry.indexOf("\t");
    const [mode, type, hash] = entry.slice(0, separator).split(" ");
    return { path: entry.slice(separator + 1), mode, type, hash };
  });
}

function isPublicFile(path) {
  const [directory, ...segments] = path.split("/");
  return entryFiles.has(path) || (assetDirectories.has(directory) && segments.length > 0
    && segments.every((segment) => segment && !segment.startsWith(".")));
}

function blobHash(content) {
  return createHash("sha1").update(`blob ${content.length}\0`).update(content).digest("hex");
}

function verifiedContents({ path, hash }) {
  const content = readFileSync(join(motorDirectory, path));
  if (blobHash(content) === hash) return content;
  // Git peut convertir les fins de ligne dans un checkout Windows.
  const normalized = Buffer.from(content.toString("utf8").replace(/\r\n/g, "\n"));
  if (blobHash(normalized) === hash) return normalized;
  throw new Error(`Le contenu de référence a changé · ${path}`);
}

export function createMotorApp() {
  const app = express();
  app.disable("x-powered-by");
  let files;
  app.get(/.*/, (request, response) => {
    if (request.path === "/" && request.originalUrl.split("?")[0] === "/motorAGLLM") {
      return response.redirect(308, "/motorAGLLM/");
    }
    const filename = request.path === "/" ? "index.html" : request.path.slice(1);
    if (!isPublicFile(filename)) return response.sendStatus(404);
    if (filename === "index.html" && request.get("Sec-Fetch-Dest") === "document") {
      return response.redirect(302, "/");
    }

    if (!files || filename === "index.html") {
      try {
        const entries = verifyMotor();
        files ??= new Map(entries.filter(({ path, type }) => type === "blob" && isPublicFile(path))
          .map((entry) => [entry.path, verifiedContents(entry)]));
      } catch (error) {
        files = null;
        return response.status(503).type("text").send(error.message);
      }
    }

    const content = files.get(filename);
    if (!content) return response.sendStatus(404);
    response.set({ "Cache-Control": "no-cache", "Content-Security-Policy": policy });
    return response.type(extname(filename)).send(content);
  });
  return app;
}
