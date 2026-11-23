import { buildingCapacityTiers } from "../models/buildings/capacity-variants.js";
import { buildingEntrance, naturalBuildingFootprint } from "../models/buildings/building-models.js";
import { buildingModelId } from "../models/buildings/catalog.js";
import { edgeRatio, riverExtent, riverWidth, riverX, terraceRadius } from "../models/landscape/terrain-profile.js";
import { buildingSites, smallFootprint } from "./districts.js";
import { frontageRoads, isClearOfRoads, roadSample, roadsForPlots } from "./road-network.js";

const zones = ["center", "outskirts", "countryside"];
const centerRadius = 9.7;
const outskirtsRadius = 13.9;
const frontageWidth = 0.28;
const reservedSites = [];
const fixedSites = new Map([...buildingSites].map(([id, candidates]) => [id, candidates.filter((site) => {
  if (!isClearOfRoads(site.x, site.z, smallFootprint / 2 + 0.01, site.access)
    || reservedSites.some((other) => Math.hypot(site.x - other.x, site.z - other.z) <= smallFootprint + 0.02)) return false;
  reservedSites.push(site);
  return true;
})]));

function safeSite(x, z, clearance, limit = 19.4) {
  const radius = Math.hypot(x, z);
  const rim = terraceRadius * edgeRatio(Math.atan2(z, x));
  return radius > 1.34 + clearance && radius < Math.min(limit, rim - 0.45) - clearance
    && (Math.abs(z) >= riverExtent + clearance || Math.abs(x - riverX(z)) > riverWidth(z) + 0.25 + clearance);
}

function distanceToEntrance(site, { x, z }) {
  const { point } = site.frontage;
  const dx = (site.entry?.x ?? site.x) - point.x;
  const dz = (site.entry?.z ?? site.z) - point.z;
  const t = Math.min(site.entry ? 1 : 1 - 0.23 * site.footprint / Math.hypot(dx, dz),
    Math.max(0, ((x - point.x) * dx + (z - point.z) * dz) / (dx * dx + dz * dz)));
  return Math.hypot(point.x + dx * t - x, point.z + dz * t - z);
}

function doorPosition(plot, site, capacity, size) {
  const model = buildingModelId(plot.id, plot.stage);
  const { x, z } = buildingEntrance(model, capacity, size);
  const cos = Math.cos(site.yaw);
  const sin = Math.sin(site.yaw);
  return { x: site.x + x * cos + z * sin, z: site.z - x * sin + z * cos };
}

function conflictsWith(site, other) {
  return Math.hypot(site.x - other.x, site.z - other.z) <= (site.footprint + other.footprint) / 2 + 0.03
    || distanceToEntrance(site, other) < (other.footprint + site.frontage.width) / 2
    || (other.frontage && distanceToEntrance(other, site) < (site.footprint + other.frontage.width) / 2);
}

