import { buildingSites, landscapePoint, sectors, streetPoint, streetRadii } from "./districts.js";

const roadTemplates = new Map();
const ringSectors = streetRadii.map(() => []);
const spokes = [];
const junction = (ring, sector) => `ring:${ring}:junction:${sector % 4}`;
const avenue = { width: 0.58, lanes: 4 };
const street = { width: 0.46, lanes: 2 };
const path = { width: 0.36, lanes: 2 };
const alley = { width: 0.28, lanes: 2 };

function makeRoad(id, start, end, profile, positions, source = id, offset = 0) {
  let length = 0;
  const points = positions.map((position, index) => {
    const previous = positions[index - 1];
    if (previous) length += Math.hypot(position.x - previous.x, position.z - previous.z);
    return { x: position.x, z: position.z, distance: length };
  });
  return { id, start, end, width: profile.width, lanes: profile.lanes, points, length, offset,
    route: profile.route ?? source, routeDistance: (profile.routeDistance ?? 0) + offset, routeLength: profile.routeLength,
    minX: Math.min(...points.map(({ x }) => x)), maxX: Math.max(...points.map(({ x }) => x)),
    minZ: Math.min(...points.map(({ z }) => z)), maxZ: Math.max(...points.map(({ z }) => z)),
  };
}

function addRoad(id, start, end, profile, count, point) {
  const points = Array.from({ length: count + 1 }, (_, index) => point(index / count));
  roadTemplates.set(id, makeRoad(id, start, end, profile, points));
  return id;
}

for (const [ring, radius] of streetRadii.entries()) {
  let routeDistance = 0;
  const route = `ring:${ring}`;
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
      const id = addRoad(`ring:${ring}:${sector}:${index}`, nodes[index], nodes[index + 1],
        { ...[avenue, street, street, path, path][ring], route, routeDistance },
        Math.max(3, Math.ceil((angle - from) * radius * 5)),
        (t) => streetPoint(ring, from + t * (angle - from)));
      routeDistance += roadTemplates.get(id).length;
      return id;
    });
  }
  for (const id of ringSectors[ring].flat()) roadTemplates.get(id).routeLength = routeDistance;
}

for (let ring = 1; ring < streetRadii.length; ring += 1) {
  spokes[ring] = sectors.slice(0, 4).map((angle, sector) => {
    // The western approach to the countryside crosses the river. Reach it by the ring on either side.
    if (ring === 3 && sector === 2) return null;
    const start = streetPoint(ring - 1, angle);
    const end = streetPoint(ring, angle);
    return addRoad(`spoke:${ring}:${sector}`, junction(ring - 1, sector), junction(ring, sector),
      [null, avenue, street, path, path][ring], 36, (t) => {
        if (ring < 3) {
          const bend = Math.sin(t * Math.PI) * (ring === 1 ? 0.042 : 0.024) * (sector % 2 === ring % 2 ? 1 : -1);
          return landscapePoint(streetRadii[ring - 1] + t * (streetRadii[ring] - streetRadii[ring - 1]), angle + bend);
        }
        const bend = Math.sin(t * Math.PI) * 0.22 * (sector % 2 ? 1 : -1);
        const dx = end.x - start.x;
        const dz = end.z - start.z;
        const length = Math.hypot(dx, dz);
        return { x: start.x + dx * t - dz / length * bend, z: start.z + dz * t + dx / length * bend };
      });
  });
}

const squareAccess = addRoad("square", junction(0, 0), "square", street, 12,
  (t) => landscapePoint(streetRadii[0] - (streetRadii[0] - 1.60) * t, sectors[0] - 0.13 * Math.sin(t * Math.PI)));

for (const site of [...buildingSites.values()].flat()) {
  const from = landscapePoint(streetRadii[site.street], site.angle);
  const to = site.entry;
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  addRoad(site.access, `ring:${site.street}:lot:${site.angle}`, site.access + ":end",
    alley, Math.max(8, Math.ceil(Math.hypot(dx, dz) * 7)),
    (t) => {
      const bend = Math.sin(t * Math.PI) * 0.13;
      return { x: from.x + dx * t - dz * bend, z: from.z + dz * t + dx * bend };
    });
}

export const frontageRoads = [...roadTemplates.values()].filter(({ id }) => id.startsWith("ring:") || id.startsWith("spoke:"));

