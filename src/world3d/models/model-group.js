import { Group } from "three";

export function createModelGroup(name) {
  const group = new Group();
  group.name = name;
  return group;
}
