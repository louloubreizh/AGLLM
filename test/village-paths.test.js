import assert from "node:assert/strict";
import { test } from "node:test";
import { residentId } from "../src/resident-identity.js";
import { residentText } from "../src/resident-species.js";
import { buildingDesigns } from "../src/world3d/models/buildings/catalog.js";
import { buildingEntrance, naturalBuildingFootprint } from "../src/world3d/models/buildings/building-models.js";
import { buildingUpgrades } from "../src/world3d/models/buildings/upgrades.js";
import { createRabbit } from "../src/world3d/models/fauna/rabbit.js";
import { createTrails, trailHeight } from "../src/world3d/models/infrastructure/trail.js";
import { edgeRatio, riverExtent, riverWidth, riverX, terraceRadius } from "../src/world3d/models/landscape/terrain-profile.js";
import { createRenderResources } from "../src/world3d/render-resources.js";
import { planVillage } from "../src/world3d/village/layout.js";
import { createVillageResidents } from "../src/world3d/village/residents.js";
import { drivingDecision, laneOffset, normalLane, offsetToRight } from "../src/world3d/village/lanes.js";
import { createLayoutScheduler, layoutDelay } from "../src/world3d/village/layout-scheduler.js";
import { createTerrain } from "../src/world3d/village/terrain.js";
import { distanceToRoadSquared } from "../src/world3d/village/road-network.js";

test("la ville ouvre des rues reliées à la place et conserve ses parcelles par quartier", () => {
  const base = planVillage([], 0);
  const first = planVillage([{ id: "hut", count: 1 }], 1);
  const expanded = planVillage([{ id: "field", count: 1 }, { id: "smelter", count: 2 }, { id: "hut", count: 1 }], 2);
  assert.deepEqual(expanded.plots[2], first.plots[0]);
  assert.ok(base.network.roads.size < first.network.roads.size && first.network.roads.size < expanded.network.roads.size);
  for (const road of first.network.roads.keys()) {
    assert.ok(expanded.network.roads.has(road) || [...expanded.network.roads.keys()].some((id) => id.startsWith(`${road}:`)));
  }
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
  for (const [index, site] of sites.entries()) {
    assert.ok(plan.network.roads.has(site.access));
    const end = plan.network.roads.get(site.access).points.at(-1);
    assert.ok(Math.hypot(end.x - site.entry.x, end.z - site.entry.z) < 1e-9);
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
  const lanes = new Set();
  for (const { points, width, lanes: count } of plan.network.roads.values()) {
    lanes.add(count);
    for (const { x, z } of points) {
      assert.ok(Math.hypot(x, z) + width / 2 < terraceRadius * edgeRatio(Math.atan2(z, x)));
      if (Math.abs(z) < riverExtent) assert.ok(Math.abs(x - riverX(z)) > riverWidth(z) + width / 2);
    }
  }
  assert.deepEqual(lanes, new Set([2, 4]));
});

test("un village de 80 bâtiments individuels conserve leurs dimensions et leurs accès", () => {
  const upgrades = new Set(Object.values(buildingUpgrades));
  const entries = Object.keys(buildingDesigns).filter((id) => !upgrades.has(id)).map((id) => ({ id, count: 2 }));
  const { plots, network } = planVillage(entries, 10);
  assert.equal(plots.length, entries.length);
  for (const { id, sites } of plots) {
    assert.equal(sites.length, 2, id);
    for (const site of sites) {
      assert.equal(site.capacity, 1);
      assert.equal(site.footprint, naturalBuildingFootprint(id, 1), id);
      const road = network.roads.get(site.access);
      assert.ok(road?.length > 0, site.access);
      const end = road.points.at(-1);
      assert.ok(Math.hypot(end.x - site.entry.x, end.z - site.entry.z) < 1e-9, site.access);
    }
  }
});

test("les chats suivent les chemins, animent leurs pattes et s’arrêtent en pause", (t) => {
  const resources = createRenderResources(0x14251f);
  t.after(() => resources.dispose());
  const residents = createVillageResidents(resources);
  t.after(() => residents.dispose());
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
      assert.ok([...expanded.network.roads.values()].some((road) => distanceToRoadSquared(x, z, road) < (road.width / 2 + 0.025) ** 2));
      assert.ok(Math.abs(y - trailHeight(x, z) - 0.006) < 0.000001);
    }
  }
});

