import { createModelGroup } from "../model-group.js";

export function createCliff({ part, materials }) {
  const group = createModelGroup("Cliff");
  part(group, "cliff", materials.cliff, 0, 0, 0, 1, 1, 1, 0, false);
  return group;
}
