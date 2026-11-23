import { buildingSites } from "./districts.js";
import { roadsForPlots } from "./road-network.js";

export const maximumResidents = 28;

export function planVillage(buildings, population) {
  const plots = buildings.flatMap((building) => {
    const sites = buildingSites.get(building.id);
    const site = sites?.[0];
    const models = Math.min(3, building.count);
    return site && models > 0 ? [{
      ...building, x: site.x, z: site.z, yaw: site.yaw, zone: site.zone, models, sites: sites.slice(0, models),
    }] : [];
  });
  return { plots, residents: Math.min(maximumResidents, population), network: roadsForPlots(plots) };
}
