const pictures = import.meta.glob("../assets/sections/*.jpg", { eager: true, import: "default", query: "?url" });

const icons = import.meta.glob("../assets/tab-icons/*.svg", { eager: true, import: "default", query: "?url" });

function byName(files) {
  return Object.fromEntries(Object.entries(files).map(([path, url]) => [path.split("/").at(-1).slice(0, -4), url]));
}

export const tabArt = byName(pictures);
export const tabIcons = byName(icons);
