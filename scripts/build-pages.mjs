import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { root } from "./instance.mjs";
import { motorContentSecurityPolicy, readMotorFiles } from "./motor-reference.mjs";

const output = join(root, "dist", "motorAGLLM");
const files = readMotorFiles();
// Le moteur peut demander cette feuille après une sauvegarde avec le thème par défaut.
if (!files.has("res/theme_default.css")) {
  files.set("res/theme_default.css", "/* Les styles du thème par défaut sont chargés par default.css. */\n");
}

for (const [path, content] of files) {
  const destination = join(output, path);
  await mkdir(dirname(destination), { recursive: true });
  // GitHub Pages sert des fichiers statiques sans la politique HTTP du serveur local.
  const body = path === "index.html"
    ? content.toString("utf8").replace("<head>", `<head>\n<meta http-equiv="Content-Security-Policy" content="${motorContentSecurityPolicy}">`)
    : content;
  await writeFile(destination, body);
}