function availableSites(footprint, required, occupied, useNeighboringDistricts) {
  const sites = new Map(zones.map((zone) => [zone, []]));
  const clearance = footprint / 2 + 0.045;
  const accessWidth = Math.min(frontageWidth, footprint / 2);
  const activeAccess = new Set(occupied.map(({ access }) => access));
  const limit = useNeighboringDistricts ? 23 : 19.4;
  const setbacks = useNeighboringDistricts ? [0.13, 0.8, 1.6, 2.55, 3.5] : [0.13, 0.55, 1.1];
  for (const road of frontageRoads) {
    const [, streetNumber, sectorNumber] = road.id.split(":");
    const street = Number(streetNumber);
    const spread = street < 2 ? 0.07 : street === 2 ? 0.22 : 0.46;
    const step = footprint + Math.min(spread, footprint * 0.35);
    const slots = Math.floor(road.length / Math.max(0.10, step * 0.60)) + 1;
    for (let slot = 0; slot < slots; slot += 1) {
      const distance = road.length * (slot + 0.5) / slots;
      const point = roadSample(road, distance);
      for (const setback of setbacks) for (const side of [-1, 1]) {
        const streetDistance = road.width / 2 + clearance + setback;
        const x = point.x + Math.cos(point.yaw) * streetDistance * side;
        const z = point.z - Math.sin(point.yaw) * streetDistance * side;
        const radius = Math.hypot(x, z);
        const zone = radius < centerRadius ? "center" : radius < outskirtsRadius ? "outskirts" : "countryside";
        const shoreRatio = radius / (terraceRadius * edgeRatio(Math.atan2(z, x)));
        if (!useNeighboringDistricts && shoreRatio >= 0.798) continue;
        if (!required.has(zone) || !safeSite(x, z, clearance, limit) || !isClearOfRoads(x, z, clearance, null, activeAccess)) continue;
        if (![0.25, 0.5, 0.75].every((t) => safeSite(point.x + (x - point.x) * t,
          point.z + (z - point.z) * t, accessWidth / 2, limit))) continue;
        const site = {
          x, z, yaw: Math.atan2(point.x - x, point.z - z), zone, street, sector: Number(sectorNumber),
          footprint, radius, shoreRatio, frontage: { road: road.id, distance, point, width: accessWidth },
        };
        if (occupied.some((other) => conflictsWith(site, other))) continue;
        sites.get(zone).push(site);
      }
    }
  }
  return sites;
}

function placePlots(plots, capacities, scales, useNeighboringDistricts) {
  const occupied = [];
  const pending = new Map();
  for (const plot of plots) {
    plot.sites = [];
    const groups = capacities.get(plot.id);
    for (const { capacity, copies, footprint } of groups) {
      for (let copy = 0; copy < copies; copy += 1) {
        const size = capacity === 1 ? footprint : footprint * scales.get(plot.id);
        const slot = { plot, capacity, size, index: plot.sites.length };
        plot.sites.push(null);
        const fixed = plot.relocated || size > smallFootprint || (plot.zone === "center" && groups.length > 1)
          ? null : fixedSites.get(plot.id)[slot.index];
        if (fixed) {
          const site = { ...fixed, footprint: size, capacity, entry: doorPosition(plot, fixed, capacity, size) };
          occupied.push(site);
          plot.sites[slot.index] = site;
        } else {
          const bucket = 1.16 ** Math.ceil(Math.log(size) / Math.log(1.16));
          if (!pending.has(bucket)) pending.set(bucket, []);
          pending.get(bucket).push(slot);
        }
      }
    }
  }

  for (const [bucket, slots] of [...pending].sort(([a], [b]) => b - a)) {
    slots.sort((a, b) => a.index - b.index || a.plot.id.localeCompare(b.plot.id));
    const required = new Set(useNeighboringDistricts ? zones : slots.map(({ plot }) => plot.zone));
    const available = availableSites(bucket, required, occupied, useNeighboringDistricts);
    for (const [zone, queue] of available) {
      const hasLargeModels = slots.some(({ plot, capacity }) => plot.zone === zone && capacity > 1);
      queue.sort((a, b) => Number(b.shoreRatio > 0.73) - Number(a.shoreRatio > 0.73)
        || (zone !== "center" && hasLargeModels ? a.radius - b.radius : b.radius - a.radius));
    }
    for (const { plot, capacity, size, index } of slots) {
      const preferred = zones.indexOf(plot.zone);
      const nearestDistricts = zones.toSorted((a, b) => Math.abs(zones.indexOf(a) - preferred)
        - Math.abs(zones.indexOf(b) - preferred) || zones.indexOf(b) - zones.indexOf(a));
      const larger = plot.sites.filter((site) => site && site.capacity > capacity);
      const boundary = larger.length ? (plot.zone === "center" ? Math.max : Math.min)(
        ...larger.map(({ x, z }) => Math.hypot(x, z))) : null;
      const inOrder = (radius) => plot.zone === "center" ? radius > boundary + 0.15 : radius < boundary - 0.15;
      const candidates = nearestDistricts.map((zone) => available.get(zone)).filter((queue) => queue?.length);
      const queue = (boundary !== null && candidates.find((options) => options.some(({ radius }) => inOrder(radius))))
        || candidates[0];
      if (!queue) return { plot, capacity, bucket };
      let choice = queue.length - 1;
      if (boundary !== null) {
        let fallback = choice;
        let closest = Infinity;
        for (let candidate = queue.length - 1; candidate >= 0; candidate -= 1) {
          const radius = queue[candidate].radius;
          if (inOrder(radius)) {
            choice = candidate;
            closest = -Infinity;
            break;
          }
          if (Math.abs(radius - boundary) < closest) {
            closest = Math.abs(radius - boundary);
            fallback = candidate;
          }
        }
        if (closest !== -Infinity) choice = fallback;
      }
      const [candidate] = queue.splice(Math.max(0, choice), 1);
      const { radius, shoreRatio, ...frontage } = candidate;
      const site = {
        ...frontage, footprint: size, capacity, access: "access:" + plot.id + ":frontage:" + (index + 1),
        entry: doorPosition(plot, candidate, capacity, size),
      };
      occupied.push(site);
      plot.sites[index] = site;
      for (const [zone, options] of available) {
        available.set(zone, options.filter((option) => !conflictsWith(option, site)));
      }
    }
  }
  return null;
}

