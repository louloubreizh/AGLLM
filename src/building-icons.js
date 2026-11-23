export const buildingIcons = {
  // Two color fields and a line layer keep each silhouette readable at card size.
  field: ["#77bc58", "#cce688", "m2 17 7-8 13 4-6 9z", "M12 13Q5 12 5 5q5 0 7 4 1-6 7-7 0 7-7 11z", "m5 18 4-5m1 7 4-5m1 6 4-5m-7-4V8"],
  pasture: ["#a5cc69", "#f1cc87", "m2 17 7-7 13 4-6 8z", "M3 6h2v13H3zm8 1h2v13h-2zm8-2h2v13h-2z M5 9l14-1v3L5 12zm0 5 14-1v3L5 17z", ""],
  solarfarm: ["#76c6ef", "#ffda72", "m4 8 15-1 3 10-20 1zm5 10h5v3h5v2H5v-2h4z", "M17 1a3 3 0 1 1 0 6 3 3 0 0 1 0-6z", "m5 13 15-1m-11-4-2 9m7-9 1 9"],
  aqueduct: ["#cbbda2", "#79d7ed", "M2 4h20v5h-2v12h-4V15a4 4 0 0 0-8 0v6H4V9H2z", "M3 5h18v2H3z", "M4 10h3m10 0h3M4 18h3m10 0h3"],
  hydroplant: ["#83a9bf", "#5dd8e9", "M3 13 7 4h11l3 9v6H3z", "M2 17q3-3 6 0t6 0t8 0v4q-4 2-7 0t-7 0t-6 0z", "M10 7h5l-3 3h4l-4 4"],
  hut: ["#dd9e64", "#d47b57", "M5 9h14v12H5z", "m2 11 3-5 7-3 7 3 3 5-3 2-7-4-7 4z", "M10 21v-6h4v6M7 15h.1m10 0h.1"],
  logHouse: ["#c08a58", "#a7cf80", "M3 10h18v12H3z", "M2 12 10 3h4l8 9h-4l-6-6-6 6z", "M4 14h16M4 18h16m-11 4v-8h6v8"],
  mansion: ["#ebc9ae", "#c782a2", "M2 11h5V8h10v3h5v10H2z", "m6 9 6-6 6 6zm-4 4 3-4 3 4zm14 0 3-4 3 4z", "M10 21v-6h4v6m-9-6v2m14-2v2m-7-8v2"],
  library: ["#c99a77", "#8ed2b5", "M2 5h20v16H2z", "M12 10c-3-3-5-3-7-2v8c2-1 5-1 7 2 2-3 5-3 7-2V8c-2-1-4-1-7 2z", "M12 10v8M7 11l2 1m6 0 2-1"],
  dataCenter: ["#7b9db7", "#64e9d2", "M4 2h16v20H4z", "M6 5h12v4H6zm0 5h12v4H6zm0 5h12v4H6z", "M8 7h.1m-.1 5h.1m-.1 5h.1m4-10h4m-4 5h4m-4 5h4"],
  academy: ["#849cd6", "#edd291", "M6 10h12v7q-6 5-12 0z", "m1 8 11-5 11 5-11 6z", "M20 10v8m-6-10 5 2"],
  observatory: ["#b5a9df", "#80d5e6", "M3 19v-4a9 9 0 0 1 18 0v4l-3 2H6z", "m10 10 7-8 4 3-8 7z", "M3 17h18m-9-5v5M6 20h12"],
  biolab: ["#74baca", "#a4e78a", "M5 4h14v3h-2v10h2v3H5v-3h2V7H5z", "M8 11h8v5H8z", "m10 8 4 7m-4 0 4-7"],
  barn: ["#da8270", "#f1d09a", "M3 10 8 4h8l5 6v11H3z", "M7 13h10v8H7z M8 8h8v3H8z", "m7 13 10 8m-10 0 10-8"],
  warehouse: ["#a8a998", "#72bed6", "M2 8 12 4 22 8v13H2z", "M6 11h12v10H6z", "M7 14h10m-10 3h10"],
  spaceport: ["#879dd9", "#ffb878", "M3 18h18v3H3zm3-2 3-5v6H6zm12 0-3-5v6h3z", "M12 2q5 4 3 12l-3 4-3-4q-2-8 3-12z", "M12 7h.1m0 5v3"],
  harbor: ["#d4aa74", "#74d8e6", "M3 4h3v9h12V8h3v13H3z", "M2 15q2-2 5 0t5 0t5 0t5 0v6H2z", "M8 13V6h8m-2 0v4M3 18q2-1 4 0t5 0t5 0t4 0"],
  mine: ["#8c9cae", "#deb27c", "M2 20 4 10l7-7 6 3 5 14z", "m6 20 1-6 5-5 5 5 1 6z", "m10 18 5-5m-6 1q4-2 6 0"],
  quarry: ["#aeb9bd", "#9acbdb", "m2 4 7 2v4h5v4h5v4h3v3H2z", "m3 6 5 2v3l5 1v3l5 1v3H3z", "M4 11h4m-4 5h9m-5 1v3"],
  smelter: ["#bd8b78", "#ffab63", "M5 9h3V3h4v5h5l3 5v8H4v-8z", "M12 11q2 4 4 5a4 4 0 1 1-8 1q0-2 4-6z", "M6 10h10M7 21h10"],
  calciner: ["#aa8ba0", "#f5b36c", "M3 10h4V4h3v6h4V4h3v6h4v10H3z", "M5 13h14v4H5z", "M9 14v2m3-2v2m3-2v2"],
  steamworks: ["#93a9b0", "#80d8e1", "M3 12h4V7h4v5h9l2 3v6H3z", "M8 6C3 4 6 2 8 3q2-3 4 0t-4 3zM14 14a3 3 0 1 0 0 6 3 3 0 1 0 0-6z", "M5 18h4m5-2v2"],
  magneto: ["#da8690", "#87c7e9", "M3 4h5v9a4 4 0 0 0 8 0V4h5v9a9 9 0 1 1-18 0z", "M3 4h5v5H3zm13 0h5v5h-5z", "m10 19 2 1 2-1"],
  lumberMill: ["#bb946a", "#a9c3cc", "m2 10 10-7 10 7-3 2v9H5v-9z", "M12 10l2 2 3-1 1 3 2 1-2 2-1 3-3-1-2 2-2-2-3 1-1-3-2-2 2-1 1-3 3 1z", "M12 15v.1"],
  oilWell: ["#a599cd", "#f1b370", "M3 20h18v2H3zm2 0L11 3h2l6 17h-3l-4-12-4 12z", "M11 2h4l-1 4h-4z M7 14h10v2H7z", "m9 17 6 3m-6 0 6-3"],
  workshop: ["#d49869", "#a1d9c9", "m2 11 10-7 10 7-3 2v8H5v-8z", "m7 17 6-6q-1-3 3-3l-1 3 2 2 3-1q0 4-4 3l-6 6z", ""],
  factory: ["#849eae", "#f1ae71", "M2 12l6 3v-4l6 3V9h3V3h3l2 18H2z", "M4 17h16v2H4z", "M8 17v2m4-2v2m4-2v2"],
  reactor: ["#9bb9a6", "#d4e875", "M5 3h14q-3 9 2 18H3q5-9 2-18z", "M12 8a5 5 0 1 1 0 10 5 5 0 0 1 0-10z", "M12 13h.1m0-1 2-2m-2 3 3 1m-3-1-2 2"],
  accelerator: ["#928bd2", "#86e7ed", "M12 2 22 8v8l-10 6-10-6V8z", "m12 5 6 4v6l-6 4-6-4V9z", "M8 12h8m-3-3 3 3-3 3"],
  tradepost: ["#e0af78", "#d97c82", "M4 8h16v13H4z", "M4 5h16l3 6q-2 3-5 0-3 3-6 0-3 3-6 0-3 3-5 0z", "M7 20v-5h10v5M8 6l-1 4m5-4v4m4-4 1 4"],
  mint: ["#b6ac92", "#ffd281", "m2 11 10-7 10 7v10H2z", "M12 10a5 5 0 1 0 0 10 5 5 0 0 0 0-10z", "m12 12 2 3-2 3-2-3z"],
  brewery: ["#be946f", "#f2cf8a", "M4 8h13l-1 13H5z M17 10h3l2 2v4l-2 2h-4v-3h3v-2h-2z", "M4 9c-3-2 0-6 3-5 1-3 5-2 6 0 4-1 6 2 4 5z", "M8 12v6m4-6v6"],
  amphitheatre: ["#b9a2c8", "#e7bda4", "M2 18c0-7 5-12 10-12s10 5 10 12l-3 3H5z", "M4 18c1-5 4-8 8-8s7 3 8 8l-3 1H7z", "M7 17q5-9 10 0m-8 2 3-4 3 4"],
  broadcasttower: ["#90a0c0", "#e6a3dd", "m4 21 7-14h2l7 14z", "M12 2a3 3 0 1 1 0 6 3 3 0 1 1 0-6z", "m8 14 8 4m-8 0 8-4M5 3v5m14-5v5"],
  chapel: ["#d2b5b6", "#ae8ac7", "M5 12l7-5 7 5v9H5z", "M11 2h2v2h2v2h-2v4h-2V6H9V4h2z M3 12l9-6 9 6-2 2-7-5-7 5z", "M10 21v-5q2-3 4 0v5"],
  temple: ["#e2cda5", "#81cfc4", "m2 8 10-5 10 5v2H2zm2 3h3v7h3v-7h4v7h3v-7h3v8h2v3H2v-3h2z", "M5 8l7-3 7 3z M3 19h18v2H3z", ""],
  unicornPasture: ["#91bd80", "#f0bbef", "M2 12h2v3h16v-3h2v9h-2v-3H4v3H2z", "m6 17 2-7 4-2 5-5-1 6 4 4-3 3-4-2-2 4z", "M15 11h.1"],
  ziggurat: ["#b49974", "#edd18a", "M2 21v-4h4v-4h3V9h2V4h2v5h2v4h3v4h4v4z", "M3 18h18v2H3z M7 14h10v2H7z M10 10h4v2h-4z", "M11 21v-4h2v4"],
  chronosphere: ["#a696d2", "#77d7db", "m6 4 6-2 6 2 4 8-4 7-6 3-6-3-4-7z", "M12 5a7 7 0 1 1 0 14 7 7 0 0 1 0-14z", "M9 8h6l-3 4 3 4H9l3-4z"],
  aiCore: ["#7bb498", "#98efd9", "M5 6h4V3h2v3h2V3h2v3h4v4h3v2h-3v3h3v2h-3v4H5v-4H2v-2h3v-3H2v-2h3z", "M8 9h8v8H8z", "M10 12h.1m4 0h.1m-4 3h4"],
  zebraOutpost: ["#b9bcc9", "#f3d294", "M4 7h10v14H4z M16 5h2v16h-2z", "m3 7 3-3h7l3 3zM18 5l4 2-4 3z", "M6 10h6m-6 4h6m-6 4h6"],
  zebraWorkshop: ["#a2adbb", "#d29479", "m2 11 10-6 10 6-3 1v9H5v-9z", "m7 12 2-2 3 3 4-3 2 2-4 3 4 3-2 2-4-3-4 3-2-2 4-3z", "M7 21h10"],
  zebraForge: ["#9aa7b5", "#f1aa71", "M2 8h14l6-3-2 6-6 4v3h4v3H6v-3h4v-3l-5-3z", "M4 9h12l4-2-1 3-5 2H7z", "M8 20h8"],
  stasisPod: ["#87b2d3", "#9df1cc", "M6 3h12l3 5v10l-4 4H7l-4-4V8z", "M9 6h6l3 4v6l-3 3H9l-3-3v-6z", "M12 9v7m-3-5 6 3m0-3-6 3"],
  ivoryTemple: ["#ecdbc5", "#9ca3d3", "m2 10 10-7 10 7h-3v9h3v3H2v-3h3v-9z", "M7 11h10v8H7z", "M9 17q5-1 6-6 2 6-5 7"],
};

