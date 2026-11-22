const palettes = {
  foliage: ["#263a2a", "#51804a", "#add679", "#e0efad"],
  timber: ["#3e2925", "#955431", "#d38d50", "#ffe0a0"],
  rock: ["#313c48", "#667482", "#9caaae", "#d8ded3"],
  coal: ["#26303b", "#404c60", "#77859a", "#aeb8c8"],
  steel: ["#293e53", "#4c7795", "#a2c5d0", "#e1eff2"],
  gold: ["#543426", "#ac651e", "#e4ad45", "#ffe7a0"],
  water: ["#213c50", "#326c9a", "#69b8c9", "#c5e9e5"],
  glass: ["#263851", "#545890", "#9c9ad5", "#ded3f6"],
  fire: ["#522d31", "#b35036", "#ed9156", "#ffe2a0"],
  ivory: ["#514136", "#a98863", "#e2c89f", "#fff0cb"],
  rose: ["#4a2c40", "#a35368", "#e59299", "#fbd3c4"],
  fabric: ["#263941", "#427b75", "#7bb2a4", "#d6e5bf"],
};

const materials = {
  foliage: "brand catnip field pasture leaf unicornPasture play check",
  timber: "wood beam scaffold hut logHouse barn lumberMill workshop tradepost brewery journal parchment manuscript compedium",
  rock: "minerals slab concrate megalith quarry aqueduct warehouse temple ziggurat ivoryTemple",
  coal: "coal oil blackcoin mine necrocorn necrocornDeficit void",
  steel: "iron titanium steel plate alloy gear eludium factory calciner steamworks magneto accelerator tanker settings tools save grip close resize",
  gold: "gold faith karma paragon relic mint chapel academy sun star worship clock energy",
  water: "science scienceTab tears temporalFlux oilWell hydroplant solarfarm observatory blueprint center info eye zoomIn zoomOut",
  glass: "unobtainium antimatter starchart gflops hashrates timeCrystal sorrow tMythril dataCenter biolab chronosphere aiCore stasisPod spaceport broadcasttower",
  fire: "uranium burnedParagon bloodstone smelter reactor zebraForge fire spice kerosene",
  ivory: "ivory kittens furs zebras unicorns alicorn mansion library culture amphitheatre account village camp cloud",
  rose: "heart elderBox wrappingPaper thorium epiphany",
  fabric: "manpower ship harbor plastic microchip zebraOutpost zebraWorkshop trade resources world calendar pause chart queue plus minus",
};

const materialByName = Object.fromEntries(Object.entries(materials).flatMap(([material, names]) =>
  names.split(" ").map((name) => [name, material])
));

const silhouette = {
  field: "M2 19 7 11h10l5 8-10 3z",
  pasture: "m2 19 8-7 12 3-4 7z",
  hut: "M12 3 22 11h-3v10H5V11H2z",
  logHouse: "M12 3 22 11h-3v9H5v-9H2z",
  mansion: "M12 3 23 11h-3v10H4V11H1z",
  harbor: "m2 17 8-5 12 4-5 6z",
  mine: "M2 20 5 11l7-7 7 7 3 9z",
  lumberMill: "M12 3 22 11h-3v10H5V11H2z",
  steamworks: "M4 20V10h11V5h5v15z",
  oilWell: "M3 21 12 3l9 18z",
  mint: "M12 4 22 11h-3v9H5v-9H2z",
  observatory: "M2 20v-4a10 10 0 0 1 20 0v4z",
  academy: "M1 9 12 3l11 6-5 4v4q-6 5-12 0v-4z",
  scienceTab: "M4 21v-2h5v-2h6c4 0 6-5 2-8l-2-1-3 6-5-2 5-10 5 2-1 2c8 1 9 11 3 14l2 1z",
  biolab: "M4 6h16v13H4z",
  spaceport: "m2 21 5-7 5-12 5 12 5 7z",
  broadcasttower: "m6 21 6-14 6 14z",
  temple: "M2 10 12 4l10 6h-3v11H5V10z",
  ivoryTemple: "M2 21V10l10-7 10 7v11z",
  zebraOutpost: "M3 21V6h10V3l8 3-8 3v12z",
  catnip: "M5 18C2 13 3 7 5 6l6 6C10 7 14 3 20 2c2 7-4 11-8 11 4-2 7-2 9 0-2 6-8 8-12 5l-4 4z",
  tools: "m3 20 10-10c-1-4 1-6 5-6l-3 4 3 3 4-3c0 5-3 6-7 5L5 23z",
  leaf: "M3 20 6 16C2 10 7 6 21 3c-1 11-5 15-14 14l-3 5z",
  grip: "M7 4h3v3H7zm7 0h3v3h-3zM7 10h3v3H7zm7 0h3v3h-3zM7 16h3v3H7zm7 0h3v3h-3z",
  pause: "M7 4h4v16H7zm6 0h4v16h-4z",
  account: "M4 22v-2c0-4 2-6 5-7-6-4-3-11 3-11s9 7 3 11c3 1 5 3 5 7v2z",
};