export function isClearOfRoads(x, z, clearance, except, activeAccess) {
  for (const road of roadTemplates.values()) {
    if (road.id === except || (activeAccess && road.id.startsWith("access:") && !activeAccess.has(road.id))) continue;
    const margin = clearance + road.width / 2;
    const { minX, maxX, minZ, maxZ } = road;
    if (x >= minX - margin && x <= maxX + margin && z >= minZ - margin && z <= maxZ + margin
      && distanceToRoadSquared(x, z, road) <= margin ** 2) return false;
  }
  return true;
}

export function roadsForPlots(plots, population = 0) {
  const active = new Set([squareAccess, ...ringSectors[0].flat()]);
  const accessPoints = new Map();
  const doorways = new Map();

  function openSector(ring, sector) {
    for (let level = 0; level <= ring; level += 1) {
      for (const road of ringSectors[level][sector]) active.add(road);
    }
    for (let level = 1; level <= ring; level += 1) {
      for (const road of [spokes[level][sector], spokes[level][(sector + 1) % 4]]) {
        if (road) active.add(road);
      }
    }
  }

  let models = 0;
  let outerDistrict = false;
  for (const plot of plots) {
    models += plot.models;
    for (const site of plot.sites) {
      outerDistrict ||= site.zone !== "center";
      openSector(site.street, site.sector);
      if (site.frontage) {
        const { road } = site.frontage;
        active.add(road);
        if (!accessPoints.has(road)) accessPoints.set(road, []);
        accessPoints.get(road).push(site);
      } else if (site.access) {
        active.add(site.access);
        doorways.set(site.access, site.entry);
      }
    }
  }
  if (models >= 9) for (let sector = 0; sector < 4; sector += 1) openSector(1, sector);
  if (models >= 24 && outerDistrict) for (let sector = 0; sector < 4; sector += 1) openSector(2, sector);
  const openLength = () => [...active].reduce((length, id) => length + roadTemplates.get(id).length, 0);
  // Extend the public network as the population grows, even before every district has buildings.
  for (let ring = 1; ring <= 2 && openLength() < population * 0.5; ring += 1) {
    for (let sector = 0; sector < 4; sector += 1) openSector(ring, sector);
  }

  const roads = new Map();
  const junctions = new Map();
  function connect(road) {
    roads.set(road.id, road);
    for (const node of [road.start, road.end]) {
      if (!junctions.has(node)) junctions.set(node, []);
      junctions.get(node).push(road);
    }
  }

  for (const id of [...active].sort()) {
    const road = roadTemplates.get(id);
    const sites = accessPoints.get(id);
    if (!sites) {
      const entry = doorways.get(id);
      if (entry) {
        const end = road.points.at(-1);
        const points = road.points.map((point) => {
          const blend = (point.distance / road.length) ** 2;
          return { x: point.x + (entry.x - end.x) * blend, z: point.z + (entry.z - end.z) * blend };
        });
        connect(makeRoad(id, road.start, road.end, road, points));
      } else connect(road);
      continue;
    }
    const stops = new Map([[0, road.start], [road.length, road.end]]);
    for (const { access, entry, frontage } of sites) {
      const { distance, point } = frontage;
      const node = stops.get(distance) ?? `${id}:frontage:${distance}`;
      stops.set(distance, node);
      const length = Math.hypot(entry.x - point.x, entry.z - point.z);
      const count = Math.max(2, Math.ceil(length * 10));
      const points = Array.from({ length: count + 1 }, (_, index) => ({
        x: point.x + (entry.x - point.x) * index / count,
        z: point.z + (entry.z - point.z) * index / count,
      }));
      connect(makeRoad(access, node, `${access}:end`, { ...alley, width: frontage.width }, points));
    }
    const boundaries = [...stops].sort((a, b) => a[0] - b[0]);
    for (let index = 1; index < boundaries.length; index += 1) {
      const [from, start] = boundaries[index - 1];
      const [to, end] = boundaries[index];
      const points = [roadSample(road, from), ...road.points.filter(({ distance }) => distance > from + 1e-8 && distance < to - 1e-8),
        roadSample(road, to)];
      connect(makeRoad(`${id}:${from}:${to}`, start, end, road, points, id, from));
    }
  }
  const key = [...roads.values()].map(({ id, points }) => `${id}:${points.at(-1).x}:${points.at(-1).z}`).join("|");
  return { key, roads, junctions };
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
