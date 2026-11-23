import assert from "node:assert/strict";
import { test } from "node:test";
import { Box3, BoxGeometry, Matrix4, Mesh, MeshBasicMaterial, PerspectiveCamera, Vector3 } from "three";
import { buildingIcons } from "../src/building-icons.js";
import { createScenePicker } from "../src/world3d/camera/selection.js";
import { buildingEntrance, buildingOpening, createBuildingModels, naturalBuildingFootprint } from "../src/world3d/models/buildings/building-models.js";
import { buildingCapacityTiers } from "../src/world3d/models/buildings/capacity-variants.js";
import { buildingDesigns, buildingModelId } from "../src/world3d/models/buildings/catalog.js";
import { buildingInteractionScale, minimumOpening, standingResident } from "../src/world3d/models/buildings/interaction-scale.js";
import { buildingUpgrades } from "../src/world3d/models/buildings/upgrades.js";
import { createCat } from "../src/world3d/models/fauna/cat.js";
import { createDog } from "../src/world3d/models/fauna/dog.js";
import { createDrake } from "../src/world3d/models/fauna/drake.js";
import { createRabbit } from "../src/world3d/models/fauna/rabbit.js";
import { createRaptor } from "../src/world3d/models/fauna/raptor.js";
import { createModelGroup } from "../src/world3d/models/model-group.js";
import { createRenderResources } from "../src/world3d/render-resources.js";
import { createVillageBuildings } from "../src/world3d/village/buildings.js";
import { planVillage } from "../src/world3d/village/layout.js";

test("le plateau et le lac restent visibles sans être inspectables", (t) => {
  const terrain = createModelGroup("terrain");
  const geometry = new BoxGeometry(1, 0.1, 1);
  const material = new MeshBasicMaterial();
  t.after(() => { geometry.dispose(); material.dispose(); });
  for (const [index, name] of ["Island plateau", "Lake", "River"].entries()) {
    const model = createModelGroup(name);
    model.position.x = index * 2;
    model.add(new Mesh(geometry, material));
    terrain.add(model);
  }
  const camera = new PerspectiveCamera(40, 1, 0.1, 30);
  const pick = createScenePicker(camera, { instances: new Map() }, terrain,
    createModelGroup("paths"), createModelGroup("residents"));
  for (const [index, expected] of [null, null, "Rivière"].entries()) {
    camera.position.set(index * 2, 3, 0.1);
    camera.lookAt(index * 2, 0, 0);
    assert.equal(pick(0.5, 0.5)?.label ?? null, expected);
  }
});

test("les bâtiments du Campement et leurs améliorations ont un modèle utilisable", (t) => {
  const expected = new Set([...Object.keys(buildingIcons), ...Object.values(buildingUpgrades)]);
  assert.deepEqual(new Set(Object.keys(buildingDesigns)), expected);
  const resources = createRenderResources(0x14251f);
  const models = createBuildingModels(resources.materials);
  t.after(() => {
    models.dispose();
    resources.dispose();
  });

  for (const id of expected) {
    const model = models.instantiate(id, id, 1.95);
    const bounds = new Box3().setFromObject(model);
    const size = bounds.getSize(new Vector3());
    assert.equal(model.name, id);
    assert.ok(size.y > 0.2 && Math.max(size.x, size.z) <= 1.951, id);
    for (const { geometry } of model.children) {
      assert.ok(geometry.attributes.normal.array.every(Number.isFinite), id);
    }
    let previous;
    for (const capacity of [...buildingCapacityTiers(id)].reverse()) {
      const variant = models.instantiate(id, id, naturalBuildingFootprint(id, capacity), capacity);
      if (previous) assert.ok(Math.abs(variant.scale.x / previous.scale.x - (capacity === 3 ? 1.8 : 2.55 / 1.8)) < 1e-9, id);
      previous = variant;
      if (capacity === 1) continue;
      assert.equal(variant.name, `${id} ×${capacity}`);
      assert.equal(variant.children[0].geometry, model.children[0].geometry);
    }
  }
  for (const [id, upgrade] of Object.entries(buildingUpgrades)) {
    assert.equal(buildingModelId(id, 0), id);
    assert.equal(buildingModelId(id, 1), upgrade);
  }
});

