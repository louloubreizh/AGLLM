import { Box3, InstancedMesh, Matrix4 } from "three";
import { createCapacityPlaques } from "../models/buildings/capacity-plaque.js";
import { createBuildingModels } from "../models/buildings/building-models.js";
import { buildingModelId } from "../models/buildings/catalog.js";
import { terrainY } from "../models/landscape/terrain-profile.js";
import { createModelGroup } from "../models/model-group.js";

export function createVillageBuildings(resources) {
  const group = createModelGroup("Buildings");
  const catalog = createBuildingModels(resources.materials);
  const plaques = createCapacityPlaques();
  const instances = new Map();
  const bounds = new WeakMap();
  const draws = new WeakMap();
  const hiddenMatrix = new Matrix4().makeScale(1e-6, 1e-6, 1e-6);
  let buildingsKey;
  let highlighted;

  function setHighlighted(model) {
    if (model === highlighted) return;
    if (highlighted) {
      const { meshes, index } = draws.get(highlighted);
      for (const mesh of meshes) {
        mesh.setMatrixAt(index, highlighted.matrix);
        mesh.instanceMatrix.needsUpdate = true;
      }
      group.remove(highlighted);
    }
    highlighted = model;
    if (model) {
      // The outline pass selects an object, so render the hovered copy separately.
      const { meshes, index } = draws.get(model);
      for (const mesh of meshes) {
        mesh.setMatrixAt(index, hiddenMatrix);
        mesh.instanceMatrix.needsUpdate = true;
      }
      group.add(model);
    }
  }

  function clear() {
    setHighlighted();
    for (const batch of group.children) for (const mesh of batch.children) mesh.dispose();
    group.clear();
    instances.clear();
  }

  function update(plots) {
    const nextKey = JSON.stringify(plots.map(({ id, label, stage, sites }) => [id, label, stage,
      sites.map(({ x, z, yaw, footprint, capacity }) => [x, z, yaw, footprint, capacity])]));
    if (nextKey === buildingsKey) return;

    clear();
    for (const plot of plots) {
      const buildings = createModelGroup(plot.label || plot.id);
      const id = buildingModelId(plot.id, plot.stage);
      const batches = new Map();
      for (const site of plot.sites) {
        if (!batches.has(site.capacity)) batches.set(site.capacity, []);
        batches.get(site.capacity).push(site);
      }
      const models = [];
      for (const [capacity, sites] of batches) {
        const template = catalog.instantiate(id, plot.label || id, sites[0].footprint, capacity);
        if (!template) continue;
        const localBounds = new Box3().setFromObject(template);
        localBounds.min.divideScalar(template.scale.x);
        localBounds.max.divideScalar(template.scale.x);
        const meshes = template.children.map((part) => {
          const mesh = new InstancedMesh(part.geometry, part.material, sites.length);
          mesh.castShadow = part.castShadow;
          mesh.receiveShadow = part.receiveShadow;
          buildings.add(mesh);
          return mesh;
        });
        const plaque = capacity > 1 ? plaques.batch(capacity, template, localBounds, sites.length) : null;
        const plaqueMatrix = new Matrix4();
        const front = plaque && new Matrix4().makeScale(plaque.width, plaque.width, plaque.width).setPosition(plaque.offset);
        if (plaque) buildings.add(plaque.mesh);
        for (const [index, { x, z, yaw }] of sites.entries()) {
          const model = template.clone();
          model.position.set(x, terrainY(x, z) + 0.026, z);
          model.rotation.y = yaw;
          model.updateMatrix();
          bounds.set(model, localBounds.clone().applyMatrix4(model.matrix));
          draws.set(model, { meshes, index });
          for (const mesh of meshes) mesh.setMatrixAt(index, model.matrix);
          if (plaque) plaque.mesh.setMatrixAt(index, plaqueMatrix.multiplyMatrices(model.matrix, front));
          models.push(model);
        }
      }
      instances.set(plot.id, models);
      group.add(buildings);
    }
    buildingsKey = nextKey;
  }

  return {
    group, instances, bounds, setHighlighted, update,
    dispose() {
      clear();
      catalog.dispose();
      plaques.dispose();
    },
  };
}
