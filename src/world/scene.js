import {
  AmbientLight, Box3, BoxGeometry, BufferGeometry, CircleGeometry, ConeGeometry,
  CylinderGeometry, DirectionalLight, Float32BufferAttribute, Fog, Group,
  HemisphereLight, IcosahedronGeometry, Mesh, MeshStandardMaterial, PerspectiveCamera,
  Scene, Sphere, SphereGeometry, Vector3, WebGLRenderer,
} from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { chooseObservation, planVillage } from "./layout.js";

const palettes = {
  spring: { grass: 0x527c45, dark: 0x24483c, leaf: 0x6f9d58, crop: 0xb0c264, water: 0x388a88, light: 0xffe0ac },
  summer: { grass: 0x647b38, dark: 0x29472e, leaf: 0x6a973b, crop: 0xd7b84d, water: 0x428b87, light: 0xffe4ad },
  autumn: { grass: 0x877044, dark: 0x795237, leaf: 0xcb8549, crop: 0xd0a25c, water: 0x3f7f82, light: 0xffd0a3 },
  winter: { grass: 0xa8bcc2, dark: 0x335a60, leaf: 0x69948d, crop: 0x8faeb1, water: 0x5d929a, light: 0xd2e6ff },
};

const terraceRadius = 18.6;
const segmentCount = 44;
const riverX = (z) => -13.8 + 1.25 * Math.sin(z * 0.23);
const terrainY = (x, z) => 0.045 * Math.sin(x * 0.58) * Math.cos(z * 0.49);
const edgeRatio = (angle) => 1 + 0.08 * Math.cos(5 * angle) + 0.04 * Math.sin(3 * angle + 0.7);

