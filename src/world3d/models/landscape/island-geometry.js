import { BufferGeometry, Float32BufferAttribute } from "three";
import { noise, smoothstep } from "./noise.js";
import { edgeRatio, lakeLevel, riverExtent, riverWidth, riverX, segmentCount, terraceRadius, terrainY } from "./terrain-profile.js";

const plateauRings = 106;
const cliffRings = 50;
const cliffDepth = 4.35;

function plateauPoint(radius, angle) {
  const x = radius * Math.cos(angle);
  const z = radius * Math.sin(angle);
  const broad = noise(x * 0.2, z * 0.2);
  const fine = noise(x * 0.62, z * 0.62);
  const moss = smoothstep(-0.32, 0.66, noise(x * 0.31 + 4, z * 0.30) + fine * 0.29);
  const rim = smoothstep(0.86, 1, radius / (terraceRadius * edgeRatio(angle)));
  const bankDistance = Math.abs(Math.abs(x - riverX(z)) - riverWidth(z));
  const riverbank = (1 - smoothstep(0.03, 0.65, bankDistance)) * (1 - smoothstep(8.6, riverExtent + 0.2, Math.abs(z)));
  const dry = Math.max(riverbank * 0.72, smoothstep(0.19, 0.86, broad + fine * 0.40) * 0.74, rim * 0.40);
  const shade = 0.85 + broad * 0.095 + fine * 0.085 - moss * 0.12;
  return {
    position: [x, terrainY(x, z), z],
    color: [shade + dry * 0.48, shade - dry * 0.09 + moss * 0.075, shade - dry * 0.25 + moss * 0.035],
    uv: [x * 0.72, z * 0.72],
  };
}

function cliffPoint(angle, progress) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const rim = terraceRadius * edgeRatio(angle);
  const spur = noise(cos * 6.5 + progress * 0.8, sin * 6.5 - progress * 0.9);
  const blocks = noise(cos * 21 + progress * 1.1, sin * 21 + progress * 2.1);
  const fractured = noise(cos * 43 + progress * 2.5, sin * 43 - progress * 3.1);
  const joint = smoothstep(0.23, 0.69, -blocks - fractured * 0.27);
  const tilt = noise(cos * 3.5, sin * 3.5) * 0.38 + Math.sin(angle * 3 + 0.4) * 0.19;
  const layer = (progress * cliffDepth + tilt) * 1.60
    + noise(cos * 13 + progress * 4, sin * 13 + progress * 1.8) * 0.48;
  const bedding = layer - Math.floor(layer);
  const bedStrength = smoothstep(-0.72, 0.52, noise(cos * 10 + progress * 8, sin * 10 + progress * 5));
  const ledge = smoothstep(0.06, 0.23, bedding) * (1 - smoothstep(0.37, 0.91, bedding)) * bedStrength;
  const face = smoothstep(0, 0.16, progress);
  // Keep the top edge welded to the plateau while the lower beds overhang or recede.
  const radius = rim + face * (0.11 + spur * (0.7 + progress * 0.67) + blocks * 0.21
    + fractured * 0.14 + ledge * (0.34 + spur * 0.13) - joint * 0.53)
    + smoothstep(0.33, 1, progress) * (0.28 + spur * 0.36);
  const x = radius * cos;
  const z = radius * sin;
  const seamHeight = terrainY(rim * cos, rim * sin);
  const y = seamHeight - progress * cliffDepth + tilt * face * 0.55 + fractured * face * 0.06;
  const wet = 1 - smoothstep(lakeLevel + 0.10, lakeLevel + 0.72 + spur * 0.27, y);
  const shade = 0.88 + spur * 0.15 + blocks * 0.11 + ledge * 0.13 - joint * 0.19 - wet * 0.29;
  const moss = (1 - smoothstep(0.03, 0.33, progress)) * smoothstep(-0.5, 0.65, blocks + spur * 0.5);
  return {
    position: [x, y, z],
    color: [shade + ledge * 0.045 - moss * 0.20, shade + moss * 0.12, shade * 0.96 - moss * 0.25],
    uv: [angle / (2 * Math.PI) * 21, (y - tilt * 0.7) * 0.46],
  };
}

export function islandGeometry(cliff) {
  const ringCount = cliff ? cliffRings : plateauRings;
  const columns = segmentCount + 1;
  const positions = [];
  const colors = [];
  const uvs = [];
  const indices = [];
  for (let ring = 0; ring <= ringCount; ring += 1) {
    const progress = ring / ringCount;
    for (let index = 0; index <= segmentCount; index += 1) {
      const angle = index / segmentCount * 2 * Math.PI;
      const point = cliff
        ? cliffPoint(angle, progress)
        : plateauPoint(progress * terraceRadius * edgeRatio(angle), angle);
      positions.push(...point.position);
      colors.push(...point.color);
      uvs.push(...point.uv);
    }
  }

  for (let ring = 0; ring < ringCount; ring += 1) {
    for (let index = 0; index < segmentCount; index += 1) {
      const a = ring * columns + index;
      const b = a + 1;
      const c = a + columns;
      const d = c + 1;
      if (cliff) indices.push(a, b, c, b, d, c);
      else {
        if (ring) indices.push(a, b, d);
        indices.push(a, d, c);
      }
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const normal = geometry.getAttribute("normal");
  if (!cliff) {
    for (let index = 0; index < columns; index += 1) normal.setXYZ(index, 0, 1, 0);
  }
  // Smooth across the duplicated UV seam.
  for (let ring = 0; ring <= ringCount; ring += 1) {
    const first = ring * columns;
    const last = first + segmentCount;
    const x = normal.getX(first) + normal.getX(last);
    const y = normal.getY(first) + normal.getY(last);
    const z = normal.getZ(first) + normal.getZ(last);
    const length = Math.hypot(x, y, z) || 1;
    normal.setXYZ(first, x / length, y / length, z / length);
    normal.setXYZ(last, x / length, y / length, z / length);
  }
  return geometry;
}
