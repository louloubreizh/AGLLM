import { createModelGroup } from "../model-group.js";

export function createTree({ part, materials }, size, angle, conifer, dark) {
  const group = createModelGroup("Tree");
  part(group, "column", materials.trunk, 0, size * 0.37, 0, 0.14, size * 0.7, 0.14);
  part(group, conifer ? "cone" : "leaf", dark ? materials.dark : materials.leaf, 0, size * 1.03, 0,
    size * 1.2, size * 1.55, size * 1.2, angle);
  if (conifer) {
    part(group, "cone", materials.leaf, 0, size * 1.48, 0, size * 0.82, size, size * 0.82, angle);
  }
  return group;
}