test("les bâtiments individuels sont dimensionnés pour les cinq habitants au sol", (t) => {
  const resources = createRenderResources(0x14251f);
  const catalog = createBuildingModels(resources.materials);
  t.after(() => { catalog.dispose(); resources.dispose(); });
  const ids = Object.keys(buildingDesigns);
  assert.deepEqual(Object.keys(buildingInteractionScale).sort(), ids.toSorted());
  for (const createResident of [createCat, createDog, createRabbit, createRaptor, createDrake]) {
    const resident = createResident(resources, 0);
    resident.animate(0, 0, 0, 0);
    const bounds = new Box3().setFromObject(resident.model);
    const size = bounds.getSize(new Vector3());
    assert.ok(size.y <= standingResident.height && size.x <= standingResident.width && bounds.max.z < standingResident.frontReach,
      resident.model.name);
  }
  for (const id of ids) {
    const footprint = naturalBuildingFootprint(id, 1);
    const model = catalog.instantiate(id, id, footprint);
    const bounds = new Box3().setFromObject(model);
    const desired = buildingInteractionScale[id].height * standingResident.height;
    const measured = bounds.max.y - bounds.min.y;
    assert.ok(measured >= desired - 0.00001 && measured <= desired * 1.15, id);
    const opening = buildingOpening(id, footprint);
    if (opening) {
      assert.ok(opening.width >= minimumOpening.width - 1e-6, id);
      assert.ok(opening.height >= minimumOpening.height - 1e-6, id);
    }
    const approach = buildingEntrance(id, 1, footprint);
    assert.ok(approach.x >= bounds.min.x && approach.x <= bounds.max.x, id);
    assert.ok(approach.z - bounds.max.z >= standingResident.frontReach - 1e-6, id);
  }
});

test("le village sépare les exemplaires et conserve l’identifiant d’observation après une amélioration", (t) => {
  const resources = createRenderResources(0x14251f);
  const village = createVillageBuildings(resources);
  t.after(() => {
    village.dispose();
    resources.dispose();
  });

  const [plot] = planVillage([{ id: "pasture", label: "Pâturage", stage: 0, count: 2 }], 0).plots;
  village.update([plot]);
  const pastures = village.instances.get("pasture");
  assert.equal(pastures.length, 2);
  assert.equal(pastures[0].children[0].geometry, pastures[1].children[0].geometry);
  const bounds = pastures.map((model) => new Box3().setFromObject(model.clone()));
  for (const [index, box] of bounds.entries()) {
    for (const other of bounds.slice(index + 1)) assert.equal(box.intersectsBox(other), false);
  }

  village.update([{ ...plot, stage: 1 }]);
  const solarFarms = village.instances.get("pasture");
  assert.equal(solarFarms.length, 2);
  assert.equal(solarFarms[0].name, plot.label);
  assert.notEqual(solarFarms[0].children[0].geometry, pastures[0].children[0].geometry);
});

