import { buildingSites, landscapePoint, sectors, streetRadii } from "./districts.js";

const roadTemplates = new Map();
const ringSectors = streetRadii.map(() => []);
const spokes = [];
const junction = (ring, sector) => `ring:${ring}:junction:${sector % 4}`;

function addRoad(id, start, end, width, count, point) {
  const points = [];
  let length = 0;
  for (let i = 0; i <= count; i += 1) {
    const position = point(i / count);
    const previous = points.at(-1);
    if (previous) length += Math.hypot(position.x - previous.x, position.z - previous.z);
    points.push({ ...position, distance: length });
  }
  roadTemplates.set(id, { id, start, end, width, points, length });
  return id;
}

for (const [ring, radius] of streetRadii.entries()) {
  for (let sector = 0; sector < 4; sector += 1) {
    const first = sectors[sector];
    const last = sectors[sector + 1];
    const stops = [...new Set([...buildingSites.values()].flat()
      .filter((site) => site.street === ring && site.sector === sector).map((site) => site.angle))].sort((a, b) => a - b);
    const joins = [first, ...stops, last];
    const nodes = [junction(ring, sector), ...stops.map((angle) => `ring:${ring}:lot:${angle}`), junction(ring, sector + 1)];
    ringSectors[ring][sector] = joins.slice(1).map((angle, index) => {
      const from = joins[index];
      // Sample the bends independently of which buildings occupy this sector.
      return addRoad(`ring:${ring}:${sector}:${index}`, nodes[index], nodes[index + 1],
        ring === 0 ? 0.68 : ring === 1 ? 0.58 : 0.51,
        Math.max(3, Math.ceil((angle - from) * radius * 5)),
        (t) => landscapePoint(radius, from + t * (angle - from)));
    });
  }
}

for (let ring = 1; ring < streetRadii.length; ring += 1) {
  spokes[ring] = sectors.slice(0, 4).map((angle, sector) => addRoad(
    `spoke:${ring}:${sector}`, junction(ring - 1, sector), junction(ring, sector), ring === 1 ? 0.59 : 0.49, 24,
    (t) => {
      const bend = Math.sin(t * Math.PI) * (ring === 1 ? 0.042 : 0.024) * (sector % 2 === ring % 2 ? 1 : -1);
      return landscapePoint(streetRadii[ring - 1] + t * (streetRadii[ring] - streetRadii[ring - 1]), angle + bend);
    },
  ));
}

const squareAccess = addRoad("square", junction(0, 0), "square", 0.64, 12,
  (t) => landscapePoint(streetRadii[0] - (streetRadii[0] - 1.60) * t, sectors[0] - 0.13 * Math.sin(t * Math.PI)));

for (const site of [...buildingSites.values()].flat()) {
  const from = landscapePoint(streetRadii[site.street], site.angle);
  const to = site.entry;
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  addRoad(site.access, `ring:${site.street}:lot:${site.angle}`, site.access + ":end",
    site.zone === "countryside" ? 0.37 : 0.33, Math.max(8, Math.ceil(Math.hypot(dx, dz) * 7)),
    (t) => {
      const bend = Math.sin(t * Math.PI) * 0.13;
      return { x: from.x + dx * t - dz * bend, z: from.z + dz * t + dx * bend };
    });
}

export function roadsForPlots(plots) {
  const active = new Set([squareAccess, ...ringSectors[0].flat()]);

  function openSector(ring, sector) {
    for (const road of ringSectors[ring][sector]) active.add(road);
    for (let level = 1; level <= ring; level += 1) {
      active.add(spokes[level][sector]);
      active.add(spokes[level][(sector + 1) % 4]);
    }
  }

  let models = 0;
  let outerDistrict = false;
  for (const plot of plots) {
    models += plot.models;
    for (const site of plot.sites) {
      outerDistrict ||= site.street === 2;
      openSector(site.street, site.sector);
      active.add(site.access);
    }
  }
  if (models >= 9) for (let sector = 0; sector < 4; sector += 1) openSector(1, sector);
  if (models >= 24 && outerDistrict) for (let sector = 0; sector < 4; sector += 1) openSector(2, sector);

  const roads = new Map();
  const junctions = new Map();
  for (const id of [...active].sort()) {
    const road = roadTemplates.get(id);
    roads.set(id, road);
    for (const node of [road.start, road.end]) {
      if (!junctions.has(node)) junctions.set(node, []);
      junctions.get(node).push(road);
    }
  }
  return { key: [...roads.keys()].join("|"), roads, junctions };
}

export function roadSample(road, distance) {
  const { points } = road;
  let low = 0;
  let high = points.length - 1;
  while (high - low > 1) {
    const midpoint = (low + high) >> 1;
    if (points[midpoint].distance < distance) low = midpoint;
    else high = midpoint;
  }
  const from = points[low], to = points[high];
  const t = Math.max(0, Math.min(1, (distance - from.distance) / (to.distance - from.distance)));
  return { x: from.x + t * (to.x - from.x), z: from.z + t * (to.z - from.z), yaw: Math.atan2(to.x - from.x, to.z - from.z) };
}

export function projectOntoRoad(x, z, road) {
  let distanceSquared = Infinity;
  let along = 0;
  for (let i = 1; i < road.points.length; i += 1) {
    const from = road.points[i - 1], to = road.points[i];
    const dx = to.x - from.x, dz = to.z - from.z;
    const t = Math.max(0, Math.min(1, ((x - from.x) * dx + (z - from.z) * dz) / (dx * dx + dz * dz)));
    const candidate = (x - from.x - dx * t) ** 2 + (z - from.z - dz * t) ** 2;
    if (candidate < distanceSquared) {
      distanceSquared = candidate;
      along = from.distance + (to.distance - from.distance) * t;
    }
  }
  return { distanceSquared, along };
}

export const distanceToRoadSquared = (x, z, road) => projectOntoRoad(x, z, road).distanceSquared;
