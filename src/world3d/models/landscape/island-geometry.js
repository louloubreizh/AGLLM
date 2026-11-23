import { BufferGeometry, Float32BufferAttribute } from "three";
import { noise, smoothstep } from "./noise.js";
import { edgeRatio, riverExtent, riverWidth, riverX, segmentCount, terraceRadius, terrainY } from "./terrain-profile.js";

const plateauRings = 68;
const cliffRings = 24;

function plateauPoint(radius, angle) {
  const x = radius * Math.cos(angle);
  const z = radius * Math.sin(angle);
  const broad = noise(x * 0.2, z * 0.2);
  const fine = noise(x * 0.62, z * 0.62);
  const bankDistance = Math.abs(Math.abs(x - riverX(z)) - riverWidth(z));
  const riverbank = (1 - smoothstep(0.03, 0.65, bankDistance)) * (1 - smoothstep(8.6, riverExtent + 0.2, Math.abs(z)));
  const dry = Math.max(riverbank * 0.75, smoothstep(0.33, 0.92, broad + fine * 0.33) * 0.7);
  const shade = 0.87 + broad * 0.17 + fine * 0.07;
  return {
    position: [x, terrainY(x, z), z],
    color: [shade + dry * 0.31, shade - dry * 0.12, shade - dry * 0.27],
    uv: [x * 0.61, z * 0.61],
  };
}

function cliffPoint(angle, depth, progress) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const rim = terraceRadius * edgeRatio(angle);
  const erosion = noise(cos * 9 + progress * 1.2, sin * 9 + progress * 2.2);
  const fissure = noise(cos * 28 + progress * 0.9, sin * 28 + progress * 2.1);
  const phase = progress * 25 + noise(cos * 3.4, sin * 3.4) * 2.1;
  const band = Math.sin(phase) * 0.72 + Math.sin(phase * 1.77 + 1.6) * 0.28;
  const radius = rim + smoothstep(0, 0.18, progress) * (0.34 + erosion * 0.71 + fissure * 0.15 + band * 0.12)
    - 0.96 * smoothstep(0.38, 1, progress);
  const x = radius * cos;
  const z = radius * sin;
  const seamHeight = terrainY(rim * cos, rim * sin);
  const y = seamHeight - depth + Math.sin(angle * 3 + 0.4) * 0.13 * progress;
  const wet = smoothstep(0.65, 1, progress);
  const shade = 0.74 + erosion * 0.27 + fissure * 0.11 + band * 0.085 - wet * 0.28;
  const moss = (1 - smoothstep(0.07, 0.41, progress)) * (0.44 + erosion * 0.35);
  return {
    position: [x, y, z],
    color: [shade + 0.035 - moss * 0.15, shade + moss * 0.19, shade * 0.94 - moss * 0.19],
    uv: [angle / (2 * Math.PI) * 56, y * 0.85],
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
        ? cliffPoint(angle, progress * 3.12, progress)
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
