import { AmbientLight, Color, DirectionalLight, Fog, HemisphereLight, MathUtils } from "three";

export const backgroundColor = 0x14251f;

const palettes = {
  spring: { grass: 0x527c45, dark: 0x24483c, leaf: 0x6f9d58, crop: 0xb0c264, water: 0x388a88, light: 0xffe0ac },
  summer: { grass: 0x647b38, dark: 0x29472e, leaf: 0x6a973b, crop: 0xd7b84d, water: 0x428b87, light: 0xffe4ad },
  autumn: { grass: 0x877044, dark: 0x795237, leaf: 0xcb8549, crop: 0xd0a25c, water: 0x3f7f82, light: 0xffd0a3 },
  winter: { grass: 0xa8bcc2, dark: 0x335a60, leaf: 0x69948d, crop: 0x8faeb1, water: 0x5d929a, light: 0xd2e6ff },
};

const duration = 2600;

export function createLighting(scene, materials, canopy) {
  scene.fog = new Fog(backgroundColor, 90, 175);
  scene.add(new HemisphereLight(0xdcedde, 0x43503a, 2.2), new AmbientLight(0xffffff, 0.13));
  const sun = new DirectionalLight(0xffe0ac, 2.3);
  sun.position.set(-14, 25, 12);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -31, right: 31, top: 31, bottom: -31, near: 1, far: 68 });
  sun.shadow.normalBias = 0.035;
  scene.add(sun);

  const colors = ["grass", "water", "dark", "leaf", "crop", "groundCover", "buildingLeaves"]
    .map((name) => materials[name].color);
  colors.push(canopy.broadleaf.color, canopy.drooping.color, canopy.needle.color, sun.color, scene.fog.color);
  const startColors = colors.map(() => new Color());
  const targetColors = colors.map(() => new Color());
  let previous;
  let transition;

  function animate(time) {
    if (!transition) return;
    const progress = MathUtils.smoothstep(time, transition.start, transition.end);
    colors.forEach((color, index) => color.lerpColors(startColors[index], targetColors[index], progress));
    materials.pool.color.copy(materials.water.color).multiplyScalar(0.55);
    sun.intensity = MathUtils.lerp(transition.intensity, transition.targetIntensity, progress);
    scene.fog.near = MathUtils.lerp(transition.fogNear, transition.targetFogNear, progress);
    if (progress === 1) transition = null;
  }

  return {
    animate,
    update({ season, weather }, now, reducedMotion = false) {
      const key = `${season}/${weather}`;
      if (key === previous) {
        if (reducedMotion && transition) animate(transition.end);
        return;
      }
      const first = previous === undefined;
      previous = key;
      const palette = palettes[season] ?? palettes.spring;
      const cold = weather === "cold";
      const winter = season === "winter";
      const leaf = { autumn: 0xe5b379, winter: 0xa1b7b2, summer: 0xe9e9cb }[season] ?? 0xffffff;
      const ground = { summer: 0xece5c6, autumn: 0xc8ae85, winter: 0xaebfc3 }[season] ?? 0xffffff;
      const fog = winter ? 0x546e77 : cold ? 0x354b47 : backgroundColor;
      const shades = [palette.grass, palette.water, palette.dark, palette.leaf, palette.crop, ground,
        palette.leaf, leaf, leaf, winter ? 0xc0d4d5 : 0xffffff, palette.light, fog];
      colors.forEach((color, index) => {
        startColors[index].copy(color);
        targetColors[index].setHex(shades[index]);
      });
      transition = {
        start: now, end: now + duration,
        intensity: sun.intensity, targetIntensity: cold ? 1.7 : weather === "warm" ? 2.5 : 2.3,
        fogNear: scene.fog.near, targetFogNear: winter ? 38 : cold ? 60 : 90,
      };
      if (first || reducedMotion) animate(transition.end);
    },
    dispose() {
      sun.shadow.dispose();
    },
  };
}
