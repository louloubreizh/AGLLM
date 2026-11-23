import { Scene, Vector2, WebGLRenderer } from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { OutlinePass } from "three/addons/postprocessing/OutlinePass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { createVillageCamera } from "./camera/village-camera.js";
import { createScenePicker } from "./camera/selection.js";
import { createTrails } from "./models/infrastructure/trail.js";
import { backgroundColor, createLighting } from "./lighting.js";
import { createRenderResources } from "./render-resources.js";
import { createVillageBuildings } from "./village/buildings.js";
import { planVillage } from "./village/layout.js";
import { createVillageResidents } from "./village/residents.js";
import { createTerrain } from "./village/terrain.js";

export function createVillageScene(canvas) {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;

  const scene = new Scene();
  const resources = createRenderResources(backgroundColor);
  const lighting = createLighting(scene, resources.materials);
  const buildings = createVillageBuildings(resources);
  const residents = createVillageResidents(resources);
  const terrain = createTerrain(resources);
  const trails = createTrails(resources.materials.trail);
  const camera = createVillageCamera(canvas, renderer, buildings.instances);
  const select = createScenePicker(camera.camera, buildings.instances, terrain.group, trails.group, residents.group);
  scene.add(terrain.group, trails.group, buildings.group, residents.group);

  let paused = false;
  let frame;
  let hovered;
  let composer;
  let outline;
  let output;
  let width;
  let height;

  function update(snapshot) {
    lighting.update(snapshot);
    paused = snapshot?.paused ?? false;
    const plan = planVillage(snapshot?.buildings ?? [], snapshot?.population ?? 0);
    terrain.update(plan);
    trails.update(plan.network);
    buildings.update(plan.plots);
    residents.update(plan.residents, plan.network);
  }

  function draw(time) {
    frame = requestAnimationFrame(draw);
    residents.animate(time, paused);
    resources.animateWater(time);
    camera.update(time);
    const model = hovered?.resolve();
    if (!model) {
      renderer.render(scene, camera.camera);
      return;
    }
    if (!composer) {
      composer = new EffectComposer(renderer);
      outline = new OutlinePass(new Vector2(canvas.clientWidth, canvas.clientHeight), scene, camera.camera);
      outline.visibleEdgeColor.setHex(0xffde8d);
      outline.hiddenEdgeColor.setHex(0x000000);
      outline.edgeStrength = 4;
      output = new OutputPass();
      composer.addPass(new RenderPass(scene, camera.camera));
      composer.addPass(outline);
      composer.addPass(output);
    }
    if (width !== canvas.clientWidth || height !== canvas.clientHeight) {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      composer.setSize(width, height);
    }
    outline.selectedObjects = [model];
    composer.render();
  }

  update(null);
  frame = requestAnimationFrame(draw);
  return {
    update,
    zoom: camera.zoom,
    pan: camera.pan,
    inspect: camera.inspect,
    hover(point) {
      const target = point ? select(point.x, point.y) : null;
      hovered = target?.type ? target : null;
      return hovered?.label;
    },
    pick: (x, y) => camera.preview(select(x, y)),
    endInspection: camera.endInspection,
    zoomIn: camera.zoomIn,
    zoomOut: camera.zoomOut,
    rotate: camera.rotate,
    reset: camera.reset,
    dispose() {
      cancelAnimationFrame(frame);
      camera.dispose();
      buildings.dispose();
      trails.dispose();
      resources.dispose();
      lighting.dispose();
      outline?.dispose();
      output?.dispose();
      composer?.dispose();
      renderer.dispose();
    },
  };
}
