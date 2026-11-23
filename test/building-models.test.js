import assert from "node:assert/strict";
import { test } from "node:test";
import { Box3, Vector3 } from "three";
import { buildingIcons } from "../src/building-icons.js";
import { createBuildingModels } from "../src/world3d/models/buildings/building-models.js";
import { buildingDesigns, buildingModelId } from "../src/world3d/models/buildings/catalog.js";
import { buildingUpgrades } from "../src/world3d/models/buildings/upgrades.js";
import { createRenderResources } from "../src/world3d/render-resources.js";
import { createVillageBuildings } from "../src/world3d/village/buildings.js";
import { planVillage } from "../src/world3d/village/layout.js";

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
  }
  for (const [id, upgrade] of Object.entries(buildingUpgrades)) {
    assert.equal(buildingModelId(id, 0), id);
    assert.equal(buildingModelId(id, 1), upgrade);
  }
});

test("le village sépare les exemplaires et conserve l’identifiant d’observation après une amélioration", (t) => {
  const resources = createRenderResources(0x14251f);
  const village = createVillageBuildings(resources);
  t.after(() => {
    village.dispose();
    resources.dispose();
  });

  const [plot] = planVillage([{ id: "pasture", label: "Pâturage", stage: 0, count: 3 }], 0).plots;
  village.update([plot]);
  const pastures = village.instances.get("pasture");
  assert.equal(pastures.length, 3);
  assert.equal(pastures[0].children[0].geometry, pastures[1].children[0].geometry);
  const bounds = pastures.map((model) => new Box3().setFromObject(model.clone()));
  for (const [index, box] of bounds.entries()) {
    for (const other of bounds.slice(index + 1)) assert.equal(box.intersectsBox(other), false);
  }

  village.update([{ ...plot, stage: 1 }]);
  const solarFarms = village.instances.get("pasture");
  assert.equal(solarFarms.length, 3);
  assert.equal(solarFarms[0].name, plot.label);
  assert.notEqual(solarFarms[0].children[0].geometry, pastures[0].children[0].geometry);
});
