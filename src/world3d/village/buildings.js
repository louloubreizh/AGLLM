import { createBuildingModels } from "../models/buildings/building-models.js";
import { buildingModelId } from "../models/buildings/catalog.js";
import { terrainY } from "../models/landscape/terrain-profile.js";
import { createModelGroup } from "../models/model-group.js";

export function createVillageBuildings(resources) {
  const group = createModelGroup("Buildings");
  const catalog = createBuildingModels(resources.materials);
  const instances = new Map();
  let buildingsKey;

  function update(plots) {
    const nextKey = JSON.stringify(plots.map(({ id, label, stage, models, x, z, yaw }) => [id, label, stage, models, x, z, yaw]));
    if (nextKey === buildingsKey) return;

    group.clear();
    instances.clear();
    for (const plot of plots) {
      const buildings = createModelGroup(plot.label || plot.id);
      const id = buildingModelId(plot.id, plot.stage);
      const models = plot.sites.flatMap(({ x, z, yaw, footprint }) => {
        const model = catalog.instantiate(id, plot.label || id, footprint);
        if (!model) return [];
        model.position.set(x, terrainY(x, z) + 0.026, z);
        model.rotation.y = yaw;
        return [model];
      });
      if (!models.length) continue;
      buildings.add(...models);
      instances.set(plot.id, models);
      group.add(buildings);
    }
    buildingsKey = nextKey;
  }

  return { group, instances, update, dispose: catalog.dispose };
}