test("changer d’espèce conserve le modèle suivi et le trajet de l’habitant", (t) => {
  const resources = createRenderResources(0x14251f);
  const residents = createVillageResidents(resources);
  t.after(() => { residents.dispose(); resources.dispose(); });
  const { network } = planVillage([{ id: "hut", count: 1 }], 1);
  const people = [{ id: 14, name: "Camille", coat: "#a27e61" }];
  residents.update(1, network, people);
  const model = residents.model(14);
  const position = model.position.clone();
  const journey = residents.journey(14);

  for (const [species, feature, legs] of [
    ["dog", "Jaw", 4], ["rabbit", "Hock", 4], ["raptor", "Feathered arm", 2], ["drake", "Wing", 4], ["cat", "Tail tip", 4],
  ]) {
    const previous = model.getObjectByName("Body");
    residents.update(1, network, people, [], species);
    assert.equal(residents.model(14), model);
    assert.equal(model.name, "Camille");
    assert.notEqual(model.getObjectByName("Body"), previous);
    assert.ok(model.getObjectByName(feature));
    assert.equal(model.getObjectsByProperty("name", "Leg").length, legs);
    assert.deepEqual(model.position, position);
    assert.deepEqual(residents.journey(14), journey);
    assert.ok(residents.display.children.some((mesh) => mesh.instanceColor));
  }
});

test("le lapin prend appui, replie ses pattes et décolle pendant ses bonds", (t) => {
  const resources = createRenderResources(0x14251f);
  t.after(() => resources.dispose());
  const rabbit = createRabbit(resources, 0);
  const body = rabbit.model.getObjectByName("Body");
  const [first, second] = rabbit.model.getObjectsByProperty("name", "Hock");
  rabbit.animate(0.025, 1, 0, 0);
  assert.ok(body.position.y < 0);
  rabbit.animate(0.1, 1, 0, 0.1);
  assert.ok(body.position.y > 0.15);
  assert.ok(first.rotation.x > 0.8);
  assert.equal(first.rotation.x, second.rotation.x);
  rabbit.animate(0.1, 0, 0.5, 0.35);
  assert.equal(body.position.y, 0);
  assert.ok(rabbit.model.getObjectByName("Head").rotation.x < 0);
  rabbit.animate(0.12, 1, 0, 0.4, 0.7);
  assert.ok(rabbit.model.getObjectByName("Ear").rotation.y > 0.3);
});

test("les libellés distinguent les habitants de l’herbe à chat et respectent le pluriel", () => {
  assert.equal(residentText("Un chaton est arrivé. Les chatons mangent de l'herbe à chat.", "dog"),
    "Un chien est arrivé. Les chiens mangent de l'herbe à chat.");
  assert.equal(residentText("Chatons disponibles", "cat"), "Chats disponibles");
  assert.equal(residentText("A kitten has joined the kittens", "drake"), "A blue dragon has joined the blue dragons");
});

test("les quartiers extérieurs restent à distance des rives malgré la croissance du village", (t) => {
  const plan = (count) => planVillage(["field", "pasture", "observatory"].map((id) => ({ id, count })), 0);
  const reached = ({ plots }) => Math.max(...plots.flatMap(({ sites }) => sites.map(({ x, z }) =>
    Math.hypot(x, z) / (terraceRadius * edgeRatio(Math.atan2(z, x))))));
  const early = plan(5);
  const expanded = plan(100);
  const mature = plan(250);
  assert.ok(reached(early) < 0.74);
  assert.ok(reached(expanded) < 0.80);
  assert.ok(reached(mature) < 0.80);
  assert.ok(![...early.network.roads.keys()].some((id) => id.startsWith("ring:4:")));
  assert.ok(![...mature.network.roads.keys()].some((id) => id.startsWith("ring:4:")));

  const visit = new Set(["square"]);
  for (const node of visit) {
    for (const road of mature.network.junctions.get(node)) {
      visit.add(road.start);
      visit.add(road.end);
    }
  }
  assert.equal(visit.size, mature.network.junctions.size);
  for (const { points, width } of mature.network.roads.values()) {
    for (const { x, z } of points) {
      assert.ok(Math.hypot(x, z) + width / 2 < terraceRadius * edgeRatio(Math.atan2(z, x)));
      if (Math.abs(z) < riverExtent) assert.ok(Math.abs(x - riverX(z)) > riverWidth(z) + width / 2);
    }
  }
  const trails = createTrails(null);
  t.after(() => trails.dispose());
  const developed = planVillage([...mature.plots, { id: "mansion", count: 276 }, { id: "mine", count: 159 }], 0);
  trails.update(developed.network);
  assert.ok(trails.group.children[0].geometry.getAttribute("position").array.every(Number.isFinite));
  assert.equal(trails.group.children[0].receiveShadow, true);
  assert.equal(trails.group.children[1].receiveShadow, false);
});

