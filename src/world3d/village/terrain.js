import { InstancedMesh, Object3D } from "three";
import { createBridge } from "../models/infrastructure/bridge.js";
import { createVillageSquare } from "../models/infrastructure/village-square.js";
import { createCliff } from "../models/landscape/cliff.js";
import { createIslandPlateau } from "../models/landscape/island-plateau.js";
import { createLake } from "../models/landscape/lake.js";
import { createRiver } from "../models/landscape/river.js";
import { createRock } from "../models/landscape/rock.js";
import { edgeRatio, riverExtent, riverWidth, riverX, terraceRadius, terrainY } from "../models/landscape/terrain-profile.js";
import { createModelGroup } from "../models/model-group.js";
import { createWoodland, treeAt, treeSpecies } from "../models/vegetation/tree.js";
import { distanceToRoadSquared } from "./road-network.js";

function createClearanceIndex() {
  const bins = new Map();
  const cell = (value) => Math.floor(value / 2);
  return {
    add(item, minX, maxX, minZ, maxZ) {
      for (let x = cell(minX); x <= cell(maxX); x += 1) {
        for (let z = cell(minZ); z <= cell(maxZ); z += 1) {
          const key = `${x}:${z}`;
          if (!bins.has(key)) bins.set(key, []);
          bins.get(key).push(item);
        }
      }
    },
    at: (x, z) => bins.get(`${cell(x)}:${cell(z)}`) ?? [],
  };
}

export function createTerrain(resources) {
  const terrain = createModelGroup("Terrain");
  const woodland = createWoodland(resources.materials.trunk);
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
  for (let i = 0; i < 460; i += 1) {
    const angle = i * 2.39996323;
    const radius = (1.85 + (terraceRadius - 2.8) * ((i * 37 % 463) / 462) ** 0.65) * edgeRatio(angle);
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    if (Math.abs(z) < riverExtent + 0.4 && Math.abs(riverX(z) - x) < 1.15) {
      continue;
    }
    const size = 0.66 + (i % 9) * 0.075;
    const rock = i % 6 === 0;
    if (!rock && i >= 190) continue;
    const species = treeAt(i, z, Math.abs(riverX(z) - x) - riverWidth(z));
    const element = rock
      ? createRock(resources, size, angle)
      : woodland.template(species, true).clone();
    const scale = rock ? 0.43 : size * (radius < 13 ? 0.27 : 0.38);
    element.scale.setScalar(scale);
    element.position.set(x, terrainY(x, z), z);
    if (!rock) element.rotation.y = angle;
    terrain.add(element);
    scenery.push({ element, x, z, clearance: rock ? size * scale * 0.56 : scale * (treeSpecies[species].spread + 0.27) });
  }

  const forest = createModelGroup("Woodland");
  terrain.add(forest);
  const treeCount = 2600;
  const pointsBySpecies = treeSpecies.map(() => []);
  for (let index = 0; index < treeCount; index += 1) {
    const angle = (index + 0.5) * 2.39996323;
    const radius = (1.6 + (terraceRadius - 2.55) * ((index + 0.5) / treeCount) ** 0.63) * edgeRatio(angle);
    const x = radius * Math.cos(angle);
    const z = radius * Math.sin(angle);
    if (Math.abs(z) < riverExtent + 0.35 && Math.abs(riverX(z) - x) < 1.22) continue;
    const scale = (radius < 13 ? 0.21 : 0.30) * (0.71 + (index % 13) * 0.048);
    const species = treeAt(index, z, Math.abs(riverX(z) - x) - riverWidth(z));
    pointsBySpecies[species].push({ x, z, y: terrainY(x, z), angle, scale,
      clearance: scale * (treeSpecies[species].spread + 0.19) });
  }
  const trees = pointsBySpecies.map((points, species) => ({
    points,
    meshes: woodland.template(species).children.map((part, index) => {
      const mesh = new InstancedMesh(part.geometry, part.material, points.length);
      mesh.name = treeSpecies[species].name;
      mesh.receiveShadow = true;
      // Only the foliage casts the distant woodland shadow.
      mesh.castShadow = index === 1;
      mesh.count = 0;
      forest.add(mesh);
      return mesh;
    }),
  }));
  const transform = new Object3D();
  let previousPlots;
  let previousRoads;
  function update({ plots, network }) {
    if (plots === previousPlots && network.key === previousRoads) return;
    previousPlots = plots;
    previousRoads = network.key;
    const roads = createClearanceIndex();
    const sites = createClearanceIndex();
    for (const road of network.roads.values()) {
      const margin = road.width / 2 + 0.45;
      roads.add(road, road.minX - margin, road.maxX + margin, road.minZ - margin, road.maxZ + margin);
    }
    for (const plot of plots) for (const site of plot.sites) {
      const margin = site.footprint / 2 + 0.45;
      sites.add(site, site.x - margin, site.x + margin, site.z - margin, site.z + margin);
    }

    function clearOfVillage(x, z, clearance) {
      if (Math.hypot(x, z) < 1.35 + clearance) return false;
      if (sites.at(x, z).some((site) => (x - site.x) ** 2 + (z - site.z) ** 2 < (site.footprint / 2 + clearance) ** 2)) return false;
      return !roads.at(x, z).some((road) => {
        const { minX, maxX, minZ, maxZ } = road;
        const margin = road.width / 2 + clearance;
        return x >= minX - margin && x <= maxX + margin && z >= minZ - margin && z <= maxZ + margin
          && distanceToRoadSquared(x, z, road) <= margin * margin;
      });
    }

    for (const { element, x, z, clearance } of scenery) element.visible = clearOfVillage(x, z, clearance);
    for (const { points, meshes } of trees) {
      let count = 0;
      for (const { x, y, z, angle, scale, clearance } of points) {
        if (!clearOfVillage(x, z, clearance)) continue;
        transform.position.set(x, y, z);
        transform.rotation.y = angle;
        transform.scale.setScalar(scale);
        transform.updateMatrix();
        for (const mesh of meshes) mesh.setMatrixAt(count, transform.matrix);
        count += 1;
      }
      for (const mesh of meshes) {
        mesh.count = count;
        mesh.instanceMatrix.needsUpdate = true;
        mesh.computeBoundingSphere();
      }
    }
    resources.updateGroundCover(clearOfVillage);
  }

  return {
    group: terrain, update, canopy: woodland.canopy,
    dispose() {
      for (const mesh of forest.children) mesh.dispose();
      woodland.dispose();
    },
  };
}
