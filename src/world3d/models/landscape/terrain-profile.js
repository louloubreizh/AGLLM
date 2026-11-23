import { noise, smoothstep } from "./noise.js";

export const terraceRadius = 18.6;
export const segmentCount = 224;
export const riverLevel = 0.072;
export const riverExtent = 9.12;
export const lakeLevel = -2.45;

export const riverX = (z) => -13.8 + 1.25 * Math.sin(z * 0.23);

export function riverWidth(z) {
  const width = 0.84 + 0.12 * Math.sin(0.87 * z + 0.4) + 0.08 * Math.cos(1.4 * z);
  return width * Math.sqrt(Math.max(0, 1 - (Math.abs(z) / riverExtent) ** 8));
}

export function edgeRatio(angle) {
  const x = Math.cos(angle);
  const z = Math.sin(angle);
  return 1 + 0.08 * Math.cos(5 * angle) + 0.04 * Math.sin(3 * angle + 0.7)
    + 0.024 * noise(x * 6 + 11, z * 6) + 0.008 * noise(x * 14, z * 14 + 8);
}

export function terrainY(x, z) {
  const outer = smoothstep(11.8, 17.5, Math.max(Math.abs(x), Math.abs(z)));
  const relief = outer * (0.18 + 0.38 * noise(x * 0.41, z * 0.41) + 0.11 * noise(x * 1.2, z * 1.2));
  const base = 0.024 * Math.sin(x * 0.58) * Math.cos(z * 0.49);
  const distance = Math.abs(x - riverX(z)) - riverWidth(z);
  const channel = (1 - smoothstep(-0.24, 0.38, distance)) * (1 - smoothstep(8.35, 9.6, Math.abs(z)));
  const bank = (1 - smoothstep(0, 0.68, Math.abs(distance))) * (1 - smoothstep(8.45, 9.55, Math.abs(z)));
  return base + relief - channel * (relief + 0.23) + bank * 0.085;
}