test("les ateliers et le laboratoire sont au centre, avec les équipements modernes et la végétation bien répartis", (t) => {
  const plan = planVillage([
    { id: "workshop", count: 3 }, { id: "zebraWorkshop", count: 3 }, { id: "biolab", count: 3 },
    { id: "library", stage: 1, count: 3 }, { id: "amphitheatre", stage: 1, count: 3 }, { id: "warehouse", count: 1 },
  ], 25);
  assert.deepEqual(plan.plots.map(({ zone }) => zone), ["center", "center", "center", "outskirts", "outskirts", "outskirts"]);
  for (const plot of [plan.plots[0], plan.plots.at(-1)]) {
    const site = plot.sites[0];
    const { x } = buildingEntrance(plot.id, site.capacity, site.footprint);
    const end = plan.network.roads.get(site.access).points.at(-1);
    assert.ok(Math.abs(x) > 0.1, plot.id);
    assert.ok(Math.abs((end.x - site.x) * Math.cos(site.yaw) - (end.z - site.z) * Math.sin(site.yaw) - x) < 1e-8);
  }
  const resources = createRenderResources(0x14251f);
  t.after(() => resources.dispose());
  const terrain = createTerrain(resources);
  t.after(() => terrain.dispose());
  terrain.update(plan);
  assert.ok(terrain.group.children.some(({ name, visible, scale, position }) =>
    name === "Tree" && visible && scale.x < 0.4 && Math.hypot(position.x, position.z) < 10));
  const forest = terrain.group.getObjectByName("Woodland");
  const trunks = forest.children.filter(({ material }) => material === resources.materials.trunk);
  assert.ok(trunks.reduce((count, mesh) => count + mesh.count, 0) > 1800);
  assert.equal(new Set(trunks.filter(({ count }) => count > 0).map(({ name }) => name)).size, 10);
  const plants = resources.groundCover.children;
  assert.equal(new Set(plants.filter(({ count }) => count > 0).map(({ name }) => name)).size, 10);
  assert.equal(new Set(plants.map(({ geometry }) => geometry)).size, 10);
});

test("les avenues utilisent les deux voies du même sens et le dépassement respecte les dégagements", () => {
  const road = { width: 0.58, lanes: 4, routeDistance: 0 };
  const driver = { id: 2, road, distance: 2, direction: 1, speed: 0.7 };
  const slow = { ...driver, id: 4, distance: 2.45, speed: 0.3, lane: 0 };
  assert.equal(normalLane(road, 3), 1);
  assert.ok(laneOffset(road, 0) > laneOffset(road, 1) && laneOffset(road, 1) > 0);
  assert.ok(offsetToRight({ x: 0, z: 0 }, 0, laneOffset(road, 0)).x < 0);
  assert.ok(offsetToRight({ x: 0, z: 0 }, Math.PI, laneOffset(road, 0)).x > 0);
  assert.equal(drivingDecision(driver, [slow], 5).lane, 1);
  assert.equal(drivingDecision(driver, [slow], 0.8).lane, 0);
  const left = { ...slow, id: 3, lane: 1, distance: 1.95 };
  assert.equal(drivingDecision(driver, [slow, left], 5).lane, 0);
  const street = { ...road, lanes: 2 };
  const oncoming = { ...slow, road: street, id: 5, direction: -1, distance: 3.1 };
  assert.equal(drivingDecision({ ...driver, road: street }, [{ ...slow, road: street }, oncoming], 5).lane, 0);
  assert.equal(drivingDecision({ ...driver, passing: slow.id, distance: 3 }, [slow], 5).lane, 0);
});

test("les achats rapides ne déclenchent qu’un calcul et un résultat périmé est ignoré", () => {
  const timers = new Map();
  const results = [];
  const requests = [];
  let id = 0;
  const schedule = createLayoutScheduler((entries, delay, done) => requests.push({ entries, delay, done }),
    (result) => results.push(result), {
      set: (run) => { timers.set(++id, run); return id; },
      clear: (timer) => timers.delete(timer),
    });
  assert.equal(layoutDelay([{ count: 1 }]), 35);
  assert.ok(layoutDelay([{ count: 2000 }]) >= 1000 && layoutDelay([{ count: 2000 }]) <= 2000);
  for (let count = 1000; count < 1050; count += 1) schedule.request([{ count }], String(count));
  assert.equal(timers.size, 1);
  [...timers.values()][0]();
  assert.equal(requests.length, 1);
  assert.equal(requests[0].entries[0].count, 1049);
  schedule.request([{ count: 1050 }], "1050");
  requests[0].done("old");
  assert.deepEqual(results, []);
  [...timers.values()][0]();
  requests[1].done("latest");
  assert.deepEqual(results, ["latest"]);
});

