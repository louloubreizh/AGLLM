import { Color, InstancedMesh, Object3D } from "three";
import { createModelGroup } from "../model-group.js";
import { plantGeometry, plantRandom } from "../vegetation/plant-geometry.js";
import { noise } from "./noise.js";
import { edgeRatio, riverExtent, riverWidth, riverX, terraceRadius, terrainY } from "./terrain-profile.js";

export const groundSpecies = [
  { name: "Fétuque", kind: "grass", color: 0x889756, size: 0.31, bounds: 0.20 },
  { name: "Fougère", kind: "fern", color: 0x5c8347, size: 0.51, bounds: 0.54 },
  { name: "Trèfle", kind: "clover", color: 0x61884d, size: 0.29, bounds: 0.32 },
  { name: "Pissenlit", kind: "dandelion", color: 0x718947, flower: 0xffcf48, size: 0.32, bounds: 0.34 },
  { name: "Pâquerette", kind: "daisy", color: 0x768d55, flower: 0xf5ecdc, size: 0.33, bounds: 0.28 },
  { name: "Lavande", kind: "lavender", color: 0x798670, flower: 0xa08ac6, size: 0.49, bounds: 0.27 },
  { name: "Plantain", kind: "plantain", color: 0x708549, size: 0.36, bounds: 0.42 },
  { name: "Roseau", kind: "reed", color: 0x8d9356, flower: 0xbca37c, size: 0.62, bounds: 0.24 },
  { name: "Massette", kind: "cattail", color: 0x778b4e, flower: 0x68412d, size: 0.64, bounds: 0.26 },
  { name: "Bruyère", kind: "heather", color: 0x67734c, flower: 0xcd91ae, size: 0.38, bounds: 0.34 },
];

function speciesGeometry({ kind, color, flower }, index) {
  const shape = plantGeometry();
  const random = plantRandom(1507 + index * 821);

  function blade(x, y, z, direction, reach, height, width, tint = color, form = "blade") {
    const c = Math.cos(direction), s = Math.sin(direction);
    const rows = [];
    const profile = kind === "grass" ? [[0, 0.71], [0.55, 1], [1, 0.02]] : [[0, 0.26], [0.32, 0.89], [0.63, 1], [1, 0.02]];
    for (const [t, breadth] of profile) {
      const curve = form === "petal" ? t : Math.sin(t * (form === "frond" ? Math.PI * 0.76 : 1.55));
      const along = reach * (form === "petal" ? t : t ** 1.27);
      rows.push([x + c * along, y + height * curve, z + s * along, -s * width * breadth, c * width * breadth, 0.72 + t * 0.28]);
    }
    shape.strip(rows, tint);
  }

  function bloom(x, y, z, petals, reach, tint, rise = 0.04) {
    for (let i = 0; i < petals; i++) {
      blade(x, y, z, i * Math.PI * 2 / petals, reach * (0.9 + random() * 0.16), rise, reach * 0.20, tint, "petal");
    }
  }

  if (kind === "grass" || kind === "reed" || kind === "cattail") {
    const tall = kind !== "grass";
    for (let i = 0; i < (tall ? 9 : 6); i++) {
      const angle = i * 2.39996;
      const reach = (tall ? 0.17 : 0.25) + random() * 0.15;
      blade(0, 0, 0, angle, reach, (tall ? 0.40 : 0.27) + random() * 0.47, tall ? 0.035 : 0.024);
    }
    if (tall) for (let i = -1; i <= 1; i++) {
      const x = i * 0.12;
      const top = 0.78 + random() * 0.35;
      shape.stem([x * 0.3, 0, 0], [x, top, 0.05], 0.021, 0.011, color, 4);
      shape.stem([x, top - 0.14, 0.05], [x, top + 0.07, 0.055], 0.034, kind === "cattail" ? 0.027 : 0.007, flower, 5);
      if (kind === "reed") for (let j = 0; j < 5; j++) {
        blade(x, top - 0.09 + j * 0.032, 0.05, j * 2.4, 0.094 - j * 0.01, 0.11, 0.014, flower, "petal");
      }
    }
  } else if (kind === "fern") {
    for (let i = 0; i < 6; i++) {
      const angle = i * 2.39996;
      const length = 0.40 + random() * 0.18;
      const c = Math.cos(angle), s = Math.sin(angle);
      blade(0, 0, 0, angle, length, 0.50, 0.018, color, "frond");
      for (let j = 1; j <= 4; j++) {
        const t = j / 5;
        const r = length * t ** 1.27;
        const y = Math.sin(t * Math.PI * 0.76) * 0.50;
        for (const side of [-1, 1]) blade(c * r, y, s * r, angle + side * 1.05, 0.19 * (1.18 - t),
          0.032, 0.043 * (1.14 - t), color, "frond");
      }
    }
  } else if (kind === "clover") {
    for (let i = 0; i < 6; i++) {
      const angle = i * 2.39996;
      const x = Math.cos(angle) * 0.21, z = Math.sin(angle) * 0.21;
      const y = 0.13 + random() * 0.28;
      shape.stem([0, 0, 0], [x, y, z], 0.012, 0.006, color, 3);
      for (let leaf = 0; leaf < 3; leaf++) blade(x, y, z, angle + leaf * 2.094, 0.16, 0.038, 0.078, color, "petal");
    }
  } else {
    const spikes = kind === "lavender" || kind === "heather";
    for (let i = 0; i < 7; i++) {
      const angle = i * 2.39996;
      blade(0, 0, 0, angle, 0.27 + random() * 0.17, 0.12 + random() * 0.18,
        kind === "plantain" ? 0.104 : spikes ? 0.039 : 0.055);
    }
    const stems = kind === "dandelion" ? 2 : 4;
    for (let i = 0; i < stems; i++) {
      const angle = i * 2.39996;
      const x = Math.cos(angle) * (0.08 + random() * 0.16), z = Math.sin(angle) * 0.16;
      const y = 0.38 + random() * 0.28;
      shape.stem([0, 0, 0], [x, y, z], 0.017, 0.008, color, 4);
      if (spikes) {
        for (let j = 0; j < 4; j++) bloom(x, y + j * 0.052, z, 4, 0.077 - j * 0.009, flower, 0.027);
      } else if (kind === "plantain") {
        shape.stem([x, y - 0.03, z], [x * 1.13, y + 0.14, z], 0.038, 0.015, 0x856c48, 5);
      } else {
        bloom(x, y, z, kind === "daisy" ? 9 : 12, 0.135, flower);
        bloom(x, y + 0.014, z, 6, kind === "daisy" ? 0.056 : 0.098, 0xf5bb43, 0.04);
      }
    }
  }
  return shape.build();
}

