import { BufferGeometry, Float32BufferAttribute } from "three";
import { createModelGroup } from "../model-group.js";
import { edgeRatio, lakeHorizonRadius, lakeLevel, segmentCount, terraceRadius } from "./terrain-profile.js";

export function lakeGeometry() {
  const positions = [];
  const uvs = [];
  const indices = [];
  const columns = segmentCount + 1;
  const shoreOffsets = [-2.4, 0, 1.3, 3.5, 8];
  const openWaterRadii = [60, 140, 260, lakeHorizonRadius];
  const rings = shoreOffsets.length + openWaterRadii.length;

  for (let ring = 0; ring < rings; ring += 1) {
    for (let i = 0; i <= segmentCount; i += 1) {
      const angle = i / segmentCount * 2 * Math.PI;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const rim = terraceRadius * edgeRatio(angle);
      const radius = ring < shoreOffsets.length
        ? rim + shoreOffsets[ring]
        : openWaterRadii[ring - shoreOffsets.length];
      positions.push(radius * cos, lakeLevel, radius * sin);
      uvs.push(radius - rim, 0);
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
