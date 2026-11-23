import { BufferGeometry, Float32BufferAttribute, Mesh } from "three";
import { noise } from "../landscape/noise.js";
import { terrainY } from "../landscape/terrain-profile.js";
import { createModelGroup } from "../model-group.js";

export const trailHeight = (x, z) => terrainY(x, z) + 0.032;

function trailGeometry(network) {
  const positions = [];
  const uvs = [];
  const colors = [];
  const indices = [];
  const junctions = new Map();

  function vertex(x, z, brightness, shoulder = 0, lift = 0) {
    positions.push(x, trailHeight(x, z) + lift, z);
    uvs.push(x * 1.18, z * 1.18);
    const grain = noise(x * 4.3, z * 4.3) * 0.075 + noise(x * 11, z * 11) * 0.035;
    const shade = brightness + grain;
    colors.push(shade - shoulder * 0.20, shade - shoulder * 0.11, shade - shoulder * 0.21);
  }

  for (const road of network.roads.values()) {
    const section = [[-0.5, 0.66, 0.91, -0.022], [-0.44, 0.82, 0.58, -0.013], [-0.40, 0.94, 0.19, -0.004]];
    for (let lane = 1; lane < road.lanes; lane += 1) {
      const offset = lane / road.lanes - 0.5;
      section.push([offset - 0.048, 1.0, 0, 0], [offset, 0.84, 0.35, 0.004],
        [offset + 0.048, 1.0, 0, 0]);
    }
    section.push([0.40, 0.94, 0.19, -0.004], [0.44, 0.82, 0.58, -0.013], [0.5, 0.66, 0.91, -0.022]);
    const start = positions.length / 3;
    const points = road.points;
    for (const [i, point] of points.entries()) {
      const before = points[Math.max(0, i - 1)];
      const after = points[Math.min(i + 1, points.length - 1)];
      const dx = after.x - before.x, dz = after.z - before.z;
      const length = Math.hypot(dx, dz);
      const width = road.width * (1 + 0.069 * noise(point.x * 3.8, point.z * 3.8));
      for (const [column, [offset, shade, shoulder, lift]] of section.entries()) {
        vertex(point.x + dz / length * offset * width, point.z - dx / length * offset * width, shade, shoulder, lift);
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
  const capStart = indices.length;
  for (const { point, radius } of junctions.values()) {
    const center = positions.length / 3;
    vertex(point.x, point.z, 0.94, 0, 0.009);
    const sides = 20;
    for (const [ring, fraction] of [0.74, 1.01].entries()) {
      for (let i = 0; i < sides; i += 1) {
        const angle = i * Math.PI * 2 / sides;
        const x = point.x + Math.cos(angle) * radius * fraction;
        const z = point.z + Math.sin(angle) * radius * fraction;
        vertex(x, z, ring ? 0.72 : 0.95, ring ? 0.75 : 0.10, ring ? -0.020 : 0.006);
        const a = center + 1 + i;
        const b = center + 1 + (i + 1) % sides;
        if (ring) indices.push(a, b, a + sides, b, b + sides, a + sides);
        else indices.push(center, b, a);
      }
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const caps = new BufferGeometry();
  for (const [name, attribute] of Object.entries(geometry.attributes)) caps.setAttribute(name, attribute);
  caps.setIndex(indices.slice(capStart));
  geometry.setIndex(indices.slice(0, capStart));
  return { geometry, caps };
}

export function createTrails(material) {
  const group = createModelGroup("Village paths");
  let key;

  function dispose() {
    for (const mesh of group.children) mesh.geometry.dispose();
    group.clear();
  }

  return {
    group,
    update(network) {
      if (network.key === key) return;
      dispose();
      const { geometry, caps } = trailGeometry(network);
      const mesh = new Mesh(geometry, material);
      mesh.receiveShadow = true;
      group.add(mesh, new Mesh(caps, material));
      key = network.key;
    },
    dispose,
  };
}
