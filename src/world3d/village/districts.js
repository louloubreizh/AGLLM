import { smoothstep } from "../models/landscape/noise.js";
import { edgeRatio, riverWidth, riverX } from "../models/landscape/terrain-profile.js";

const turn = Math.PI * 2;
export const sectors = [-0.32, 1.15, 2.78, 4.36, turn - 0.32];
export const streetRadii = [3.15, 9.1, 12.15, 17.5];
export const smallFootprint = 1.62;
const sectorOrder = [0, 2, 1, 3];

const districts = {
  center: {
    radius: 5.35, street: 1, slots: [1, 0, 3, 2],
    extra: [{ radius: 4.38, street: 0 }, { radius: 7.05, street: 1 }],
    buildings: ["hut", "tradepost", "logHouse", "barn", "library", "mint", "mansion", "warehouse",
      "academy", "brewery", "chapel", "amphitheatre", "workshop", "biolab"],
  },
  outskirts: {
    radius: 9.95, street: 2, slots: [2, 0, 4, 1, 3],
    extra: [{ radius: 9.15, street: 1 }, { radius: 11.05, street: 2 }],
    buildings: [null, "quarry", "smelter", "lumberMill", "mine", "factory", "calciner", "steamworks",
      "magneto", "oilWell", null, "reactor", "aqueduct", "harbor", "accelerator", "aiCore",
      "zebraWorkshop", "zebraForge", "stasisPod", "chronosphere"],
  },
  countryside: {
    radius: 14.3, street: 2,
    angles: [0.70, 3.98, 1.42, -1.43, 0.23, 4.18, 1.92, -0.63],
    outerBends: [0.135, -0.135, 0.135, 0.135, 0.135, 0.135, 0.135, 0.135],
    extra: [{ radius: 13.4, street: 2 }, { radius: 15.25, street: 2 }],
    buildings: ["field", "pasture", "unicornPasture", "observatory", null, null, "zebraOutpost"],
  },
};

export function landscapePoint(radius, angle) {
  const bend = angle + 0.054 * Math.sin(angle * 3) + 0.105 * Math.min(1, radius / 12) ** 2;
  const irregularity = 1 + 0.073 * Math.sin(angle * 3 - 0.3) + 0.026 * Math.cos(angle * 5 + radius * 0.32);
  let x = radius * irregularity * Math.cos(bend);
  const z = radius * irregularity * Math.sin(bend);
  // The western streets follow the inside of the river bank.
  if (x < 0) {
    x *= 1 - 0.123 * Math.min(1, radius / 11);
    x += Math.max(0, riverX(z) + riverWidth(z) + 0.67 - x) * (1 - smoothstep(9.2, 11.9, Math.abs(z)));
  }
  return { x, z };
}

export function streetPoint(street, angle) {
  const radius = streetRadii[street];
  if (street < 3) return landscapePoint(radius, angle);
  const distance = radius * edgeRatio(angle);
  const x = distance * Math.cos(angle);
  const z = distance * Math.sin(angle);
  const bankShift = x < -11 ? Math.min(0, riverX(z) - riverWidth(z) - 0.70 - x) : 0;
  return { x: x + bankShift * (1 - smoothstep(9.2, 11.9, Math.abs(z))), z };
}

function angleFor(district, index, copy) {
  if (district.angles) {
    const site = (index + [0, 2, 3][copy]) % district.angles.length;
    const angle = district.angles[site] + [0, -0.055, district.outerBends[site]][copy];
    return angle < sectors[0] ? angle + turn : angle;
  }
  const sector = (sectorOrder[index % 4] + [0, 2, 1][copy]) % 4;
  const slot = district.slots[Math.floor(index / 4)];
  const last = district.slots.length - 1;
  const shift = district.slots.length === 3 && copy === 1 ? 0.22 : 0.32;
  const stagger = copy === 1 ? (slot === last ? -shift : shift) : copy === 2 ? (slot === 0 ? shift : -shift) : 0;
  const position = (slot + 0.65 + stagger) / (district.slots.length + 0.30);
  return sectors[sector] + position * (sectors[sector + 1] - sectors[sector]);
}

export const buildingSites = new Map();

function streetSite(id, copy, zone, radius, street, angle) {
  const sector = sectors.findIndex((boundary) => boundary > angle) - 1;
  const center = landscapePoint(radius, angle);
  const entrance = landscapePoint(streetRadii[street], angle);
  const dx = entrance.x - center.x;
  const dz = entrance.z - center.z;
  const setback = (smallFootprint * 0.27) / Math.hypot(dx, dz);
  return {
    ...center, angle, sector, zone, street, yaw: Math.atan2(dx, dz),
    access: copy ? `access:${id}:${copy + 1}` : `access:${id}`,
    footprint: smallFootprint,
    entry: { x: center.x + dx * setback, z: center.z + dz * setback },
  };
}

for (const [zone, district] of Object.entries(districts)) {
  district.buildings.forEach((id, index) => {
    if (!id) return;
    buildingSites.set(id, [district, ...district.extra].map(({ radius, street }, copy) =>
      streetSite(id, copy, zone, radius, street, angleFor(district, index, copy))));
  });
}

for (const [id, angles] of [
  ["temple", [1.47, 3.42, 0.24]],
  ["ziggurat", [2.12, 4.72, 0.84]],
  ["ivoryTemple", [2.72, 4.07, 5.37]],
]) {
  buildingSites.set(id, angles.map((angle, copy) => streetSite(id, copy, "center", 2.39, 0, angle)));
}