test("le village groupe les quantités exactes et mélange les bâtiments par quartier", (t) => {
  const resources = createRenderResources(0x14251f);
  const village = createVillageBuildings(resources);
  t.after(() => {
    village.dispose();
    resources.dispose();
  });

  const entries = [
    ["mansion", 276, "center"], ["hut", 57, "center"], ["temple", 64, "center"],
    ["factory", 40, "outskirts"], ["mine", 183, "outskirts"], ["lumberMill", 128, "outskirts"],
    ["chronosphere", 124, "outskirts"], ["harbor", 10, "outskirts"],
    ["field", 155, "countryside"], ["observatory", 227, "countryside"],
  ];
  const { plots } = planVillage(entries.map(([id, count]) => ({ id, count })), 0);
  village.update(plots);
  const sites = plots.flatMap((plot) => plot.sites);
  for (const plot of plots) {
    const footprints = [...new Map(plot.sites.filter(({ capacity }) => capacity > 1)
      .map((site) => [site.capacity, site.footprint])).values()];
    assert.ok(footprints.every((size, index) => index === 0 || size < footprints[index - 1]), plot.id);
    for (const site of plot.sites.filter(({ capacity }) => capacity === 1)) {
      assert.equal(site.footprint, naturalBuildingFootprint(buildingModelId(plot.id, plot.stage), 1), plot.id);
    }
  }
  assert.notEqual(plots[0].sites.at(-1).footprint, plots[1].sites.at(-1).footprint);

  for (const [index, [id, count, zone]] of entries.entries()) {
    const { models, sites } = plots[index];
    assert.equal(village.instances.get(id).length, models);
    assert.equal(sites.length, models);
    assert.equal(sites.reduce((total, site) => total + site.capacity, 0), count);
    const capacities = new Set(sites.map(({ capacity }) => capacity));
    assert.ok(village.group.children[index].children.every((mesh) => mesh.isInstancedMesh && mesh.count <= models));
    assert.ok(village.instances.get(id).every((model, index) => model.name ===
      (sites[index].capacity === 1 ? id : `${id} ×${sites[index].capacity}`)));
    if (id === "chronosphere") assert.deepEqual([...capacities], [10, 3, 1]);
  }
  for (const id of ["mansion", "hut", "mine", "lumberMill", "field", "observatory"]) {
    const { sites } = plots.find((plot) => plot.id === id);
    assert.ok(new Set(sites.map(({ sector }) => sector)).size >= 2, id);
  }
  assert.deepEqual(plots[0].sites.map(({ capacity }) => capacity),
    [...Array(27).fill(10), 3, 3]);
  for (const [index, site] of sites.entries()) {
    for (const other of sites.slice(index + 1)) {
      assert.ok(Math.hypot(site.x - other.x, site.z - other.z) > (site.footprint + other.footprint) / 2);
    }
  }

  const model = village.instances.get("mansion")[0];
  const camera = new PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.copy(model.position).add(new Vector3(0, 2, 0.01));
  camera.lookAt(model.position);
  const pick = createScenePicker(camera, village, createModelGroup("terrain"), createModelGroup("trails"), createModelGroup("residents"));
  const selection = pick(0.5, 0.5);
  assert.equal(selection?.resolve(), model);
  assert.equal(selection.label, "mansion ×10");
  village.setHighlighted(model);
  assert.equal(model.parent, village.group);
  village.setHighlighted();
  assert.equal(model.parent, null);

  village.update(planVillage([{ id: "mansion", count: 2 }], 0).plots);
  assert.equal(village.instances.get("mansion").length, 2);
  assert.equal(village.instances.has("factory"), false);
  village.update(planVillage([{ id: "mansion", count: 20 }], 0).plots);
  assert.deepEqual(village.instances.get("mansion").map(({ name }) => name), ["mansion ×10", "mansion ×10"]);
  const [spaceport] = planVillage([{ id: "warehouse", stage: 1, count: 4 }], 0).plots;
  assert.ok(spaceport.sites.every((site) => site.zone === "outskirts"));
});

test("un groupe encombrant ne réduit pas la cabane voisine", () => {
  const hut = { id: "hut", count: 1 };
  const [individual] = planVillage([hut], 0).plots;
  const [besideGroup] = planVillage([hut, { id: "mansion", count: 14 }], 0).plots;
  assert.equal(individual.sites[0].footprint, naturalBuildingFootprint("hut", 1));
  assert.equal(besideGroup.sites[0].footprint, individual.sites[0].footprint);
});

test("les multiplicateurs des groupes sont sur la façade, aux trois quarts de la hauteur", (t) => {
  const resources = createRenderResources(0x14251f);
  const village = createVillageBuildings(resources);
  t.after(() => { village.dispose(); resources.dispose(); });
  const { plots } = planVillage([{ id: "mansion", count: 14 }], 0);
  village.update(plots);
  const plaques = village.group.children[0].children.filter(({ name }) => name.startsWith("×"));
  assert.deepEqual(plaques.map(({ name }) => name), ["×10", "×3"]);
  for (const plaque of plaques) {
    const model = village.instances.get("mansion").find(({ name }) => name.endsWith(plaque.name));
    const matrix = new Matrix4();
    plaque.getMatrixAt(0, matrix);
    const position = new Vector3().setFromMatrixPosition(matrix);
    const bounds = village.bounds.get(model);
    const expectedY = bounds.min.y + (bounds.max.y - bounds.min.y) * 0.75;
    const forward = new Vector3(0, 0, 1).transformDirection(model.matrix);
    assert.ok(Math.abs(position.y - expectedY) < 1e-6);
    assert.ok(position.sub(model.position).dot(forward) > 0);
    assert.ok(new Vector3(0, 0, 1).transformDirection(matrix).distanceTo(forward) < 1e-6);
  }
});