export function createGroundCover(material) {
  const group = createModelGroup("Meadow and riverbank plants");
  const transform = new Object3D();
  const random = plantRandom(95071);
  const pots = groundSpecies.map(() => []);
  const candidates = 9000;
  for (let i = 1; i <= candidates; i++) {
    const angle = i * 2.39996323 + random() * 0.021;
    const edge = terraceRadius * edgeRatio(angle);
    const radius = edge * Math.sqrt(i / candidates);
    const x = radius * Math.cos(angle), z = radius * Math.sin(angle);
    const bank = Math.abs(z) < riverExtent + 0.22;
    const bankDistance = Math.abs(x - riverX(z)) - riverWidth(z);
    const wet = bank && bankDistance > 0.27 && bankDistance < 1.16;
    const patch = noise(x * 0.60, z * 0.60);
    if (radius > edge - 0.30 || (bank && bankDistance < 0.25)
      || (!wet && patch < -0.47 && random() < 0.80)) continue;
    const choice = random();
    const type = wet ? (choice < 0.56 ? 7 : 8)
      : choice < 0.73 ? 0
        : [1, 2, 3, 4, 5, 6, 9][Math.min(6, Math.floor((choice - 0.73) / 0.27 * 7))];
    if (type !== 0 && !wet && radius > 14 && random() < 0.52) continue;
    const species = groundSpecies[type];
    const scale = species.size * (0.70 + random() * 0.55);
    transform.position.set(x, terrainY(x, z) - 0.012, z);
    transform.rotation.set((random() - 0.5) * 0.20, angle * 2.7, (random() - 0.5) * 0.20);
    transform.scale.set(scale, scale * (0.83 + random() * 0.28), scale);
    transform.updateMatrix();
    const shade = 0.73 + random() * 0.36;
    pots[type].push({ x, z, clearance: scale * species.bounds, matrix: transform.matrix.clone(),
      color: new Color().setRGB(shade, shade, shade * 0.92) });
  }

  const samples = pots.map((points, index) => {
    const species = groundSpecies[index];
    const mesh = new InstancedMesh(speciesGeometry(species, index), material, points.length);
    mesh.name = species.name;
    mesh.receiveShadow = true;
    group.add(mesh);
    return { mesh, points };
  });

  function update(keep) {
    for (const { mesh, points } of samples) {
      let count = 0;
      for (const { x, z, clearance, matrix, color } of points) {
        if (keep && !keep(x, z, clearance)) continue;
        mesh.setMatrixAt(count, matrix);
        mesh.setColorAt(count, color);
        count += 1;
      }
      mesh.count = count;
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.computeBoundingSphere();
    }
  }

  update();
  return {
    group, update,
    dispose() {
      for (const { mesh } of samples) {
        mesh.dispose();
        mesh.geometry.dispose();
      }
    },
  };
}
