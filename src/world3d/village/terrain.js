import { createBridge } from "../models/infrastructure/bridge.js";
import { createVillageSquare } from "../models/infrastructure/village-square.js";
import { createCliff } from "../models/landscape/cliff.js";
import { createIslandPlateau } from "../models/landscape/island-plateau.js";
import { createLake } from "../models/landscape/lake.js";
import { createRiver } from "../models/landscape/river.js";
import { createRock } from "../models/landscape/rock.js";
import { edgeRatio, riverX, terrainY } from "../models/landscape/terrain-profile.js";
import { createModelGroup } from "../models/model-group.js";
import { createTree } from "../models/vegetation/tree.js";
import { distanceToRoadSquared } from "./road-network.js";

export function createTerrain(resources) {
  const terrain = createModelGroup("Terrain");
  terrain.add(
    createIslandPlateau(resources),
    createCliff(resources),
    createLake(resources),
    createRiver(resources),
    createVillageSquare(resources),
  );
  const bridge = createBridge(resources);
  bridge.position.set(riverX(2.8), 0, 2.8);
  terrain.add(bridge);

  const scenery = [];
  for (let i = 0; i < 94; i += 1) {
    const angle = i * 2.39996323;
    const radius = (13.3 + ((i * 17) % 43) / 11) * edgeRatio(angle);
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    if (Math.abs(riverX(z) - x) < 1.15 || (Math.abs(x) < 12.2 && Math.abs(z) < 12.2)) {
      continue;
    }
    const size = 0.66 + (i % 9) * 0.075;
    const element = i % 6 === 0
      ? createRock(resources, size, angle)
      : createTree(resources, size, angle, i % 3 === 0, i % 4 !== 0);
    element.position.set(x, terrainY(x, z), z);
    terrain.add(element);
    scenery.push({ element, x, z, clearance: size * 0.56 });
  }

  let key;
  function update({ plots, network }) {
    if (network.key === key) return;
    key = network.key;
    const roads = [...network.roads.values()].map((road) => ({
      road,
      minX: Math.min(...road.points.map(({ x }) => x)), maxX: Math.max(...road.points.map(({ x }) => x)),
      minZ: Math.min(...road.points.map(({ z }) => z)), maxZ: Math.max(...road.points.map(({ z }) => z)),
    }));
    const sites = plots.flatMap((plot) => plot.sites);

    function clearOfVillage(x, z, clearance) {
      if (sites.some((site) => (x - site.x) ** 2 + (z - site.z) ** 2 < (site.footprint * 0.72 + clearance) ** 2)) return false;
      return !roads.some(({ road, minX, maxX, minZ, maxZ }) => {
        const margin = road.width / 2 + clearance;
        return x >= minX - margin && x <= maxX + margin && z >= minZ - margin && z <= maxZ + margin
          && distanceToRoadSquared(x, z, road) <= margin * margin;
      });
    }

    for (const { element, x, z, clearance } of scenery) element.visible = clearOfVillage(x, z, clearance);
    resources.updateGroundCover(clearOfVillage);
  }

  return { group: terrain, update };
}
