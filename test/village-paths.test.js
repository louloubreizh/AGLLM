import assert from "node:assert/strict";
import { test } from "node:test";
import { buildingDesigns } from "../src/world3d/models/buildings/catalog.js";
import { buildingUpgrades } from "../src/world3d/models/buildings/upgrades.js";
import { trailHeight } from "../src/world3d/models/infrastructure/trail.js";
import { edgeRatio, riverExtent, riverWidth, riverX, terraceRadius } from "../src/world3d/models/landscape/terrain-profile.js";
import { createRenderResources } from "../src/world3d/render-resources.js";
import { planVillage } from "../src/world3d/village/layout.js";
import { createVillageResidents } from "../src/world3d/village/residents.js";
import { distanceToRoadSquared } from "../src/world3d/village/road-network.js";

test("la ville ouvre des rues reliées à la place et conserve ses parcelles par quartier", () => {
  const base = planVillage([], 0);
  const first = planVillage([{ id: "hut", count: 1 }], 1);
  const expanded = planVillage([{ id: "field", count: 1 }, { id: "smelter", count: 2 }, { id: "hut", count: 1 }], 2);
  assert.deepEqual(expanded.plots[2], first.plots[0]);
  assert.ok(base.network.roads.size < first.network.roads.size && first.network.roads.size < expanded.network.roads.size);
  for (const road of first.network.roads.keys()) assert.ok(expanded.network.roads.has(road));
  assert.deepEqual(expanded.plots.map(({ zone }) => zone), ["countryside", "outskirts", "center"]);
  const radii = expanded.plots.map(({ x, z }) => Math.hypot(x, z));
  assert.ok(radii[0] > radii[1] && radii[1] > radii[2]);
  const visit = new Set(["square"]);
  for (const node of visit) {
    for (const road of expanded.network.junctions.get(node)) {
      visit.add(road.start);
      visit.add(road.end);
    }
  }
  assert.equal(visit.size, expanded.network.junctions.size);
  assert.ok(expanded.network.roads.size > visit.size, "les rues forment plusieurs boucles");
});

test("les bâtiments tiennent sur l’île et les rues contournent les parcelles", () => {
  const upgrades = new Set(Object.values(buildingUpgrades));
  const ids = Object.keys(buildingDesigns).filter((id) => !upgrades.has(id));
  const plan = planVillage(ids.map((id) => ({ id, count: 3 })), 0);
  assert.equal(plan.plots.length, ids.length);
  const sites = plan.plots.flatMap((plot) => plot.sites);
  for (const plot of plan.plots) {
    assert.equal(new Set(plot.sites.map((site) => site.sector)).size, 3, plot.id);
    assert.ok(plot.sites.every((site) => site.zone === plot.zone));
  }
  for (const [index, site] of sites.entries()) {
    assert.ok(plan.network.roads.has(site.access));
    for (const other of sites.slice(index + 1)) {
      assert.ok(Math.hypot(site.x - other.x, site.z - other.z) > (site.footprint + other.footprint) / 2,
        `${site.access} / ${other.access}`);
    }
    for (const road of plan.network.roads.values()) {
      if (road.id === site.access) continue;
      assert.ok(distanceToRoadSquared(site.x, site.z, road) > ((site.footprint + road.width) / 2) ** 2,
        `${site.access} / ${road.id}`);
    }
  }
  for (const { points, width } of plan.network.roads.values()) {
    for (const { x, z } of points) {
      assert.ok(Math.hypot(x, z) + width / 2 < terraceRadius * edgeRatio(Math.atan2(z, x)));
      if (Math.abs(z) < riverExtent) assert.ok(Math.abs(x - riverX(z)) > riverWidth(z) + width / 2);
    }
  }
});

test("les chats suivent les chemins, animent leurs pattes et s’arrêtent en pause", (t) => {
  const resources = createRenderResources(0x14251f);
  t.after(() => resources.dispose());
  const residents = createVillageResidents(resources);
  const initial = planVillage([{ id: "hut", count: 1 }], 4);
  const expanded = planVillage([{ id: "hut", count: 1 }, { id: "field", count: 1 }], 4);
  residents.update(initial.residents, initial.network);
  const cat = residents.group.children[0];
  const leg = cat.getObjectByName("Leg");
  const start = cat.position.clone();
  const angle = leg.rotation.x;
  residents.animate(0, false);
  residents.animate(50, false);
  assert.notDeepEqual(cat.position, start);
  assert.notEqual(leg.rotation.x, angle);
  const beforeExpansion = cat.position.clone();
  residents.update(expanded.residents, expanded.network);
  assert.deepEqual(cat.position, beforeExpansion);
  residents.animate(100, true);
  assert.deepEqual(cat.position, beforeExpansion);

  for (let time = 150; time < 15000; time += 50) {
    residents.animate(time, false);
    for (const { position: { x, y, z } } of residents.group.children) {
      assert.ok([...expanded.network.roads.values()].some((road) => distanceToRoadSquared(x, z, road) < 0.05 ** 2));
      assert.ok(Math.abs(y - trailHeight(x, z) - 0.006) < 0.000001);
    }
  }
});
