import { createModelGroup } from "../model-group.js";

export function createIslandPlateau({ part, materials, groundCover }) {
  const group = createModelGroup("Island plateau");
  part(group, "land", materials.grass, 0, 0, 0, 1, 1, 1, 0, false);
  group.add(groundCover);
  return group;
}
