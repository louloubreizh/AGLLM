import { DataTexture, LinearFilter, LinearMipmapLinearFilter, RGBAFormat } from "three";
import { plantRandom } from "./plant-geometry.js";

const size = 128;

export function foliageTexture(kind) {
  const data = new Uint8Array(size * size * 4);
  const random = plantRandom(8041 + kind.length);
  const needle = kind === "needle";
  const drooping = kind === "drooping";

  function leaf(x, y, length, width, angle, shade) {
    const sine = Math.sin(angle), cosine = Math.cos(angle);
    const extent = Math.ceil(length + width);
    for (let py = Math.max(0, Math.floor(y - extent)); py < Math.min(size, y + extent); py++) {
      for (let px = Math.max(0, Math.floor(x - extent)); px < Math.min(size, x + extent); px++) {
        const dx = px - x;
        const dy = py - y;
        const along = (dx * cosine + dy * sine) / length;
        if (Math.abs(along) >= 1) continue;
        const across = Math.abs(-dx * sine + dy * cosine) / width;
        const edge = Math.pow(1 - along * along, needle ? 1.25 : 0.82) * (0.95 + 0.08 * Math.sin(along * 22));
        if (across > edge) continue;
        const brightness = shade + (across < 0.16 ? 21 : 0) + Math.cos(along * 16 - across * 4) * 7;
        data.set([brightness, brightness, brightness, 255], (py * size + px) * 4);
      }
    }
  }

  // Several overlapping shoots give the cards holes and irregular silhouettes.
  for (let shoot = 0; shoot < 12; shoot++) {
    const angle = shoot * 2.39996 + random() * 0.4;
    const radius = 22 + random() * 24;
    const cx = 64 + Math.cos(angle) * radius;
    const cy = 64 + Math.sin(angle) * radius;
    const direction = drooping ? -Math.PI / 2 + Math.cos(angle) * 0.42 : angle;
    leaf((cx + 64) / 2, (cy + 64) / 2, radius * 0.64, 1.05, angle, 128);
    for (let index = 0; index < (needle ? 34 : 24); index++) {
      const offset = (random() - 0.5) * 39;
      const side = (random() - 0.5) * (needle ? 23 : 28);
      const x = cx + Math.cos(direction) * offset - Math.sin(direction) * side;
      const y = cy + Math.sin(direction) * offset + Math.cos(direction) * side;
      if (Math.hypot(x - 64, y - 64) > 56 + 5 * Math.sin(angle * 3)) continue;
      leaf(x, y, needle ? 7 + random() * 9 : 3.2 + random() * (drooping ? 12 : 6),
        needle ? 0.75 + random() * 1.05 : (drooping ? 1.1 : 1.7) + random() * 2.7,
        direction + (random() - 0.5) * 2.4, 159 + random() * 78);
    }
  }

  // Keep identical RGB under transparent texels so linear sampling preserves leaf colour at the edges.
  for (let i = 0; i < data.length; i += 4) {
    if (!data[i + 3]) data[i] = data[i + 1] = data[i + 2] = 188;
  }
  const texture = new DataTexture(data, size, size, RGBAFormat);
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}
