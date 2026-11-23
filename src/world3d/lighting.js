import { AmbientLight, DirectionalLight, Fog, HemisphereLight } from "three";

export const backgroundColor = 0x14251f;

const palettes = {
  spring: { grass: 0x527c45, dark: 0x24483c, leaf: 0x6f9d58, crop: 0xb0c264, water: 0x388a88, light: 0xffe0ac },
  summer: { grass: 0x647b38, dark: 0x29472e, leaf: 0x6a973b, crop: 0xd7b84d, water: 0x428b87, light: 0xffe4ad },
  autumn: { grass: 0x877044, dark: 0x795237, leaf: 0xcb8549, crop: 0xd0a25c, water: 0x3f7f82, light: 0xffd0a3 },
  winter: { grass: 0xa8bcc2, dark: 0x335a60, leaf: 0x69948d, crop: 0x8faeb1, water: 0x5d929a, light: 0xd2e6ff },
};

export function createLighting(scene, materials) {
  scene.fog = new Fog(backgroundColor, 55, 105);
  scene.add(new HemisphereLight(0xdcedde, 0x43503a, 2.2), new AmbientLight(0xffffff, 0.13));
  const sun = new DirectionalLight(0xffe0ac, 2.3);
  sun.position.set(-14, 25, 12);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, near: 1, far: 64 });
  sun.shadow.normalBias = 0.035;
  scene.add(sun);

  let lastPalette;
  return {
    update(snapshot) {
      const palette = palettes[snapshot?.season] || palettes.spring;
      if (palette !== lastPalette) {
        for (const key of ["grass", "water", "dark", "leaf", "crop"]) {
          materials[key].color.setHex(palette[key]);
        }
        materials.groundCover.color.setHex(palette.leaf);
        materials.buildingLeaves.color.setHex(palette.leaf);
        materials.pool.color.copy(materials.water.color).multiplyScalar(0.55);
        sun.color.setHex(palette.light);
        lastPalette = palette;
      }
      sun.intensity = snapshot?.weather === "cold" ? 1.7 : 2.3;
    },
    dispose() {
      sun.shadow.dispose();
    },
  };
}
