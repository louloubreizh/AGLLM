import { DataTexture, LinearFilter, LinearMipmapLinearFilter, RepeatWrapping, RGBAFormat } from "three";
import { clamp, noise } from "./noise.js";

export function createSurfaceTexture(stone = false) {
  const size = 128;
  const data = new Uint8Array(size * size * 4);
  for (let z = 0; z < size; z += 1) {
    for (let x = 0; x < size; x += 1) {
      const u = x / size;
      const v = z / size;
      const grain = noise(u * 96, v * 96, 96);
      const mottling = noise(u * 12, v * 12, 12) * 0.13 + noise(u * 31, v * 31, 31) * 0.10;
      const vein = stone ? Math.sin(v * 12 * Math.PI + noise(u * 4, v * 4, 4) * 2.5) * 0.10 : 0;
      const shade = clamp(0.79 + mottling + grain * (stone ? 0.12 : 0.21) + vein);
      const i = (z * size + x) * 4;
      data[i] = shade * 255;
      data[i + 1] = shade * (stone ? 246 : 255);
      data[i + 2] = shade * (stone ? 236 : 240);
      data[i + 3] = 255;
    }
  }
  const texture = new DataTexture(data, size, size, RGBAFormat);
  texture.name = stone ? "Stone grain" : "Ground grain";
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}
