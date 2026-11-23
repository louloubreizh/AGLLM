import { createBuildingArchitecture } from "./architecture.js";
import { buildingCapacityTiers } from "./capacity-variants.js";
import { buildingDesigns } from "./catalog.js";
import { buildingInteractionScale, minimumOpening, standingResident } from "./interaction-scale.js";
import { createBuildingMaterials } from "./materials.js";

const tierScale = { 1: 1, 3: 1.8, 10: 2.55 };
const footprints = new Map();

export function naturalBuildingFootprint(id, capacity) {
  return buildingDimensions(id).natural * tierScale[capacity];
}

export function buildingEntrance(id, _capacity, footprint) {
  const dimensions = buildingDimensions(id);
  const scale = footprint / dimensions.footprint;
  return { x: dimensions.entrance.x * scale, z: dimensions.entrance.z * scale + standingResident.frontReach };
}

export function buildingOpening(id, footprint) {
  const dimensions = buildingDimensions(id);
  if (!dimensions.opening) return null;
  const scale = footprint / dimensions.footprint;
  const [width, height] = dimensions.opening;
  return { width: width * scale, height: height * scale };
}

function buildingDimensions(id) {
  if (!footprints.has(id)) {
    // Layout only needs geometry. All finishes can share one placeholder during measurement.
    const finish = {};
    const architecture = createBuildingArchitecture(new Proxy({}, { get: () => finish }));
    const { group, footprint, doorway, center, height, depth } = architecture.build(id, buildingDesigns[id]);
    for (const mesh of group.children) mesh.geometry.dispose();
    architecture.dispose();
    const profile = buildingInteractionScale[id];
    const x = profile.approach ?? doorway.x;
    const opening = profile.opening ?? (doorway && [doorway.width, doorway.height]);
    const fit = opening ? Math.max(minimumOpening.width / opening[0], minimumOpening.height / opening[1]) : 0;
    const requestedScale = profile.height * standingResident.height / height;
    footprints.set(id, { footprint, natural: footprint * Math.max(requestedScale, fit), opening,
      entrance: { x: x - center.x, z: depth / 2 } });
  }
  return footprints.get(id);
}

export function createBuildingModels(seasonalMaterials) {
  const materials = createBuildingMaterials(seasonalMaterials);
  const architecture = createBuildingArchitecture(materials.finishes);
  const templates = new Map();

  function instantiate(id, label, footprintLimit, capacity = 1) {
    if (!Object.hasOwn(buildingDesigns, id) || !buildingCapacityTiers(id).includes(capacity)) return null;
    if (!templates.has(id)) {
      templates.set(id, architecture.build(id, buildingDesigns[id]));
    }

    const { group, footprint } = templates.get(id);
    const model = group.clone();
    model.name = capacity === 1 ? label : `${label} ×${capacity}`;
    model.scale.setScalar((footprintLimit ?? naturalBuildingFootprint(id, capacity)) / footprint);
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
