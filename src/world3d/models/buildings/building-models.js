import { createBuildingArchitecture } from "./architecture.js";
import { buildingDesigns } from "./catalog.js";
import { createBuildingMaterials } from "./materials.js";

export function createBuildingModels(seasonalMaterials) {
  const materials = createBuildingMaterials(seasonalMaterials);
  const architecture = createBuildingArchitecture(materials.finishes);
  const templates = new Map();

  function instantiate(id, label, footprintLimit) {
    if (!Object.hasOwn(buildingDesigns, id)) return null;
    if (!templates.has(id)) templates.set(id, architecture.build(id, buildingDesigns[id]));

    const { group, footprint } = templates.get(id);
    const model = group.clone();
    model.name = label;
    model.scale.setScalar(Math.min(1.12, footprintLimit / footprint));
    return model;
  }

  return {
    instantiate,
    dispose() {
      for (const { group } of templates.values()) {
        for (const mesh of group.children) mesh.geometry.dispose();
      }
      templates.clear();
      architecture.dispose();
      materials.dispose();
    },
  };
}
