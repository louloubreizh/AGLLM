import { createModelGroup } from "../model-group.js";

export function createVillageSquare({ part, materials }) {
  const group = createModelGroup("Village square");
  part(group, "column", materials.paver, 0, 0.16, 0, 2.45, 0.2, 2.45);
  part(group, "column", materials.stone, 0, 0.32, 0, 0.71, 0.22, 0.71);
  part(group, "rock", materials.light, 0, 0.58, 0, 0.35, 0.46, 0.35);
  return group;
}
