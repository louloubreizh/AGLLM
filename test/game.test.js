import assert from "node:assert/strict";
import { test } from "node:test";
import LZString from "lz-string";
import { daysPerSeason, research } from "../src/game/catalog.js";
import { advanceDay, capacity, dailyRates, newGame, perform } from "../src/game/engine.js";
import { parseSave, restore, saveKey, serialize } from "../src/game/saves.js";
import { readGameState } from "../src/game-state.js";
import { chooseObservation, maximumResidents, planVillage } from "../src/world/layout.js";

test("la collecte, la construction et les métiers alimentent le village au fil des saisons", () => {
  const state = newGame();
  assert.equal(perform(state, "build", "shelter"), false);
  assert.equal(state.stocks.timber, 12);
  assert.equal(perform(state, "build", "garden"), true);
  for (let i = 0; i < 4; i += 1) assert.equal(perform(state, "gather", "timber"), true);
  assert.equal(perform(state, "build", "shelter"), true);
  assert.equal(perform(state, "assign", 1, "mapper"), false);
  assert.equal(perform(state, "assign", 1, "forager"), true);
  assert.equal(perform(state, "assign", 2, "forester"), true);
  assert.ok(dailyRates(state).food > 1);

  for (let i = 0; i < daysPerSeason; i += 1) advanceDay(state, () => 0.95);
  const snapshot = readGameState(state);
  assert.equal(snapshot.season, "summer");
  assert.equal(snapshot.day, 1);
  assert.equal(snapshot.weather, "warm");
  assert.equal(snapshot.population, 4);
  assert.deepEqual(snapshot.buildings.map(({ id, count, slot }) => ({ id, count, slot })), [
    { id: "garden", count: 1, slot: 0 }, { id: "shelter", count: 1, slot: 1 },
  ]);
  assert.equal(perform(state, "pause"), true);
  assert.equal(advanceDay(state), false);
  assert.equal(state.day, daysPerSeason);
});

test("le parcours avancé permet la fabrication, le commerce et l’inauguration du phare", () => {
  const state = newGame();
  function fillStocks() {
    for (const id of Object.keys(state.stocks)) state.stocks[id] = capacity(state, id);
  }
  fillStocks();
  assert.equal(perform(state, "research", "navigation"), false);
  assert.equal(perform(state, "build", "archive"), true);
  for (const id of Object.keys(research)) {
    fillStocks();
    assert.equal(perform(state, "research", id), true, id);
    assert.equal(perform(state, "research", id), false);
  }
  for (const id of ["studio", "pit", "lodge", "market", "foundry", "windmill", "mill", "wetland", "hall"]) {
    fillStocks();
    assert.equal(perform(state, "build", id), true, id);
  }
  state.stocks.boards = 0;
  assert.equal(perform(state, "craft", "boards"), true);
  assert.equal(perform(state, "automate", "boards"), true);
  assert.equal(perform(state, "lead", 1), true);
  for (let i = 0; i < 5; i += 1) advanceDay(state);
  assert.equal(state.stocks.boards, 6);
  assert.equal(perform(state, "trade", "provisions"), false);
  state.stocks.coins = 0;
  assert.equal(perform(state, "trade", "provisions"), true);
  assert.equal(perform(state, "festival"), true);
  assert.equal(perform(state, "festival"), false);
  state.stocks.relics = 0;
  assert.equal(perform(state, "depart", "banks"), true);
  assert.equal(perform(state, "depart", "ridge"), false);
  for (let i = 0; i < 12; i += 1) advanceDay(state);
  assert.equal(state.expedition, null);
  assert.equal(state.stocks.relics, 2);
  assert.deepEqual(state.journeys, ["banks"]);
  fillStocks();
  assert.equal(perform(state, "build", "beacon"), true);
  assert.equal(perform(state, "inaugurate"), true);
  assert.equal(perform(state, "inaugurate"), false);
  assert.deepEqual(parseSave(serialize(state)), { state, migrated: false });
});

test("importe les trois formats historiques et conserve la sauvegarde d’origine", () => {
  const previous = JSON.stringify({
    calendar: { year: 3, season: 3, day: 50 },
    resources: [{ name: "wood", value: 375 }, { name: "science", value: 42 }],
    buildings: [{ name: "hut", val: 2 }, { name: "library", val: 1 }, { name: "workshop", val: 1 }],
    village: { roster: [{ name: "Ébène", surname: "Mousse", job: "scholar", skills: 0 }] },
  });
  for (const input of [previous, LZString.compressToBase64(previous), LZString.compressToUTF16(previous)]) {
    const { state, migrated } = parseSave(input);
    assert.equal(migrated, true);
    assert.equal(state.stocks.timber, 375);
    assert.equal(state.stocks.notes, 42);
    assert.equal(state.buildings.shelter, 2);
    assert.deepEqual(state.researched, ["craft"]);
    assert.equal(state.residents[0].name, "Ébène Mousse");
    assert.equal(state.residents[0].job, "mapper");
    assert.equal(readGameState(state).year, 4);
    assert.equal(readGameState(state).season, "winter");
    advanceDay(state);
    assert.equal(state.stocks.timber, 375);
  }
  const entries = new Map([["previous.savedata", previous]]);
  const storage = { length: entries.size, key: (index) => [...entries.keys()][index], getItem: (key) => entries.get(key) ?? null };
  assert.equal(restore(storage).migrated, true);
  entries.set(saveKey, serialize(newGame()));
  assert.equal(restore(storage).migrated, false);
  assert.equal(entries.get("previous.savedata"), previous);
  assert.throws(() => parseSave('{"format":"AGLLM","version":4}'), /version/);
  assert.throws(() => parseSave('{"format":"AGLLM","version":1,"state":{}}'), /incomplète/);
});

test("conserve les parcelles et limite le coût visuel pour les grandes colonies", () => {
  const garden = { id: "garden", count: 999, slot: 0, stage: 0 };
  const shelter = { id: "shelter", count: 1, slot: 3, stage: 0 };
  const before = planVillage([shelter], 1);
  const after = planVillage([garden, shelter], 250);
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
