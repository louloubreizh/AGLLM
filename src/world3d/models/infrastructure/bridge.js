import { createModelGroup } from "../model-group.js";

export function createBridge({ part, materials }) {
  const group = createModelGroup("Bridge");
  for (let i = 0; i < 9; i += 1) {
    part(group, "box", materials.bridgeWood, (i - 4) * 0.29, 0.19, 0, 0.27, 0.19, 0.95);
  }
  return group;
}
