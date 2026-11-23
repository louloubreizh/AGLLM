import { BufferGeometry, Float32BufferAttribute } from "three";
import { createModelGroup } from "../model-group.js";
import { noise } from "./noise.js";
import { edgeRatio, lakeLevel, segmentCount, terraceRadius } from "./terrain-profile.js";

export function lakeGeometry() {
  const positions = [];
  const uvs = [];
  const indices = [];
  const columns = segmentCount + 1;
  const rings = [0, 0.12, 0.36, 0.65, 0.82, 0.94, 1];
  const offset = 0.88;

  // The inner ring sits beneath the cliff. The intermediate rings carry the shallows.
  for (let ring = 0; ring < rings.length; ring += 1) {
    for (let i = 0; i <= segmentCount; i += 1) {
      const angle = i / segmentCount * 2 * Math.PI;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const inner = terraceRadius * edgeRatio(angle) - offset;
      const shore = inner + 3.75 + cos * 0.7 + sin * 0.35 + noise(cos * 4.1 + 8, sin * 4.1) * 1.45;
      const radius = inner + (shore - inner) * rings[ring];
      positions.push(radius * cos, lakeLevel, radius * sin);
      uvs.push(rings[ring], 0);
      if (ring === 0 || i === segmentCount) continue;
      const c = ring * columns + i;
      const a = c - columns;
      indices.push(a, a + 1, c + 1, a, c + 1, c);
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function createLake({ part, materials }) {
  const group = createModelGroup("Lake");
  part(group, "lake", materials.pool, 0, 0, 0, 1, 1, 1, 0, false);
  return group;
}
