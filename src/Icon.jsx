import React from "react";
import { resourceIcons } from "./resource-icons.js";
import { buildingIcons } from "./building-icons.js";
import { illustration } from "./illustration.js";

const shapes = {
  brand: "M12 3 21 12 12 21 3 12Z M8 13l3-4 2 3 1-1 2 2",
  save: "M4 3h13l4 4v14H3V3z M7 3v6h9V3 M7 21v-8h10v8",
  settings: "M12 2v4m0 12v4M2 12h4m12 0h4M5 5l3 3m8 8 3 3M19 5l-3 3m-8 8-3 3 M18 12a6 6 0 1 1-12 0 6 6 0 1 1 12 0Z M14 12a2 2 0 1 1-4 0 2 2 0 1 1 4 0Z",
  info: "M22 12a10 10 0 1 1-20 0 10 10 0 1 1 20 0Z M12 11v6m0-10v.1",
  eye: "M2 12c2-4 6-6 10-6s8 2 10 6c-2 4-6 6-10 6s-8-2-10-6z M15 12a3 3 0 1 1-6 0 3 3 0 1 1 6 0z",
  world: "M12 2 21 7v10l-9 5-9-5V7z M3 7l9 5 9-5m-9 5v10",
  camp: "M2 20 12 4l10 16z M8 20l4-7 4 7",
  resources: "M3 7l9-4 9 4v10l-9 4-9-4z M3 7l9 4 9-4m-9 4v10M7 5l9 4",
  journal: "M5 3h14v18H5z M9 3v18m3-13h4m-4 4h4m-4 4h4",
  grip: "M9 5h.1m-.1 7h.1m-.1 7h.1M15 5h.1m-.1 7h.1m-.1 7h.1",
  plus: "M5 12h14m-7-7v14",
  minus: "M5 12h14",
  resize: "M8 3H3v5m0-5 6 6m7 12h5v-5m0 5-6-6",
  zoomIn: "M15.5 9.5a6 6 0 1 1-12 0 6 6 0 1 1 12 0Z M14 14l6 6M7 9.5h5m-2.5-2.5v5",
  zoomOut: "M15.5 9.5a6 6 0 1 1-12 0 6 6 0 1 1 12 0Z M14 14l6 6M7 9.5h5",
  center: "M3 8V3h5m8 0h5v5m0 8v5h-5m-8 0H3v-5m9-7v6m-3-3h6",
  calendar: "M3 5h18v16H3z M7 3v4m10-4v4M3 10h18m-13 5h2m4 0h2",
  play: "M7 4v16l13-8z",
  pause: "M9 5v14m6-14v14",
  heart: "M12 21 4 13C-1 8 6 1 12 7c6-6 13 1 8 6z",
  energy: "m13 2-9 12h7l-1 8 10-12h-7z",
  cloud: "M5 17h14a4 4 0 0 0 0-8h-1A6 6 0 0 0 7 8a4.5 4.5 0 0 0-2 9z",
  check: "m4 12 5 5L20 6",
  leaf: "M4 20c6-7 9-10 16-15M6 17C1 8 11 5 20 4c-1 9-3 16-14 13z",
  village: "M2 10l6-5 6 5m-10 0v10h8V10m0 2 4-4 6 5m-8 0v7h6v-7",
  scienceTab: "M4 21h16M9 20v-2h7c3 0 4-2 4-4a5 5 0 0 0-5-5M7 16h7m-6-4 4-8 4 2-4 8z M12 4l1-2 4 2-1 2",
  tools: "m3 21 10-10m0 0a5 5 0 0 1 5-7l-3 4 3 3 4-3a5 5 0 0 1-7 5l-9 9",
  trade: "M3 8h16m-5-5 5 5-5 5M21 16H5m5-5-5 5 5 5",
  star: "m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z",
  close: "m6 6 12 12M18 6 6 18",
};

export function Icon({ name }) {
  return <img className="agllm-icon" src={iconImage(name)} width="20" height="20"
    alt="" aria-hidden="true" draggable={false} />;
}

function imageCatalog(drawings) {
  return Object.fromEntries(Object.entries(drawings).map(([name, path]) =>
    [name, `data:image/svg+xml,${encodeURIComponent(illustration(name, path))}`]));
}

const interfaceImages = imageCatalog(shapes);
const resourceImages = imageCatalog(resourceIcons);
const buildingImages = imageCatalog(buildingIcons);

function iconImage(name) {
  return interfaceImages[name] ?? resourceImages[name];
}

export function buildingImage(name) {
  return buildingImages[name] ?? interfaceImages.camp;
}
