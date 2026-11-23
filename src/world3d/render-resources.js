import {
  BoxGeometry, ConeGeometry, CylinderGeometry, DoubleSide, IcosahedronGeometry,
  Mesh, MeshStandardMaterial, SphereGeometry,
} from "three";
import { createGroundCover } from "./models/landscape/ground-cover.js";
import { surfaceTexture, wingMembrane } from "./models/fauna/rig.js";
import { islandGeometry } from "./models/landscape/island-geometry.js";
import { lakeGeometry } from "./models/landscape/lake.js";
import { riverGeometry } from "./models/landscape/river.js";
import { rockGeometry } from "./models/landscape/rock.js";
import { createSurfaceTexture } from "./models/landscape/surface-texture.js";
import { createWaterMaterial } from "./models/landscape/water-material.js";

export function createRenderResources(background) {
  const groundTexture = createSurfaceTexture();
  const stoneTexture = createSurfaceTexture("stone");
  const cliffTexture = createSurfaceTexture("cliff");
  const trailTexture = createSurfaceTexture("trail");
  const barkTexture = createSurfaceTexture("bark");
  const fur = surfaceTexture("fur");
  const tabby = surfaceTexture("tabby");
  const plumage = surfaceTexture("plumage");
  const scales = surfaceTexture("scales");
  const waterTime = { value: 0 };
  const geometries = {
    box: new BoxGeometry(), cone: new ConeGeometry(0.5, 1, 7),
    column: new CylinderGeometry(0.5, 0.5, 1, 9), cap: new SphereGeometry(0.5, 8, 5),
    rock: new IcosahedronGeometry(0.5, 0), leaf: new IcosahedronGeometry(0.5, 1),
    land: islandGeometry(false), cliff: islandGeometry(true),
    lake: lakeGeometry(), river: riverGeometry(), boulder: rockGeometry(),
    animalOval: new SphereGeometry(0.5, 14, 10),
    animalWingLeft: wingMembrane(-1), animalWingRight: wingMembrane(1),
  };
  const material = (color, options) => new MeshStandardMaterial({ color, roughness: 0.91, flatShading: true, ...options });
  const animalFinish = (color, settings) => material(color, { flatShading: false, ...settings });
  const patterned = (color, texture) => animalFinish(color, { map: texture, bumpMap: texture, bumpScale: 0.006 });
  const variants = (texture, ...colors) => colors.map((color) => patterned(color, texture));
  const tint = (texture) => {
    const finish = patterned(0xffffff, texture);
    finish.userData.residentTint = true;
    return finish;
  };
  const materials = {
    grass: material(0x527c45, {
      vertexColors: true, flatShading: false, map: groundTexture, bumpMap: groundTexture, bumpScale: 0.029,
    }),
    cliff: material(0x807b72, {
      vertexColors: true, flatShading: false, map: cliffTexture, bumpMap: cliffTexture, bumpScale: 0.18,
    }),
    boulder: material(0x989285, { flatShading: false, map: stoneTexture, bumpMap: stoneTexture, bumpScale: 0.09 }),
    groundCover: material(0xffffff, { side: DoubleSide, flatShading: false, vertexColors: true }),
    water: createWaterMaterial(0x388a88, waterTime, { river: true }),
    pool: createWaterMaterial(0x255b59, waterTime, { background }),
    dark: material(0x24483c), leaf: material(0x6f9d58),
    crop: material(0xb0c264, { side: DoubleSide, flatShading: false, bumpMap: groundTexture, bumpScale: 0.002 }),
    buildingLeaves: material(0x6f9d58, { side: DoubleSide, flatShading: false }),
    trunk: material(0xffffff, { vertexColors: true, flatShading: false, map: barkTexture, bumpMap: barkTexture, bumpScale: 0.017 }),
    bridgeWood: material(0x684e3e),
    trail: material(0xbda77e, { vertexColors: true, flatShading: false, map: trailTexture, bumpMap: trailTexture, bumpScale: 0.024 }),
    paver: material(0x8a947d), stone: material(0x82938e),
    light: material(0xffd188, { emissive: 0xe5a957, emissiveIntensity: 0.2 }),
    catFur: variants(tabby, 0xd8ae79, 0xb77b51, 0x7c8989, 0x6e615d),
    dogFur: variants(fur, 0xc48352, 0xb49b81, 0x975d4b, 0xdcaa6c),
    rabbitFur: variants(fur, 0xb69a7a, 0xd1b296, 0x8d8179, 0xc4c8bd),
    raptorPlume: variants(plumage, 0xa06b4c, 0x72815e, 0x9b7b69, 0x67786b),
    drakeScales: variants(scales, 0x476d99, 0x586e9c, 0x538c8b, 0x65528c),
    catFurTint: tint(tabby),
    dogFurTint: tint(fur),
    rabbitFurTint: tint(fur),
    raptorPlumeTint: tint(plumage),
    drakeScalesTint: tint(scales),
    animalCream: patterned(0xf1dfc4, fur),
    animalUmber: patterned(0x51392e, fur),
    animalRose: animalFinish(0xb57376, { roughness: 0.7 }),
    animalClay: patterned(0xa77b58, scales),
    animalCopper: patterned(0xb86546, plumage),
    animalIce: animalFinish(0xa8cad9, { roughness: 0.55 }),
    animalMembrane: animalFinish(0x68799f, { side: DoubleSide, roughness: 0.58 }),
    animalGlow: animalFinish(0x99f9e3, { emissive: 0x409b8b, emissiveIntensity: 0.65 }),
    animalJade: animalFinish(0xadcc79, { roughness: 0.24 }),
    animalAmber: animalFinish(0xdba466, { roughness: 0.26 }),
    animalGlint: animalFinish(0xfff9e6),
    eye: animalFinish(0x181817, { roughness: 0.26 }),
  };
  const groundCover = createGroundCover(materials.groundCover);

  function part(group, geometry, finish, x, y, z, width, height, depth, rotation = 0, shadow = true) {
    const mesh = new Mesh(geometries[geometry], finish);
    mesh.position.set(x, y, z);
    mesh.scale.set(width, height, depth);
    mesh.rotation.y = rotation;
    mesh.castShadow = shadow;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  return {
    part,
    materials,
    groundCover: groundCover.group,
    updateGroundCover: groundCover.update,
    animateWater(time) {
      waterTime.value = time / 1000;
    },
    dispose() {
      groundCover.dispose();
      Object.values(geometries).forEach((geometry) => geometry.dispose());
      Object.values(materials).flat().forEach((finish) => finish.dispose());
      groundTexture.dispose();
      stoneTexture.dispose();
      cliffTexture.dispose();
      trailTexture.dispose();
      barkTexture.dispose();
      fur.dispose();
      tabby.dispose();
      plumage.dispose();
      scales.dispose();
    },
  };
}
