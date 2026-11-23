import {
  BoxGeometry, ConeGeometry, CylinderGeometry, DoubleSide, IcosahedronGeometry,
  Mesh, MeshStandardMaterial, SphereGeometry,
} from "three";
import { createGroundCover, groundCoverGeometry } from "./models/landscape/ground-cover.js";
import { islandGeometry } from "./models/landscape/island-geometry.js";
import { lakeGeometry } from "./models/landscape/lake.js";
import { riverGeometry } from "./models/landscape/river.js";
import { rockGeometry } from "./models/landscape/rock.js";
import { createSurfaceTexture } from "./models/landscape/surface-texture.js";
import { createWaterMaterial } from "./models/landscape/water-material.js";

export function createRenderResources(background) {
  const groundTexture = createSurfaceTexture();
  const stoneTexture = createSurfaceTexture(true);
  const waterTime = { value: 0 };
  const geometries = {
    box: new BoxGeometry(), cone: new ConeGeometry(0.5, 1, 7),
    column: new CylinderGeometry(0.5, 0.5, 1, 9), cap: new SphereGeometry(0.5, 8, 5),
    rock: new IcosahedronGeometry(0.5, 0), leaf: new IcosahedronGeometry(0.5, 1),
    land: islandGeometry(false), cliff: islandGeometry(true),
    lake: lakeGeometry(), river: riverGeometry(), boulder: rockGeometry(), groundCover: groundCoverGeometry(),
  };
  const material = (color, options) => new MeshStandardMaterial({ color, roughness: 0.91, flatShading: true, ...options });
  const materials = {
    grass: material(0x527c45, {
      vertexColors: true, flatShading: false, map: groundTexture, bumpMap: groundTexture, bumpScale: 0.088,
    }),
    cliff: material(0x80766a, {
      vertexColors: true, flatShading: false, map: stoneTexture, bumpMap: stoneTexture, bumpScale: 0.24,
    }),
    boulder: material(0x989285, { flatShading: false, map: stoneTexture, bumpMap: stoneTexture, bumpScale: 0.09 }),
    groundCover: material(0x6f9d58, { side: DoubleSide }),
    water: createWaterMaterial(0x388a88, waterTime, { river: true }),
    pool: createWaterMaterial(0x255b59, waterTime, { background }),
    dark: material(0x24483c), leaf: material(0x6f9d58),
    crop: material(0xb0c264, { flatShading: false, bumpMap: groundTexture, bumpScale: 0.015 }),
    buildingLeaves: material(0x6f9d58, { flatShading: false }),
    trunk: material(0x684e3e),
    trail: material(0xb29970, { vertexColors: true, flatShading: false, map: groundTexture, bumpMap: groundTexture, bumpScale: 0.025 }),
    paver: material(0x8a947d), stone: material(0x82938e),
    light: material(0xffd188, { emissive: 0xe5a957, emissiveIntensity: 0.2 }),
    cats: [material(0xd9bc93), material(0xd89462), material(0x687677), material(0xf3d8b8)],
    eye: material(0x202b29),
  };
  const groundCover = createGroundCover(geometries.groundCover, materials.groundCover);

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
    groundCover: groundCover.mesh,
    updateGroundCover: groundCover.update,
    animateWater(time) {
      waterTime.value = time / 1000;
    },
    dispose() {
      groundCover.mesh.dispose();
      Object.values(geometries).forEach((geometry) => geometry.dispose());
      Object.values(materials).flat().forEach((finish) => finish.dispose());
      groundTexture.dispose();
      stoneTexture.dispose();
    },
  };
}
