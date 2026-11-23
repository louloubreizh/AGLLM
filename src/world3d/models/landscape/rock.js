import { SphereGeometry } from "three";
import { createModelGroup } from "../model-group.js";
import { noise } from "./noise.js";

export function rockGeometry() {
  const geometry = new SphereGeometry(0.5, 32, 20);
  const positions = geometry.getAttribute("position");
  const uvs = geometry.getAttribute("uv");
  for (let i = 0; i < positions.count; i += 1) {
    const x = positions.getX(i);
    const y = positions.getY(i);
    const z = positions.getZ(i);
    const fracture = noise(x * 7 + 4 + y * 2, z * 8 + y * 4);
    const grain = noise(x * 23 + z * 9, y * 17 - z * 12);
    const scale = 0.97 + fracture * 0.36 + grain * 0.07;
    positions.setXYZ(i, x * scale + y * 0.12, Math.min(0.34 + x * 0.16, y * scale), z * scale);
    uvs.setXY(i, uvs.getX(i) * 3, uvs.getY(i) * 2);
  }
  geometry.computeVertexNormals();
  return geometry;
}

export function createRock({ part, materials }, size, angle) {
  const group = createModelGroup("Rock");
  part(group, "boulder", materials.boulder, 0, 0.15, 0, size * 1.22, size * 0.82, size * 0.93, angle);
  part(group, "boulder", materials.boulder, size * 0.51, 0.07, size * 0.29, size * 0.42, size * 0.36, size * 0.46, angle + 1.4);
  return group;
}
