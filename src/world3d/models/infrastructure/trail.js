import { BufferGeometry, Float32BufferAttribute, Mesh } from "three";
import { terrainY } from "../landscape/terrain-profile.js";
import { createModelGroup } from "../model-group.js";

export const trailHeight = (x, z) => terrainY(x, z) + 0.032;

function trailGeometry(network) {
  const positions = [];
  const uvs = [];
  const colors = [];
  const indices = [];
  const junctions = new Map();
  const section = [-0.5, -0.32, 0, 0.32, 0.5];

  function vertex(x, z, brightness, lift = 0) {
    positions.push(x, trailHeight(x, z) + lift, z);
    uvs.push(x * 0.85, z * 0.85);
    colors.push(brightness, brightness, brightness * 0.96);
  }

  for (const road of network.roads.values()) {
    const start = positions.length / 3;
    const points = road.points;
    for (const [i, point] of points.entries()) {
      const before = points[Math.max(0, i - 1)];
      const after = points[Math.min(i + 1, points.length - 1)];
      const dx = after.x - before.x, dz = after.z - before.z;
      const length = Math.hypot(dx, dz);
      const width = road.width * (0.96 + 0.055 * Math.sin(point.x * 4.2 + point.z * 3.2));
      for (const [column, offset] of section.entries()) {
        const brightness = 0.92 - Math.abs(offset) * 0.41;
        vertex(point.x + dz / length * offset * width, point.z - dx / length * offset * width, brightness);
        if (!i || !column) continue;
        const b = start + i * section.length + column;
        const a = b - section.length;
        indices.push(a - 1, b, a, a - 1, b - 1, b);
      }
    }
    for (const [id, point] of [[road.start, points[0]], [road.end, points.at(-1)]]) {
      const radius = road.width / 2;
      if ((junctions.get(id)?.radius ?? 0) < radius) junctions.set(id, { point, radius });
    }
  }

  // Rounded end caps cover turns and join streets of different widths.
  for (const { point, radius } of junctions.values()) {
    const center = positions.length / 3;
    vertex(point.x, point.z, 0.88, 0.002);
    const sides = 12;
    for (let i = 0; i < sides; i += 1) {
      const angle = i * Math.PI * 2 / sides;
      vertex(point.x + Math.cos(angle) * radius, point.z + Math.sin(angle) * radius, 0.72, 0.002);
      indices.push(center, center + 1 + (i + 1) % sides, center + 1 + i);
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function createTrails(material) {
  const group = createModelGroup("Village paths");
  let mesh;
  let key;

  function dispose() {
    mesh?.geometry.dispose();
    group.clear();
  }

  return {
    group,
    update(network) {
      if (network.key === key) return;
      dispose();
      mesh = new Mesh(trailGeometry(network), material);
      mesh.receiveShadow = true;
      group.add(mesh);
      key = network.key;
    },
    dispose,
  };
}