const suburbs = new Set(["warehouse", "spaceport", "broadcasttower", "dataCenter"]);

export function planVillage(buildings, population) {
  const capacities = new Map();
  const plots = buildings.flatMap((building) => {
    const reserved = buildingSites.get(building.id);
    let remaining = Math.floor(building.count);
    if (!reserved || !Number.isFinite(remaining) || remaining < 1) return [];
    const id = buildingModelId(building.id, building.stage);
    const groups = [];
    let models = 0;
    for (const capacity of buildingCapacityTiers(id)) {
      const copies = Math.floor(remaining / capacity);
      if (copies) groups.push({ capacity, copies, footprint: naturalBuildingFootprint(id, capacity) });
      models += copies;
      remaining %= capacity;
    }
    capacities.set(building.id, groups);
    const zone = id === "zebraWorkshop" ? "center" : suburbs.has(id) ? "outskirts" : reserved[0].zone;
    return [{ ...building, zone, relocated: zone !== reserved[0].zone, models, sites: [] }];
  });
  const scales = new Map(plots.map(({ id }) => [id, 1]));
  const area = new Map([...capacities].map(([id, groups]) =>
    [id, groups.reduce((sum, { capacity, footprint, copies }) => sum + (capacity === 1 ? 0 : footprint ** 2 * copies), 0)]));
  let failure;
  let useNeighboringDistricts = false;
  while ((failure = placePlots(plots, capacities, scales, useNeighboringDistricts))) {
    const { plot: { id, zone: packedZone }, capacity, bucket } = failure;
    const plotsInZone = plots.filter(({ id, zone }) => area.get(id) && scales.get(id) > 0.06
      && (useNeighboringDistricts || zone === packedZone));
    if (!plotsInZone.length) {
      if (useNeighboringDistricts) throw new Error("Les bâtiments individuels dépassent la capacité des chemins de l’île.");
      useNeighboringDistricts = true;
      continue;
    }
    const hasRoom = capacity === 1 || useNeighboringDistricts
      || availableSites(bucket, new Set([packedZone]), [], false).get(packedZone).length > 0;
    const biggest = hasRoom ? plotsInZone.reduce((largest, { id }) =>
      area.get(id) * scales.get(id) ** 2 > area.get(largest) * scales.get(largest) ** 2 ? id : largest, plotsInZone[0].id) : id;
    if (!useNeighboringDistricts && scales.get(biggest) < 0.18) {
      useNeighboringDistricts = true;
    } else {
      scales.set(biggest, scales.get(biggest) * 0.90);
    }
  }
  for (const plot of plots) {
    const { x, z, yaw } = plot.sites[0];
    Object.assign(plot, { x, z, yaw });
  }
  const residents = Math.max(0, Math.floor(population));
  return { plots, residents, network: roadsForPlots(plots, residents) };
}
