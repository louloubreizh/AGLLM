import { MeshStandardMaterial } from "three";
import { createSurfaceTexture } from "../landscape/surface-texture.js";

export function createBuildingMaterials(seasonal) {
  const grain = createSurfaceTexture(true);
  const palette = {
    limestone: 0xd2bf9d, sandstone: 0xb99a6a, basalt: 0x485456, granite: 0x7b8588,
    brick: 0xa45940, stucco: 0xdbc4a1, slate: 0x415461, terracotta: 0xb26042,
    cedar: 0x8c603d, oak: 0xb28a58, walnut: 0x493027, straw: 0xc49d5c,
    moss: 0x6a7945, clay: 0x936a49, earth: 0x604334, shale: 0x616361,
    canvas: 0xe5cfaa, rustCloth: 0x9d473e, tealCloth: 0x397671, ochreCloth: 0xcf9446,
    ink: 0x20272c, iron: 0x45555c, steel: 0x839a9f, copper: 0x9b614a, brass: 0xba9554,
    zinc: 0x648786, porcelain: 0xd4d8ce, glass: 0x526e72, solar: 0x203d5e, water: 0x477f7a,
    warm: 0xedbc77, furnace: 0xff7a25, aqua: 0x70e0cf, violet: 0x9f93e0, green: 0xadd47a,
  };
  const metals = new Set(["iron", "steel", "copper", "brass", "zinc"]);
  const lit = new Set(["warm", "furnace", "aqua", "violet", "green"]);
  const finishes = Object.fromEntries(Object.entries(palette).map(([name, color]) => {
    const metallic = metals.has(name);
    const emissive = lit.has(name);
    const polished = metallic || emissive || ["ink", "glass", "solar", "water", "porcelain"].includes(name);
    return [name, new MeshStandardMaterial({
      name, color, roughness: polished ? 0.39 : 0.86,
      metalness: metallic ? 0.42 : 0,
      ...(emissive ? { emissive: color, emissiveIntensity: name === "furnace" ? 0.75 : 0.27 } : {}),
      ...(!polished ? { map: grain, bumpMap: grain, bumpScale: 0.016 } : {}),
    })];
  }));

  return {
    finishes: { ...finishes, crop: seasonal.crop, foliage: seasonal.buildingLeaves },
    dispose() {
      Object.values(finishes).forEach((material) => material.dispose());
      grain.dispose();
    },
  };
}