const svgImage = (art) => `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g stroke-linecap="round" stroke-linejoin="round">${art}</g></svg>`
)}`;

export function buildingIllustration([base, accent, silhouette, decoration, detail]) {
  const outline = 'stroke="#23313a" stroke-width=".8"';
  return svgImage(`<path d="${silhouette}" fill="${base}" ${outline}/><path d="${decoration}" fill="${accent}" ${outline}/><path d="${detail}" fill="none" stroke="#263641" stroke-width="1.15"/>`);
}

export const campToolIcons = Object.fromEntries(Object.entries({
  eye: ["#9ed8ec", "M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6zM15 12a3 3 0 1 0-6 0 3 3 0 0 0 6 0z"],
  info: ["#c4b4f0", "M12 9v.1M12 12v4M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"],
  minus: ["#f3ae9e", "M6 12h12"],
  plus: ["#a7d98c", "M5 12h14m-7-7v14"],
  power: ["#f7d483", "M12 3v9m5-6a8 8 0 1 1-10 0"],
  automation: ["#a3d7cb", "M6 8a7 7 0 0 1 12 1m-4 0h4V5M6 15a7 7 0 0 0 12 1M6 19v-4h4"],
  sell: ["#e5bf77", "M3 7h12l6 5-6 5H3zM7 12h.1"],
  upgrade: ["#a9de9b", "m5 14 7-7 7 7m-13-6 6-5 6 5"],
  downgrade: ["#efaa8d", "m5 10 7 7 7-7m-13 6 6 5 6-5"],
}).map(([name, [color, path]]) => [name, svgImage(`<path d="${path}" fill="none" stroke="${color}" stroke-width="2.2"/>`)]));
