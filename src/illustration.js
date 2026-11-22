const palettes = {
  foliage: ["#263a2a", "#51804a", "#add679", "#e0efad"],
  timber: ["#3e2925", "#955431", "#d38d50", "#ffe0a0"],
  rock: ["#313c48", "#667482", "#9caaae", "#d8ded3"],
  steel: ["#293e53", "#4c7795", "#a2c5d0", "#e1eff2"],
  gold: ["#543426", "#ac651e", "#e4ad45", "#ffe7a0"],
  water: ["#213c50", "#326c9a", "#69b8c9", "#c5e9e5"],
  fire: ["#522d31", "#b35036", "#ed9156", "#ffe2a0"],
  ivory: ["#514136", "#a98863", "#e2c89f", "#fff0cb"],
  rose: ["#4a2c40", "#a35368", "#e59299", "#fbd3c4"],
  fabric: ["#263941", "#427b75", "#7bb2a4", "#d6e5bf"],
};

const materials = {
  foliage: "brand field pasture leaf play check",
  timber: "hut logHouse barn workshop tradepost journal",
  rock: "quarry",
  steel: "factory magneto settings tools save grip close resize",
  gold: "star energy",
  water: "scienceTab hydroplant observatory center info eye zoomIn zoomOut",
  fire: "smelter",
  ivory: "library amphitheatre village camp cloud",
  rose: "heart",
};

const materialByName = Object.fromEntries(Object.entries(materials).flatMap(([material, names]) =>
  names.split(" ").map((name) => [name, material])
));

const silhouette = {
  field: "M2 19 7 11h10l5 8-10 3z",
  pasture: "m2 19 8-7 12 3-4 7z",
  hut: "M12 3 22 11h-3v10H5V11H2z",
  logHouse: "M12 3 22 11h-3v9H5v-9H2z",
  observatory: "M2 20v-4a10 10 0 0 1 20 0v4z",
  scienceTab: "M4 21v-2h5v-2h6c4 0 6-5 2-8l-2-1-3 6-5-2 5-10 5 2-1 2c8 1 9 11 3 14l2 1z",
  tools: "m3 20 10-10c-1-4 1-6 5-6l-3 4 3 3 4-3c0 5-3 6-7 5L5 23z",
  leaf: "M3 20 6 16C2 10 7 6 21 3c-1 11-5 15-14 14l-3 5z",
  grip: "M7 4h3v3H7zm7 0h3v3h-3zM7 10h3v3H7zm7 0h3v3h-3zM7 16h3v3H7zm7 0h3v3h-3z",
  pause: "M7 4h4v16H7zm6 0h4v16h-4z",
};

const scenes = {
  hut: [
    ["shadow", "M2 20h20l-5 3H7z"],
    ["body", "M5 10h14v11H5z"],
    ["shade", "M15 10h4v11h-4z"],
    ["light", "M2 11 12 3l10 8-3 2-7-6-7 6z"],
    ["detail", "M10 21v-6h4v6m-8-7h3m6 3h3"],
  ],
  field: [
    ["shadow", "M2 20l8-5 12 3-7 5z"],
    ["body", "m2 18 7-7 13 4-6 6z"],
    ["light", "m6 17 5-5 2 1-4 5zm6 2 5-5 2 1-4 5z"],
    ["highlight", "M11 11q-4-1-5-5 4 0 5 4 0-5 5-6-1 5-5 7z"],
    ["detail", "M11 7v6m-6 6 4 1"],
  ],
  pasture: [
    ["shadow", "m1 20 8-5 14 3-6 5z"],
    ["body", "m1 18 9-5 13 4-6 5z"],
    ["light", "m3 17 7-4 8 2-7 5z"],
    ["highlight", "M3 9h2v11H3zm7 0h2v10h-2zm7 0h2v11h-2z M3 11h16v2H3zm0 4h16v2H3z"],
    ["detail", "M4 12h14M4 16h14"],
  ],
  world: [
    ["body", "m12 2 10 6v9l-10 6-10-6V8z"],
    ["shade", "m12 14 10-6v9l-10 6z"],
    ["light", "m2 8 10-6 10 6-10 6z"],
    ["highlight", "m7 8 4-3 5 2-3 2h-3l-1 2z"],
    ["detail", "m4 12 5 3m7 3 4-3"],
  ],
};

export function illustration(name, drawing) {
  if (!drawing) return "";
  const [ink, shade, light, highlight] = palettes[materialByName[name] ?? "fabric"];
  const tones = {
    body: "url(#paint)", shade, light, highlight,
    shadow: "#101b17", detail: "none",
  };
  const surface = silhouette[name] ?? drawing.match(/^[Mm][^MmZz]*[Zz]/)?.[0];
  const layers = scenes[name] ?? (surface ? [["body", surface], ["detail", drawing]] : [["detail", drawing]]);
  const marks = layers.map(([tone, path]) => {
    if (tone === "shadow") return `<path d="${path}" fill="${tones.shadow}" opacity=".26"/>`;
    if (tone === "detail") {
      return surface || scenes[name]
        ? `<path d="${path}" fill="none" stroke="${ink}" stroke-width="1.05"/>`
        : `<path d="${path}" fill="none" stroke="${ink}" stroke-width="3"/><path d="${path}" fill="none" stroke="${light}" stroke-width="1.85"/>`;
    }
    return `<path d="${path}" fill="${tones[tone]}"${tone === "body" ? ` stroke="${ink}" stroke-width=".9"` : ""}/>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><defs><linearGradient id="paint" x2="1" y2="1"><stop stop-color="${highlight}"/><stop offset=".42" stop-color="${light}"/><stop offset="1" stop-color="${shade}"/></linearGradient></defs><g stroke-linecap="round" stroke-linejoin="round">${marks}</g></svg>`;
}
