import { DoubleSide, Mesh, MeshStandardMaterial } from "three";
import { foliageTexture } from "./foliage-texture.js";
import { plantGeometry, plantRandom } from "./plant-geometry.js";
import { createModelGroup } from "../model-group.js";

export const treeSpecies = [
  { name: "Chêne", type: "dome", height: 1.88, spread: 0.91, bark: 0x85765e, foliage: 0x668649, limbs: 9, trunk: 0.13 },
  { name: "Bouleau", type: "airy", height: 2.48, spread: 0.47, bark: 0xe9e3cd, foliage: 0xa3b65a, limbs: 7, trunk: 0.066 },
  { name: "Érable", type: "spreading", height: 1.97, spread: 0.86, bark: 0x9e8872, foliage: 0xaab04a, limbs: 9, trunk: 0.10 },
  { name: "Hêtre", type: "column", height: 2.20, spread: 0.67, bark: 0xa9a699, foliage: 0x7b964d, limbs: 10, trunk: 0.092 },
  { name: "Pin sylvestre", type: "umbrella", height: 2.42, spread: 0.77, bark: 0xb47754, foliage: 0x526c55, limbs: 7, trunk: 0.09 },
  { name: "Sapin", type: "tiers", height: 2.62, spread: 0.66, bark: 0x897c64, foliage: 0x4e7354, limbs: 15, trunk: 0.085 },
  { name: "Épicéa", type: "spire", height: 2.87, spread: 0.52, bark: 0x816756, foliage: 0x426c63, limbs: 17, trunk: 0.075 },
  { name: "Saule pleureur", type: "weeping", height: 1.88, spread: 1.04, bark: 0x8b8469, foliage: 0x97ab57, limbs: 10, trunk: 0.11 },
  { name: "Peuplier", type: "spireleaf", height: 3.01, spread: 0.34, bark: 0xad9f88, foliage: 0x78975c, limbs: 10, trunk: 0.081 },
  { name: "Cèdre", type: "shelves", height: 2.27, spread: 0.95, bark: 0xa18b72, foliage: 0x637d68, limbs: 11, trunk: 0.12 },
];

function crown(type, ratio) {
  switch (type) {
    case "dome": return [0.57 + ratio * 0.42, Math.sin((ratio * 0.60 + 0.37) * Math.PI), 0.82];
    case "spreading": return [0.64 + ratio * 0.36, (1 - ratio * 0.60) * (0.78 + 0.22 * Math.cos(ratio * 9)), 0.62];
    case "airy": return [0.43 + ratio * 0.54, Math.sin((ratio * 0.69 + 0.28) * Math.PI), 1.20];
    case "column": return [0.43 + ratio * 0.54, Math.sin((ratio * 0.69 + 0.28) * Math.PI) ** 0.45, 1.10];
    case "umbrella": return [0.74 + ratio * 0.21, 0.42 + 0.56 * Math.sin(ratio * Math.PI), 0.53];
    case "tiers": return [0.30 + ratio * 0.67, (1 - ratio * 0.86) * (0.85 + 0.15 * Math.cos(Math.floor(ratio * 12) * 2)), 0.76];
    case "spire": return [0.24 + ratio * 0.73, (1 - ratio) ** 0.77 + 0.05, 1.12];
    case "weeping": return [0.69 + ratio * 0.27, 0.75 + Math.sin(ratio * Math.PI * 1.2) * 0.22, 1.78];
    case "spireleaf": return [0.31 + ratio * 0.69, Math.sin((ratio * 0.82 + 0.15) * Math.PI) ** 0.52, 1.52];
    case "shelves": return [0.38 + Math.min(3, Math.floor(ratio * 4)) * 0.175, 0.96 - ratio * 0.40, 0.43];
  }
}

const needles = new Set(["umbrella", "tiers", "spire", "shelves"]);

