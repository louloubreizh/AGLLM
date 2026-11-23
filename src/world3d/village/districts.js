const turn = Math.PI * 2;
export const sectors = [-0.32, 1.15, 2.78, 4.36, turn - 0.32];
export const streetRadii = [2.64, 7.36, 11.79];
const sectorOrder = [0, 2, 1, 3];

const districts = {
  center: {
    radius: 5.06, street: 1, footprint: 1.47, slots: [1, 0, 2],
    extra: [{ radius: 3.58, street: 0 }, { radius: 6.52, street: 1 }],
    buildings: ["hut", "tradepost", "logHouse", "barn", "library", "mint", "mansion", "warehouse",
      "academy", "brewery", "chapel", "amphitheatre"],
  },
  outskirts: {
    radius: 9.59, street: 2, footprint: 1.29, slots: [2, 0, 4, 1, 3],
    extra: [{ radius: 8.27, street: 1 }, { radius: 10.94, street: 2 }],
    compactPlots: { zebraForge: 1.12 },
    buildings: ["workshop", "quarry", "smelter", "lumberMill", "mine", "factory", "calciner", "steamworks",
      "magneto", "oilWell", "biolab", "reactor", "aqueduct", "harbor", "accelerator", "aiCore",
      "zebraWorkshop", "zebraForge", "stasisPod", "chronosphere"],
  },
  countryside: {
    radius: 14.28, street: 2, footprint: 1.68,
    angles: [0.70, 3.98, 1.42, -1.43, 0.23, 4.18, 1.92, -0.63],
    outerBends: [0.135, -0.135, 0.135, 0.135, 0.135, 0.135, 0.135, 0.135],
    extra: [{ radius: 12.77, street: 2 }, { radius: 15.63, street: 2 }],
    buildings: ["field", "pasture", "unicornPasture", "observatory", "temple", "ziggurat", "zebraOutpost", "ivoryTemple"],
  },
};

export function landscapePoint(radius, angle) {
  const bend = angle + 0.054 * Math.sin(angle * 3) + 0.105 * Math.min(1, radius / 12) ** 2;
  const irregularity = 1 + 0.073 * Math.sin(angle * 3 - 0.3) + 0.026 * Math.cos(angle * 5 + radius * 0.32);
  const x = radius * irregularity * Math.cos(bend);
  const z = radius * irregularity * Math.sin(bend);
  // The western streets follow the inside of the river bank.
  return { x: x < 0 ? x * (1 - 0.123 * Math.min(1, radius / 11)) : x, z };
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
for (const [zone, district] of Object.entries(districts)) {
  district.buildings.forEach((id, index) => {
    buildingSites.set(id, [district, ...district.extra].map(({ radius, street }, copy) => {
      const angle = angleFor(district, index, copy);
      const sector = sectors.findIndex((boundary) => boundary > angle) - 1;
      const center = landscapePoint(radius, angle);
      const entrance = landscapePoint(streetRadii[street], angle);
      const dx = entrance.x - center.x;
      const dz = entrance.z - center.z;
      const length = Math.hypot(dx, dz);
      const footprint = copy ? 0.61 : district.compactPlots?.[id] ?? district.footprint;
      const setback = footprint / 2 + 0.06;
      return {
        ...center, angle, sector, zone, street, yaw: Math.atan2(dx, dz),
        access: copy ? `access:${id}:${copy + 1}` : `access:${id}`,
        footprint,
        entry: { x: center.x + dx / length * setback, z: center.z + dz / length * setback },
      };
    }));
  });
}
