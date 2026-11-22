import assert from "node:assert/strict";
import { test } from "node:test";
import { readGameState } from "../src/game-state.js";
import { chooseObservation, maximumResidents, planVillage } from "../src/world/layout.js";
import { placeTooltip } from "../src/game-tooltips.js";

test("lit le calendrier, la population et les bâtiments dans la partie active", () => {
  const buildings = Object.freeze([
    Object.freeze({ name: "field", label: "Champs", val: 0 }),
    Object.freeze({
      name: "pasture", label: "Pâturage", val: 9, stage: 1,
      stages: [Object.freeze({ label: "Pâturage" }), Object.freeze({ label: "Centrale solaire" })],
    }),
  ]);
  const game = Object.freeze({
    calendar: Object.freeze({ year: 4, day: -2.5, season: 1, getCurSeason: () => ({ name: "winter" }), weather: "cold" }),
    village: Object.freeze({ getKittens: () => 137, happiness: 1.25 }),
    bld: Object.freeze({ buildingsData: buildings, cathPollution: 450000, getPollutionLevelBase: () => 100000 }),
    science: Object.freeze({ get: () => ({ researched: true }) }),
    resPool: Object.freeze({ energyProd: 140, energyCons: 120, energyWinterProd: 100, get: () => ({ value: 5 }) }),
    fps: Object.freeze({ ms: 7 }),
    isLocalhost: true,
    isPaused: true,
  });

  assert.equal(readGameState(undefined), null);
  assert.deepEqual(readGameState(game), {
    year: 5, day: -2, season: "winter", weather: "cold", paused: true, population: 137,
    buildings: [{ id: "pasture", label: "Centrale solaire", count: 9, stage: 1, slot: 1 }],
    toolbar: {
      tickTime: 7,
      happiness: 125,
      energy: { production: 140, consumption: 120, winterProduction: 100 },
      pollution: 450,
      pollutionVisible: true,
      sorrow: 5,
    },
  });
});

test("conserve les parcelles et limite le coût visuel pour les grandes colonies", () => {
  const field = { id: "field", count: 999, slot: 0, stage: 0 };
  const hut = { id: "hut", count: 1, slot: 3, stage: 0 };
  const before = planVillage([hut], 1);
  const after = planVillage([field, hut], 250);

  assert.equal(after.residents, maximumResidents);
  assert.equal(after.plots[0].count, 999);
  assert.equal(after.plots[0].models, 3);
  assert.deepEqual(after.plots[1], before.plots[0]);
  assert.notDeepEqual([after.plots[0].x, after.plots[0].z], [after.plots[1].x, after.plots[1].z]);
});

test("choisit un autre exemplaire lorsque plusieurs modèles sont visibles", () => {
  assert.equal(chooseObservation(0), -1);
  assert.equal(chooseObservation(1, 0), 0);
  assert.equal(chooseObservation(3, -1, () => 0.99), 2);
  assert.equal(chooseObservation(3, 1, () => 0), 0);
  assert.equal(chooseObservation(3, 1, () => 0.99), 2);
});

test("place les descriptions à côté de la commande et les limite à l’espace disponible", () => {
  assert.deepEqual(placeTooltip(
    { left: 280, right: 420, top: 150, bottom: 190 }, { width: 220, height: 200 }, { width: 900, height: 600 },
  ), { x: 428, y: 150, maxHeight: 584 });
  assert.deepEqual(placeTooltip(
    { left: 690, right: 850, top: 150, bottom: 190 }, { width: 220, height: 200 }, { width: 900, height: 600 },
  ), { x: 462, y: 150, maxHeight: 584 });
  assert.deepEqual(placeTooltip(
    { left: 16, right: 304, top: 320, bottom: 365 }, { width: 288, height: 360 }, { width: 320, height: 500 },
  ), { x: 16, y: 8, maxHeight: 304 });
});