function islandGeometry(cliff) {
  const positions = [];
  const colors = [];
  const rings = cliff ? [[terraceRadius, 0], [19, -0.7], [17.6, -2.7]] : [[0, 0], [7, 0], [13, 0], [terraceRadius, 0]];
  function point([radius, height], index) {
    const angle = (index / segmentCount) * 2 * Math.PI;
    const distance = radius * edgeRatio(angle);
    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;
    return [x, height + terrainY(x, z), z];
  }
  function triangle(a, b, c, shade) {
    positions.push(...a, ...b, ...c);
    colors.push(shade, shade, shade, shade, shade, shade, shade, shade, shade);
  }
  for (let ring = 0; ring < rings.length - 1; ring += 1) {
    for (let index = 0; index < segmentCount; index += 1) {
      const a = point(rings[ring], index);
      const b = point(rings[ring], index + 1);
      const c = point(rings[ring + 1], index);
      const d = point(rings[ring + 1], index + 1);
      const shade = 0.73 + ((index * 17 + ring * 13) % 23) / 95;
      if (cliff) {
        triangle(a, b, c, shade);
        triangle(b, d, c, shade * 0.83);
      } else {
        if (ring) {
          triangle(a, b, d, shade);
        }
        triangle(a, d, c, shade * 1.02);
      }
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function riverGeometry() {
  const positions = [];
  for (let i = 0; i <= 38; i += 1) {
    const z = (i - 19) * 0.48;
    const x = riverX(z);
    const width = Math.max(0.025, Math.min(0.82, (19 - Math.abs(i - 19)) * 0.29));
    positions.push(x - width, 0.082, z, x + width, 0.082, z);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  const indices = [];
  for (let i = 0; i < 76; i += 2) {
    indices.push(i, i + 2, i + 1, i + 1, i + 2, i + 3);
  }
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function createVillageScene(canvas) {
  const renderer = new WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setClearColor(0x14251f);
  renderer.shadowMap.enabled = true;

  const scene = new Scene();
  scene.fog = new Fog(0x14251f, 55, 105);
  const camera = new PerspectiveCamera(34, 1, 0.1, 150);
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, -0.7, 0);
  controls.minDistance = 13;
  controls.maxDistance = 85;
  controls.maxPolarAngle = Math.PI * 0.45;
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.1;
  camera.position.set(32, 26, 37);
  controls.update();
  controls.saveState();

  scene.add(new HemisphereLight(0xdcedde, 0x43503a, 2.2), new AmbientLight(0xffffff, 0.13));
  const sun = new DirectionalLight(0xffe0ac, 2.3);
  sun.position.set(-14, 25, 12);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, near: 1, far: 64 });
  sun.shadow.normalBias = 0.035;
  scene.add(sun);

  const geometries = {
    box: new BoxGeometry(), cone: new ConeGeometry(0.5, 1, 7),
    roof: new CylinderGeometry(0, 0.71, 1, 4, 1, false, Math.PI / 4),
    column: new CylinderGeometry(0.5, 0.5, 1, 9), cap: new SphereGeometry(0.5, 8, 5),
    rock: new IcosahedronGeometry(0.5, 0), leaf: new IcosahedronGeometry(0.5, 1),
    circle: new CircleGeometry(1, 36),
    land: islandGeometry(false), cliff: islandGeometry(true), river: riverGeometry(),
  };
  const material = (color, options) => new MeshStandardMaterial({ color, roughness: 0.91, flatShading: true, ...options });
  const materials = {
    grass: material(0x527c45, { vertexColors: true }), cliff: material(0x53664e, { vertexColors: true }),
    water: material(0x388a88, { roughness: 0.43 }), pool: material(0x255b59, { roughness: 0.53 }),
    dark: material(0x24483c), leaf: material(0x6f9d58), crop: material(0xb0c264),
    trunk: material(0x684e3e), trail: material(0xad986d), soil: material(0x625343),
    paver: material(0x8a947d), wall: material(0xd4b38a), timber: material(0x483a32),
    roof: material(0xa66a47), stone: material(0x82938e), metal: material(0x477779),
    light: material(0xffd188, { emissive: 0xe5a957, emissiveIntensity: 0.2 }),
    cats: [material(0xd9bc93), material(0xd89462), material(0x687677), material(0xf3d8b8)],
    eye: material(0x202b29),
  };

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

  const terrain = new Group();
  const village = new Group();
  const residents = new Group();
  scene.add(terrain, village, residents);
  part(terrain, "land", materials.grass, 0, 0, 0, 1, 1, 1, 0, false);
  part(terrain, "cliff", materials.cliff, 0, 0, 0, 1, 1, 1, 0, false);
  part(terrain, "circle", materials.pool, 0, -2.45, 0, 24, 20.8, 1, 0, false).rotation.x = -Math.PI / 2;
  part(terrain, "river", materials.water, 0, 0, 0, 1, 1, 1, 0, false);

  function trail(group, from, to, width, finish) {
    const dx = to.x - from.x;
    const dz = to.z - from.z;
    part(group, "box", finish, (from.x + to.x) / 2, 0.075, (from.z + to.z) / 2,
      width, 0.045, Math.hypot(dx, dz) + width / 2, Math.atan2(dx, dz), false);
  }
  trail(terrain, { x: -10, z: 0 }, { x: 8, z: 0 }, 0.55, materials.trail);
  trail(terrain, { x: 0, z: -8.7 }, { x: 0, z: 12.2 }, 0.55, materials.trail);
  part(terrain, "column", materials.paver, 0, 0.16, 0, 2.45, 0.2, 2.45);
  part(terrain, "column", materials.stone, 0, 0.32, 0, 0.71, 0.22, 0.71);
  part(terrain, "rock", materials.light, 0, 0.58, 0, 0.35, 0.46, 0.35);

  for (let i = 0; i < 9; i += 1) {
    part(terrain, "box", materials.trunk, riverX(2.8) + (i - 4) * 0.29, 0.19, 2.8,
      0.27, 0.19, 0.95, 0, true);
  }
  for (let i = 0; i < 94; i += 1) {
    const angle = i * 2.39996323;
    const radius = (13.3 + ((i * 17) % 43) / 11) * edgeRatio(angle);
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    if (Math.abs(riverX(z) - x) < 1.15 || (Math.abs(x) < 12.2 && Math.abs(z) < 12.2)) {
      continue;
    }
    const size = 0.66 + (i % 9) * 0.075;
    if (i % 6 === 0) {
      part(terrain, "rock", materials.stone, x, 0.14, z, size, size * 0.63, size * 0.82, angle);
      continue;
    }
    part(terrain, "column", materials.trunk, x, size * 0.37, z, 0.14, size * 0.7, 0.14);
    const canopy = i % 3 === 0 ? "cone" : "leaf";
    part(terrain, canopy, i % 4 ? materials.dark : materials.leaf, x, size * 1.03, z,
      size * 1.2, size * 1.55, size * 1.2, angle);
    if (canopy === "cone") {
      part(terrain, "cone", materials.leaf, x, size * 1.48, z, size * 0.82, size, size * 0.82, angle);
    }
  }

  function cropPlot(group) {
    part(group, "box", materials.soil, 0, 0.1, 0, 1.08, 0.16, 0.9);
    for (let row = -1; row <= 1; row += 1) {
      part(group, "box", materials.crop, row * 0.29, 0.2, 0, 0.11, 0.12, 0.71);
    }
  }

  function cabin(group, tower) {
    const walls = tower ? materials.stone : materials.wall;
    const height = tower ? 1.2 : 0.61;
    part(group, "box", materials.paver, 0, 0.11, 0, 0.91, 0.14, 0.89);
    part(group, "box", walls, 0, 0.17 + height / 2, 0, 0.78, height, 0.75);
    part(group, "roof", tower ? materials.metal : materials.roof, 0, 0.36 + height, 0, 0.96, 0.41, 0.94);
    part(group, "box", materials.timber, 0, 0.32, 0.382, 0.23, 0.36, 0.04);
    part(group, "box", materials.light, 0.397, 0.51 + height * 0.15, 0.04, 0.04, 0.19, 0.18);
  }

  function workshop(group, stage) {
    part(group, "box", materials.stone, 0, 0.35, 0, 0.99, 0.63, 0.75);
    part(group, "box", materials.metal, 0, 0.69, 0, 1.06, 0.08, 0.81);
    part(group, "column", materials.timber, 0.27, 0.81 + stage * 0.09, -0.16, 0.18, 0.91, 0.18);
    part(group, "box", materials.light, -0.22, 0.47, 0.38, 0.18, 0.18, 0.04);
  }

  function buildingModel(plot, index) {
    const building = new Group();
    const offsets = [[0, 0], [-0.58, -0.52], [0.56, -0.57]];
    const [x, z] = offsets[index];
    building.position.set(plot.x + x, 0.03, plot.z + z);
    building.scale.setScalar(plot.models > 1 ? 0.8 : 1.15);
    if (plot.id === "field" || plot.id === "pasture" && plot.stage === 0) {
      cropPlot(building);
    } else if (plot.stage > 0 || ["mine", "smelter", "lumberMill", "factory", "oilWell", "calciner"].includes(plot.id)) {
      workshop(building, plot.stage);
    } else {
      cabin(building, ["library", "academy", "temple", "ziggurat", "observatory", "mansion"].includes(plot.id));
    }
    return building;
  }

  function createResident(index) {
    const cat = new Group();
    const coat = materials.cats[index % materials.cats.length];
    part(cat, "cap", coat, 0, 0.16, 0, 0.35, 0.29, 0.49);
    part(cat, "leaf", coat, 0, 0.26, 0.22, 0.31, 0.29, 0.31);
    for (const side of [-1, 1]) {
      part(cat, "cone", coat, side * 0.09, 0.41, 0.23, 0.11, 0.19, 0.11);
      part(cat, "cap", materials.eye, side * 0.062, 0.29, 0.35, 0.043, 0.044, 0.045);
    }
    part(cat, "column", coat, 0, 0.2, -0.27, 0.069, 0.24, 0.069).rotation.x = -0.8;
    return cat;
  }

  let buildingsKey;
  let population;
  let lastPalette;
  let paused = false;
  let frame;
  let clock = 0;
  let previousTime = 0;
  const axis = new Vector3();
  const instances = new Map();
  const lastObserved = new Map();
  const inspectionDirection = new Vector3(1, 0.74, 1.25).normalize();
  let observation = null;

  function update(snapshot) {
    const palette = palettes[snapshot?.season] || palettes.spring;
    if (palette !== lastPalette) {
      for (const key of ["grass", "water", "dark", "leaf", "crop"]) {
        materials[key].color.setHex(palette[key]);
      }
      sun.color.setHex(palette.light);
      lastPalette = palette;
    }
    sun.intensity = snapshot?.weather === "cold" ? 1.7 : 2.3;
    paused = snapshot?.paused ?? false;
    const plan = planVillage(snapshot?.buildings ?? [], snapshot?.population ?? 0);
    const nextKey = JSON.stringify(plan.plots.map(({ id, stage, models, x, z }) => [id, stage, models, x, z]));
    if (nextKey !== buildingsKey) {
      village.clear();
      instances.clear();
      for (const plot of plan.plots) {
        part(village, "column", materials.paver, plot.x, 0.075, plot.z, 1.59, 0.09, 1.59, 0, false);
        const models = Array.from({ length: plot.models }, (_, index) => buildingModel(plot, index));
        instances.set(plot.id, models);
        village.add(...models);
      }
      buildingsKey = nextKey;
    }
    if (population !== plan.residents) {
      residents.clear();
      for (let i = 0; i < plan.residents; i += 1) {
        residents.add(createResident(i));
      }
      population = plan.residents;
    }
  }

  let cameraMode = false;
  function resize() {
    const width = Math.max(1, canvas.clientWidth);
    const height = Math.max(1, canvas.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    const verticalFov = 2 * Math.atan(Math.tan(Math.PI / 8) / camera.aspect) * 180 / Math.PI;
    camera.fov = Math.min(85, Math.max(38, verticalFov));
    if (cameraMode) {
      camera.clearViewOffset();
    } else {
      const offset = width <= 1050 ? 0.19 : 0.13;
      camera.setViewOffset(width, height, 0, height * offset, width, height);
    }
  }

  function draw(time) {
    frame = requestAnimationFrame(draw);
    if (!paused && previousTime) {
      clock += Math.min(50, time - previousTime) / 1000;
    }
    previousTime = time;
    residents.children.forEach((cat, index) => {
      const angle = index * 2.39996323 + clock * (0.17 + (index % 3) * 0.04);
      const radius = 1.8 + (index % 7) * 0.69;
      cat.position.set(Math.cos(angle) * radius, 0.07, Math.sin(angle) * radius);
      cat.rotation.y = -angle;
    });
    controls.update();
    renderer.render(scene, camera);
  }

  function zoom(factor) {
    axis.subVectors(camera.position, controls.target);
    axis.setLength(Math.min(controls.maxDistance, Math.max(controls.minDistance, axis.length() * factor)));
    camera.position.copy(controls.target).add(axis);
    controls.update();
  }

  function moveCamera(position, target, minDistance) {
    controls.enableDamping = false;
    controls.update();
    controls.minDistance = minDistance;
    controls.target.copy(target);
    camera.position.copy(position);
    controls.update();
    controls.enableDamping = true;
  }

  function frameBuilding(model) {
    const { center, radius } = new Box3().setFromObject(model).getBoundingSphere(new Sphere());
    const verticalAngle = camera.fov * Math.PI / 360;
    const horizontalAngle = Math.atan(Math.tan(verticalAngle) * camera.aspect);
    const distance = Math.max(1, 1.07 * radius / Math.sin(Math.min(verticalAngle, horizontalAngle)));
    moveCamera(center.clone().addScaledVector(inspectionDirection, distance), center, distance * 0.75);
  }

  function inspect(type) {
    const models = instances.get(type);
    if (!models?.length) return false;

    const index = chooseObservation(models.length, lastObserved.get(type));
    lastObserved.set(type, index);
    observation = {
      type, index,
      position: camera.position.clone(),
      target: controls.target.clone(),
      minDistance: controls.minDistance,
    };
    frameBuilding(models[index]);
    return true;
  }

  function endInspection() {
    if (!observation) return;
    const { position, target, minDistance } = observation;
    observation = null;
    moveCamera(position, target, minDistance);
  }

  update(null);
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();
  frame = requestAnimationFrame(draw);
  return {
    update,
    zoom,
    inspect,
    endInspection,
    setCameraMode(active) {
      cameraMode = active;
      resize();
    },
    zoomIn: () => zoom(0.82),
    zoomOut: () => zoom(1 / 0.82),
    rotate: (side, tilt) => {
      controls.rotateLeft(side);
      controls.rotateUp(tilt);
    },
    reset() {
      const subject = observation && instances.get(observation.type)?.[observation.index];
      if (subject) frameBuilding(subject);
      else if (observation) endInspection();
      else controls.reset();
    },
    dispose() {
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      Object.values(geometries).forEach((geometry) => geometry.dispose());
      Object.values(materials).flat().forEach((finish) => finish.dispose());
      sun.shadow.dispose();
      renderer.dispose();
    },
  };
}