test("les grands modèles sont rapprochés de la place au centre et éloignés en périphérie", () => {
  const { plots } = planVillage(["mansion", "workshop", "factory", "warehouse"].map((id) => ({ id, count: 14 })), 0);
  for (const plot of plots) {
    const largest = plot.sites.find(({ capacity }) => capacity === 10);
    const smallest = plot.sites.find(({ capacity }) => capacity === 1);
    const difference = Math.hypot(largest.x, largest.z) - Math.hypot(smallest.x, smallest.z);
    assert.ok(plot.zone === "center" ? difference < 0 : difference > 0, plot.id);
  }
});

test("tout le village se déplace et se dessine au-delà de l’ancien plafond", (t) => {
  const entries = [{ id: "hut", count: 47 }, { id: "mansion", count: 276 }, { id: "field", count: 225 }];
  const population = 384;
  const plan = planVillage(entries, population);
  const small = planVillage([], 1);
  const populated = planVillage([], population);
  assert.equal(plan.residents, population);
  assert.ok(populated.network.roads.size > small.network.roads.size);

  const resources = createRenderResources(0x14251f);
  const residents = createVillageResidents(resources);
  t.after(() => {
    residents.dispose();
    resources.dispose();
  });
  residents.update(plan.residents, plan.network);
  const cats = residents.group.children;
  const startingPositions = cats.map((cat) => cat.position.clone());
  let parts = 0;
  cats[0].traverse((part) => { if (part.isMesh) parts += 1; });
  assert.equal(cats.length, population);
  assert.ok(residents.display.children.every((mesh) => mesh.isInstancedMesh));
  assert.equal(residents.display.children.reduce((count, mesh) => count + mesh.count, 0), population * parts);

  for (let frame = 0; frame <= 180; frame += 1) residents.animate(frame * 1000 / 60, false);
  for (const [index, cat] of cats.entries()) {
    assert.ok(cat.visible && cat.position.distanceToSquared(startingPositions[index]) > 1e-6);
  }

  residents.update(0, small.network);
  assert.equal(residents.group.children.length, 0);
  assert.equal(residents.display.children.length, 0);
});

test("les trajets restent indépendants pendant 90 secondes et les identités survivent au tri du recensement", (t) => {
  const resources = createRenderResources(0x14251f);
  const residents = createVillageResidents(resources);
  t.after(() => { residents.dispose(); resources.dispose(); });
  const kittens = Array.from({ length: 64 }, () => ({ name: "Même nom" }));
  const people = kittens.map((kitten) => ({ ...kitten, id: residentId(kitten), coat: "#b17b3e" }));
  const plan = planVillage([], people.length);
  residents.update(people.length, plan.network, people);
  const [first, second] = people;
  const original = residents.model(first.id);
  const retained = residents.model(second.id);
  assert.notEqual(first.id, second.id);
  assert.equal(residentId(kittens[0]), first.id);
  assert.equal(original.name, first.name);
  const before = residents.journey(first.id);
  residents.update(people.length, plan.network, [...people].reverse().slice(0, -1));
  assert.equal(residents.model(first.id), undefined);
  assert.equal(residents.model(second.id), retained);
  residents.update(people.length, plan.network, people);
  assert.ok(residents.journey(first.id));
  assert.ok(before.meters >= 0);
  const visited = new Set();
  let arrived = false;
  const previous = people.map(({ id }) => residents.model(id).position.clone());
  const distance = people.map(() => 0);
  for (let time = 0; time <= 90000; time += 50) {
    residents.animate(time, false);
    arrived ||= people.some(({ id }) => residents.journey(id).progress >= 0.999999);
    people.forEach(({ id }, index) => {
      const position = residents.model(id).position;
      distance[index] += position.distanceTo(previous[index]);
      previous[index].copy(position);
    });
    if (time % 10000 !== 0 || time === 0) continue;
    people.forEach(({ id }, index) => {
      const { meters, progress, destination } = residents.journey(id);
      visited.add(destination);
      assert.ok(meters >= 0 && progress >= 0 && progress <= 1);
      assert.ok(distance[index] > Math.sqrt(0.001));
      distance[index] = 0;
    });
  }
  assert.ok(visited.size >= 2);
  assert.ok(arrived);
});
