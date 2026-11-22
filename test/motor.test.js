import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { motorRevision, verifyMotor } from "../scripts/motor-reference.mjs";

test("la référence épinglée est intacte", () => {
  const entries = verifyMotor();
  assert.ok(entries.some(({ path }) => path === "game.js"));
  assert.ok(entries.some(({ path }) => path === "js/resources.js"));
});

test("le contrôle rejette une autre révision et un contenu modifié ou ajouté", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "agllm-motor-test-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const git = (...args) => execFileSync("git", ["-C", directory, ...args], {
    encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], windowsHide: true,
  });
  git("init", "-q");
  const entry = join(directory, "index.html");
  await writeFile(entry, "Référence.");
  git("add", "index.html");
  git("-c", "user.name=AGLLM Test", "-c", "user.email=test@example.invalid", "-c", "commit.gpgsign=false", "commit", "-qm", "Référence");
  const revision = git("rev-parse", "HEAD").trim();
  assert.equal(verifyMotor(directory, revision).length, 1);
  assert.throws(() => verifyMotor(directory, motorRevision), /révision attendue/);

  const addition = join(directory, "ajout.js");
  await writeFile(addition, "ajout");
  assert.throws(() => verifyMotor(directory, revision), /a été modifié/);
  await rm(addition);
  await writeFile(entry, "Contenu remplacé.");
  assert.throws(() => verifyMotor(directory, revision), /a été modifié/);
});