const scenes = {
  wood: [
    ["shadow", "M3 20q8-3 18-1l-5 3H4z"],
    ["body", "M4 13 13 4q4-3 8 1 3 3 0 7l-9 9z"],
    ["shade", "M10 15 20 5q3 4 1 7l-9 9z"],
    ["light", "M5 13 15 4q3-1 4 1l-9 9z"],
    ["highlight", "M13 17a5 4.5 40 1 1-10 .1 5 4.5 40 1 1 10-.1z"],
    ["detail", "M9 16a2 2 0 1 1-3 2 2 2 0 0 1 3-2zm5-2 6-6m-6 1 4-4"],
  ],
  catnip: [
    ["shadow", "M3 21q6-2 13 0l-6 1z"],
    ["body", "M11 11Q10 4 20 2q2 8-9 9z M9 17Q2 16 4 6q7 2 6 9z M12 16q3-6 10-4-1 7-11 7z"],
    ["light", "M12 9q1-6 8-7-1 4-8 7z M5 7q5 1 4 7-4-3-4-7zm9 10q3-5 8-5-2 4-8 5z"],
    ["detail", "M5 22q3-9 12-17M9 15l-3-5m4 9 8-5"],
  ],
  minerals: [
    ["shadow", "M2 20q8-2 20-1l-5 3H6z"],
    ["body", "m2 17 4-8 8-5 6 4 2 10-7 3z"],
    ["shade", "m8 13 6 1 1 7-13-4z m6 1 6-6 2 10-7 3z"],
    ["light", "m6 9 8-5 6 4-6 6z"],
    ["highlight", "m10 8 4-2 3 2-3 3z"],
    ["detail", "m5 14 4 2m6 2 3-2"],
  ],
  gold: [
    ["shadow", "M2 19h20l-4 3H7z"],
    ["body", "M3 12l4-6h10l4 6v6H3z"],
    ["shade", "M3 12h18v6H3z"],
    ["light", "m3 12 4-6h10l4 6z"],
    ["highlight", "m8 8 7-1 1 2H7z"],
    ["detail", "m9 15 2 1 4-1"],
  ],
  science: [
    ["shadow", "M3 21q9-2 18 0l-3 2H6z"],
    ["highlight", "M8 3h8l-2 2v5l5 8q1 3-2 3H7q-3 0-2-3l5-8V5z"],
    ["body", "M8 14q4-2 8 0l3 5-2 2H7l-2-2z"],
    ["light", "M8 14q4-2 8 0l1 2q-5-1-10 0z"],
    ["detail", "M8 3h8m-5 6v3m5 6h.1m-6 0h.1"],
  ],
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
  ship: [
    ["shadow", "M3 20h18l-4 3H6z"],
    ["body", "M2 15h20l-4 6H7z"],
    ["shade", "M5 18h14l-1 3H7z"],
    ["highlight", "M3 14l7-9v9zm10-9 7 9h-7z"],
    ["detail", "M11.5 3v12M7 17h10"],
  ],
  brewery: [
    ["shadow", "M2 20h20l-4 3H6z"],
    ["highlight", "M14 9h4c6 0 6 9 0 9h-4v-2h4c3 0 3-5 0-5h-4z"],
    ["body", "M3 7h13v12q-6 4-13 0z"],
    ["light", "M5 9h3v11l-3-1z"],
    ["highlight", "M2 7q1-3 4-2 2-3 5-1 4-1 6 3v2H2z"],
    ["detail", "M10 12v5m3-5v5"],
  ],
  paragon: [
    ["body", "M4 2h5l5 9-4 2zm11 0h5l-6 11-4-2z"],
    ["shade", "m15 2 2 2-6 8-2-1z"],
    ["highlight", "M19 16a7 7 0 1 1-14 0 7 7 0 1 1 14 0z"],
    ["body", "M17 16a5 5 0 1 1-10 0 5 5 0 1 1 10 0z"],
    ["detail", "m10 16 1 1 3-3"],
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
