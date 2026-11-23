import { BufferGeometry, Float32BufferAttribute } from "three";
import { createModelGroup } from "../model-group.js";
import { riverExtent, riverLevel, riverWidth, riverX } from "./terrain-profile.js";

export function riverGeometry() {
  const lengthSegments = 128;
  const widthSegments = 8;
  const positions = [];
  const uvs = [];
  const indices = [];
  for (let i = 0; i <= lengthSegments; i += 1) {
    const t = i / lengthSegments;
    const z = -riverExtent * Math.cos(Math.PI * t);
    const x = riverX(z);
    const width = Math.max(0.001, riverWidth(z));
    for (let across = 0; across <= widthSegments; across += 1) {
      const u = across / widthSegments;
      positions.push(x + (u * 2 - 1) * width, riverLevel, z);
      uvs.push(u, t);
      if (i === lengthSegments || across === widthSegments) continue;
      const a = i * (widthSegments + 1) + across;
      const b = a + widthSegments + 1;
      indices.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function createRiver({ part, materials }) {
  const river = createModelGroup("River");
  part(river, "river", materials.water, 0, 0, 0, 1, 1, 1, 0, false);
  return river;
}