export function createWoodland(trunkMaterial) {
  const textures = Object.fromEntries(["broadleaf", "needle", "drooping"].map((kind) => [kind, foliageTexture(kind)]));
  const canopy = Object.fromEntries(Object.entries(textures).map(([kind, map]) => [kind,
    new MeshStandardMaterial({ map, alphaTest: 0.33, side: DoubleSide, vertexColors: true, roughness: 0.87 })]));
  for (const material of Object.values(canopy)) {
    material.onBeforeCompile = (shader) => {
      // Light each cluster partly from above to soften shadows between its crossed leaf cards.
      shader.fragmentShader = shader.fragmentShader.replace("#include <normal_fragment_begin>",
        "#include <normal_fragment_begin>\nnormal = normalize(normal * 0.38 + mat3(viewMatrix) * vec3(0.0, 0.62, 0.0));");
    };
  }
  const templates = new Map();

  function template(species, detailed = false) {
    const key = species * 2 + Number(detailed);
    if (templates.has(key)) return templates.get(key);
    const { name, type, height, spread, bark, foliage, limbs, trunk } = treeSpecies[species];
    const random = plantRandom(4961 + species * 5483);
    const wood = plantGeometry();
    const leaves = plantGeometry();
    const conifer = needles.has(type);
    const lean = spread * (random() - 0.5) * 0.57;
    const bend = (y) => lean * (y / height) ** 1.5;
    const trunkSteps = detailed ? 6 : 4;
    for (let index = 0; index < trunkSteps; index++) {
      const a = index / trunkSteps;
      const b = (index + 1) / trunkSteps;
      const radius = (t) => trunk * (1 - t * 0.90) * (1 + 0.48 * Math.max(0, 1 - t * 8));
      wood.stem([bend(a * height), a * height - 0.016, 0], [bend(b * height), b * height + 0.005, 0],
        radius(a), radius(b), bark, detailed ? 9 : 6);
    }
    if (detailed) for (let index = 0; index < 4; index++) {
      const angle = index * 1.57 + 0.25;
      wood.stem([0, 0.14, 0], [Math.cos(angle) * trunk * 2.4, -0.013, Math.sin(angle) * trunk * 2.4],
        trunk * 0.47, trunk * 0.06, bark);
    }

    for (let index = 0; index < limbs; index++) {
      const ratio = (index + 0.4) / limbs;
      const [level, reach, shape] = crown(type, ratio);
      const angle = index * 2.39996 + random() * 0.46;
      const y = level * height;
      const radius = spread * reach * (0.74 + random() * 0.25);
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const twigY = y + (conifer ? -0.08 : 0.16) + random() * 0.12;
      const forkY = y - (type === "weeping" ? 0.29 : 0.19);
      const root = [bend(forkY), forkY, 0];
      const joint = [x * 0.58 + bend(y), y + 0.04, z * 0.58];
      const tip = [x + bend(y), twigY, z];
      wood.stem(root, detailed ? joint : tip, trunk * (0.36 + 0.10 * reach), trunk * 0.09, bark, detailed ? 6 : 4);
      if (detailed) wood.stem(joint, tip, trunk * 0.15, trunk * 0.035, bark, 5);
      const width = (0.42 + spread * 0.55) * (conifer ? 0.37 + 0.67 * reach : 0.83 + 0.25 * reach);
      const shade = 0.68 + random() * 0.27 + ratio * 0.13;
      const leafY = Math.min(height, twigY) - (type === "weeping" ? 0.26 : 0);
      const tilt = type === "weeping" ? 0.18 : conifer ? 0.62 : 0.48;
      for (let card = 0; card < (detailed ? 3 : 2); card++) {
        leaves.card(tip[0], leafY, tip[2], width, width * shape, angle + card * 1.15, tilt, foliage, shade);
      }
      if (detailed || index % 3 === 0) {
        leaves.card(joint[0], y + 0.08, joint[2], width * 0.92, width * Math.min(0.83, shape),
          angle + 0.6, 1.02, foliage, shade * 0.92);
      }
    }
    leaves.card(bend(height), height - 0.13, 0, spread * 0.82, 0.51, 0.67, 0.35, foliage, 1.05);
    leaves.card(bend(height), height - 0.13, 0, spread * 0.82, 0.51, 2.16, 0.38, foliage, 1.04);

    const group = createModelGroup("Tree");
    group.userData.species = name;
    for (const [shape, material] of [[wood, trunkMaterial], [leaves, canopy[conifer ? "needle" : type === "weeping" ? "drooping" : "broadleaf"]]]) {
      const part = new Mesh(shape.build(), material);
      part.castShadow = detailed;
      part.receiveShadow = true;
      group.add(part);
    }
    templates.set(key, group);
    return group;
  }

  return {
    template,
    canopy,
    dispose() {
      for (const model of templates.values()) for (const part of model.children) part.geometry.dispose();
      for (const material of Object.values(canopy)) material.dispose();
      for (const texture of Object.values(textures)) texture.dispose();
    },
  };
}

export function treeAt(index, z, riverDistance) {
  if (Math.abs(z) < 9 && riverDistance > 1.15 && riverDistance < 3.4 && index % 4 !== 0) {
    return index % 3 === 0 ? 8 : 7;
  }
  return (index * 7 + Math.floor(index / 31)) % treeSpecies.length;
}
