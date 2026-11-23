import { DataTexture, LinearFilter, LinearMipmapLinearFilter, RepeatWrapping, RGBAFormat } from "three";
import { clamp, noise, smoothstep } from "./noise.js";

function gravel(u, v) {
  const cells = 32;
  const ix = Math.floor(u * cells), iy = Math.floor(v * cells);
  const offsetX = noise(ix + 19, iy + 7, cells);
  const offsetY = noise(ix + 1, iy + 27, cells);
  const dx = u * cells - ix - 0.50 - offsetX * 0.22;
  const dy = v * cells - iy - 0.50 - offsetY * 0.23;
  const radius = Math.hypot(dx * (0.95 + offsetY * 0.24), dy);
  const edge = 0.225 + offsetX * 0.16 + noise(u * 118, v * 118, 118) * 0.035;
  const pebble = 1 - smoothstep(edge - 0.035, edge + 0.03, radius);
  const rim = 1 - smoothstep(edge + 0.025, edge + 0.11, radius);
  return pebble * (0.12 + offsetY * 0.15 - dy * 0.25) - (rim - pebble) * 0.15;
}

export function createSurfaceTexture(surface = "ground") {
  const cliff = surface === "cliff";
  const stone = surface === "stone" || cliff;
  const size = stone && !cliff ? 128 : 256;
  const data = new Uint8Array(size * size * 4);
  for (let z = 0; z < size; z += 1) {
    for (let x = 0; x < size; x += 1) {
      const u = x / size;
      const v = z / size;
      const grain = noise(u * 96, v * 96, 96);
      const mottling = noise(u * 12, v * 12, 12) * 0.13 + noise(u * 31, v * 31, 31) * 0.10;
      const vein = stone ? Math.sin(v * 12 * Math.PI + noise(u * 4, v * 4, 4) * 2.5) * 0.10 : 0;
      let shade = 0.79 + mottling + grain * (stone ? 0.12 : 0.21) + vein;
      let warmth = 0;
      if (cliff) {
        const strata = v * 4 + noise(u * 4, v * 4, 4) * 0.22 + noise(u * 16, v * 16, 16) * 0.075;
        const bed = Math.floor(strata);
        const phase = strata - bed;
        const seam = 1 - smoothstep(0.025, 0.115, Math.min(phase, 1 - phase));
        const joint = u * 7 + bed * 0.25 + noise(u * 14, v * 14, 14) * 0.27;
        const jointPhase = joint - Math.floor(joint);
        const split = (1 - smoothstep(0.016, 0.092, Math.min(jointPhase, 1 - jointPhase)))
          * smoothstep(-0.45, 0.62, noise(u * 7, v * 7, 7));
        const mineral = noise(u * 9, v * 9, 9);
        const pits = smoothstep(0.48, 0.88, noise(u * 73, v * 73, 73));
        shade = 0.84 + mottling * 0.75 + mineral * 0.085 + grain * 0.06
          + Math.sin(phase * 2 * Math.PI) * 0.064 - seam * 0.24 - split * 0.29 - pits * 0.13;
        warmth = mineral * 11 + Math.sin(strata * Math.PI) * 5;
      }
      if (surface === "ground") {
        const tuft = smoothstep(-0.36, 0.56, noise(u * 19, v * 19, 19) + mottling);
        const speckle = noise(u * 124, v * 124, 124);
        const blades = Math.sin((u * 96 + noise(u * 24, v * 24, 24) * 1.1) * Math.PI * 2 + Math.sin(v * 35 * Math.PI));
        shade = 0.72 + tuft * 0.18 + mottling * 0.62 + grain * 0.13 + blades * tuft * 0.055 + speckle * 0.095;
        warmth = (1 - tuft) * 15 - tuft * 10;
      }
      if (surface === "trail") {
        shade = 0.76 + mottling * 0.54 + grain * 0.09 + gravel(u, v);
        warmth = noise(u * 52, v * 52, 52) * 10 + 9;
      }
      if (surface === "bark") {
        const fiber = u * 19 + noise(u * 9, v * 3, 9) * 0.83 + noise(u * 38, v * 7, 38) * 0.28;
        const furrow = fiber - Math.floor(fiber);
        const fissure = 1 - smoothstep(0.06, 0.23, Math.min(furrow, 1 - furrow));
        const scar = smoothstep(0.38, 0.76, noise(u * 33, v * 47, 47) + noise(u * 13, v * 11, 13) * 0.47);
        shade = 0.84 + mottling * 0.6 + grain * 0.085 - fissure * 0.29 - scar * 0.23;
        warmth = grain * 5;
      }
      shade = clamp(shade);
      const i = (z * size + x) * 4;
      data[i] = shade * (255 + Math.min(0, warmth));
      data[i + 1] = shade * (stone ? 246 : 255);
      data[i + 2] = shade * ((stone ? 236 : 240) - warmth);
      data[i + 3] = 255;
    }
  }
  const texture = new DataTexture(data, size, size, RGBAFormat);
  texture.name = {
    cliff: "Fractured rock strata", stone: "Stone grain", ground: "Meadow turf and exposed soil",
    trail: "Compacted dirt and gravel", bark: "Bark fissures",
  }[surface];
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}
