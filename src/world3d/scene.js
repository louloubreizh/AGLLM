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
import { createLayoutScheduler } from "./village/layout-scheduler.js";
import { createVillageResidents } from "./village/residents.js";
import { roadsForPlots } from "./village/road-network.js";
import { createTerrain } from "./village/terrain.js";

export function createVillageScene(canvas, onRenderState = () => {}) {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.autoUpdate = false;

  const scene = new Scene();
  const resources = createRenderResources(backgroundColor);
  const buildings = createVillageBuildings(resources);
  const residents = createVillageResidents(resources);
  const terrain = createTerrain(resources);
  const lighting = createLighting(scene, resources.materials, terrain.canopy);
  const reducedMotion = canvas.ownerDocument.defaultView.matchMedia("(prefers-reduced-motion: reduce)");
  const trails = createTrails(resources.materials.trail);
  const camera = createVillageCamera(canvas, renderer, buildings.instances);
  const select = createScenePicker(camera.camera, buildings, terrain.group, trails.group, residents.group);
  scene.add(terrain.group, trails.group, buildings.group, residents.display);

  let paused = false;
  let frame;
  let hovered;
  let composer;
  let outline;
  let output;
  let width;
  let height;
  let planKey;
  let plan;
  let rosterKey;
  let latest;
  let worker;
  let workerBusy = false;
  let requestedKey;
  let renderState;
  function report(state) {
    if (state === renderState) return;
    renderState = state;
    onRenderState(state);
  }
  const restored = () => { renderState = undefined; };
  canvas.addEventListener("webglcontextrestored", restored);
  const layout = createLayoutScheduler((entries, delay, done) => {
    if (delay < 100 || typeof Worker === "undefined") {
      done(planVillage(entries, 0));
      return;
    }
    if (workerBusy) worker?.terminate();
    if (!worker || workerBusy) worker = new Worker(new URL("./village/layout-worker.js", import.meta.url), { type: "module" });
    workerBusy = true;
    worker.onmessage = ({ data }) => {
      workerBusy = false;
      done(data);
    };
    worker.onerror = () => {
      worker?.terminate();
      worker = undefined;
      workerBusy = false;
      done(planVillage(entries, 0));
    };
    worker.postMessage(entries);
  }, applyPlan);

  function applyPlan(base, key) {
    const { population, roster, nextRoster, species } = latest;
    plan = population === base.residents ? base
      : { plots: base.plots, residents: population, network: roadsForPlots(base.plots, population) };
    terrain.update(plan);
    trails.update(plan.network);
    buildings.update(plan.plots);
    renderer.shadowMap.needsUpdate = true;
    const destinations = plan.plots.flatMap((plot) => plot.sites.map((site, index) => ({
      node: plan.network.roads.get(site.access)?.end,
      name: (plot.label ?? plot.id) + (plot.sites.length > 1 ? ` #${index + 1}` : ""),
      facing: site.yaw + Math.PI,
    })));
    residents.update(plan.residents, plan.network, roster, destinations, species);
    rosterKey = nextRoster;
    planKey = key;
  }

  function update(snapshot) {
    if (snapshot) lighting.update(snapshot, performance.now(), reducedMotion.matches);
    paused = snapshot?.paused ?? false;
    const entries = snapshot?.buildings ?? [];
    const population = snapshot?.population ?? 0;
    const roster = snapshot?.residents;
    const species = snapshot?.species ?? "cat";
    const nextRoster = JSON.stringify([species, roster]);
    const key = JSON.stringify(entries);
    requestedKey = key;
    latest = { population, roster, nextRoster, species };
    if (!plan) {
      applyPlan(planVillage([], 0), "[]");
    }
    if (key !== planKey) {
      report("calculating");
      layout.request(entries, key);
    }
    else layout.cancel();
    if (population !== plan.residents || nextRoster !== rosterKey) applyPlan(plan, planKey);
  }

  function draw(time) {
    frame = requestAnimationFrame(draw);
    lighting.animate(time);
    residents.animate(time, paused);
    if (!paused && latest.population) renderer.shadowMap.needsUpdate = true;
    resources.animateWater(time);
    camera.update(time);
    const model = hovered?.resolve();
    buildings.setHighlighted(model);
    if (!model) {
      renderer.render(scene, camera.camera);
      if (!renderer.getContext().isContextLost()) report(planKey === requestedKey ? "ready" : "calculating");
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
    if (!renderer.getContext().isContextLost()) report(planKey === requestedKey ? "ready" : "calculating");
  }

  update(null);
  frame = requestAnimationFrame(draw);
  return {
    update,
    zoom: camera.zoom,
    pan: camera.pan,
    inspect: camera.inspect,
    residentJourney: residents.journey,
    inspectResident(id) {
      const model = residents.model(id);
      return model ? camera.preview({ label: model.name, resolve: () => residents.model(id), follow: true }) : null;
    },
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
      canvas.removeEventListener("webglcontextrestored", restored);
      layout.cancel();
      worker?.terminate();
      camera.dispose();
      buildings.dispose();
      residents.dispose();
      terrain.dispose();
      trails.dispose();
      resources.dispose();
      lighting.dispose();
      outline?.dispose();
      output?.dispose();
      composer?.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
