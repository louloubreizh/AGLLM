import { chmodSync, lstatSync } from "node:fs";
import { join } from "node:path";
import { motorDirectory, verifyMotor } from "./motor-reference.mjs";

try {
  for (const { path, mode } of verifyMotor()) {
    if (mode !== "100644" && mode !== "100755") throw new Error(`Entrée non prise en charge · ${path}`);
    const filename = join(motorDirectory, path);
    const status = lstatSync(filename);
    if (!status.isFile()) throw new Error(`Fichier de référence invalide · ${path}`);
    chmodSync(filename, status.mode & ~0o222);
  }
  console.log("Les fichiers de motorAGLLM/source sont en lecture seule.");
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
