import {
  DataTexture, InstancedMesh, LinearFilter, MeshBasicMaterial, PlaneGeometry, Raycaster, RGBAFormat, SRGBColorSpace, Vector3,
} from "three";

const glyphs = {
  "×": [[4, 9, 17, 22], [17, 9, 4, 22]],
  "0": [[2, 7, 2, 25], [2, 25, 6, 29], [6, 29, 15, 29], [15, 29, 19, 25],
    [19, 25, 19, 7], [19, 7, 15, 3], [15, 3, 6, 3], [6, 3, 2, 7]],
  "1": [[3, 7, 10, 3], [10, 3, 10, 29], [3, 29, 17, 29]],
  "3": [[3, 3, 15, 3], [15, 3, 19, 7], [19, 7, 19, 12], [19, 12, 15, 15], [15, 15, 8, 15],
    [15, 15, 19, 19], [19, 19, 19, 25], [19, 25, 15, 29], [15, 29, 3, 29]],
};

function strokeDistance(x, y, [ax, ay, bx, by]) {
  const dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(x - (ax + dx * t), y - (ay + dy * t));
}

function plaqueTexture(capacity) {
  const width = 128, height = 64;
  const data = new Uint8Array(width * height * 4);
  const text = [...`×${capacity}`];
  const advance = 28;
  const left = (width - (text.length - 1) * advance - 21) / 2;
  const top = (height - 32) / 2;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const radius = Math.hypot(Math.max(0, 12 - Math.min(x, width - 1 - x)), Math.max(0, 12 - Math.min(y, height - 1 - y)));
      if (radius > 12) continue;
      const distance = Math.min(x, width - 1 - x, y, height - 1 - y, 12 - radius);
      const letterIndex = Math.floor((x - left + 4) / advance);
      const letter = text[letterIndex];
      const ink = letter && Math.min(...glyphs[letter].map((stroke) =>
        strokeDistance(x - left - letterIndex * advance, y - top, stroke)));
      const coverage = letter ? Math.max(0, Math.min(1, 2.8 - ink)) : 0;
      const tone = distance < 2.5 ? [182, 150, 92]
        : distance < 4 ? [114, 97, 64] : [35 + Math.floor((height - y) / 9), 46 + Math.floor((height - y) / 7), 38];
      const textColor = [247, 235, 199];
      data.set([...tone.map((value, index) => value + (textColor[index] - value) * coverage), 255],
        ((height - 1 - y) * width + x) * 4);
    }
  }
  const texture = new DataTexture(data, width, height, RGBAFormat);
  texture.colorSpace = SRGBColorSpace;
  texture.magFilter = texture.minFilter = LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

export function createCapacityPlaques() {
  const geometry = new PlaneGeometry(1, 0.5);
  const materials = new Map();
  const ray = new Raycaster(new Vector3(), new Vector3(0, 0, -1));

  return {
    batch(capacity, template, bounds, count) {
      if (!materials.has(capacity)) {
        materials.set(capacity, new MeshBasicMaterial({ map: plaqueTexture(capacity), alphaTest: 0.45, toneMapped: false }));
      }
      const mesh = new InstancedMesh(geometry, materials.get(capacity), count);
      mesh.name = `×${capacity}`;
      const scale = template.scale.x;
      const x = (bounds.min.x + bounds.max.x) / 2;
      const y = bounds.min.y + (bounds.max.y - bounds.min.y) * 0.75;
      const width = Math.min((bounds.max.x - bounds.min.x) * 0.72, (bounds.max.y - bounds.min.y) * 0.64, 0.65 / scale);

      // Measure the real facade at the height of the plaque, including sloping roofs.
      let z = -Infinity;
      for (const shift of [0, -0.30, 0.30]) {
        for (const height of [0, -0.16, 0.16]) {
          ray.ray.origin.set((x + width * shift) * scale, (y + width * height) * scale, bounds.max.z * scale + 0.5);
          const hit = ray.intersectObjects(template.children, false)[0];
          if (hit) z = Math.max(z, hit.point.z / scale);
        }
      }
      const offset = new Vector3(x, y, (Number.isFinite(z) ? z : bounds.max.z) + 0.018 / scale);
      return { mesh, offset, width };
    },
    dispose() {
      geometry.dispose();
      for (const material of materials.values()) {
        material.map.dispose();
        material.dispose();
      }
    },
  };
}
