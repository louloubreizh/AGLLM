import assert from "node:assert/strict";
import { test } from "node:test";
import LZString from "lz-string";
import { daysPerSeason, research } from "../src/game/catalog.js";
import { advanceDay, capacity, dailyRates, newGame, perform, recipeOutput } from "../src/game/engine.js";
import { maxSavedStock, parseSave, restore, saveKey, serialize } from "../src/game/saves.js";
import { copyStocksToAGLLM, copyStocksToKittensGame, parseTransferSave } from "../src/game/stock-transfer.js";
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
  assert.deepEqual(parseSave(serialize(state)), state);
});

test("applique le rendement des ateliers en fabrication manuelle et automatique", () => {
  const state = newGame();
  state.researched = ["craft", "automation"];
  state.buildings.studio = 2;
  Object.assign(state.stocks, { timber: 20, boards: 56.71 });

  assert.deepEqual(recipeOutput(state, "boards"), { boards: 3.3 });
  assert.equal(perform(state, "craft", "boards"), false);
  assert.equal(state.stocks.timber, 20);
  state.stocks.boards = 56.7;
  assert.equal(perform(state, "craft", "boards"), true);
  assert.equal(state.stocks.boards, 60);
  assert.equal(state.stocks.timber, 11);

  state.stocks.boards = 50;
  state.day = 4;
  assert.equal(perform(state, "automate", "boards"), true);
  assert.equal(advanceDay(state), true);
  assert.equal(state.stocks.boards, 53.3);
  assert.equal(state.stocks.timber, 2);

  state.buildings.studio = 9;
  assert.deepEqual(recipeOutput(state, "boards"), { boards: 4.5 });
});

test("restaure une sauvegarde AGLLM v1 et lit uniquement sa clé de stockage", () => {
  const state = newGame();
  state.stocks.metal = 27;
  state.stocks.clay = 8;
  const reads = [];
  let saved = null;
  const storage = { getItem(key) { reads.push(key); return saved; } };

  assert.deepEqual(restore(storage), newGame());
  saved = serialize(state);
  assert.deepEqual(restore(storage), state);
  assert.deepEqual(reads, [saveKey, saveKey]);
  assert.throws(() => parseSave('{"format":"autre","version":1,"state":{}}'), /pas une sauvegarde AGLLM/);
  assert.throws(() => parseSave('{"format":"AGLLM","version":4}'), /version/);
  assert.throws(() => parseSave('{"format":"AGLLM","version":1,"state":{}}'), /incomplète/);
});

test("transfère les stocks correspondants entre deux copies de sauvegardes", () => {
  const destination = newGame();
  destination.stocks.metal = 19.5;
  destination.stocks.notes = 42;
  const foreign = {
    saveVersion: 15,
    calendar: { year: 101 },
    village: {},
    buildings: [{ name: "hut", val: 3 }],
    resources: [
      { name: "wood", value: 165.25, unlocked: true },
      { name: "iron", value: 31, isHidden: true },
      { name: "science", value: 123.5, unlocked: true },
      { name: "minerals", value: 80 },
    ],
  };
  const json = JSON.stringify(foreign);
  for (const source of [json, LZString.compressToBase64(json), LZString.compressToUTF16(json)]) {
    const transfer = parseTransferSave(source);
    assert.deepEqual(parseSave(copyStocksToAGLLM(destination, transfer)), {
      ...destination, stocks: { ...destination.stocks, timber: 165.25, metal: 31, notes: 123.5 },
    });
    const returned = JSON.parse(LZString.decompressFromBase64(copyStocksToKittensGame(destination, transfer)));
    assert.deepEqual(returned, {
      ...foreign, resources: [
        { ...foreign.resources[0], value: 12 },
        { ...foreign.resources[1], value: 19.5 },
        { ...foreign.resources[2], value: 42 },
        foreign.resources[3],
      ],
    });
    assert.deepEqual(transfer.save, foreign);
  }
  assert.equal(destination.stocks.metal, 19.5);
  assert.throws(() => parseTransferSave(serialize(destination)), /sauvegarde Kittens Game/);
  foreign.resources[1].value = -1;
  assert.throws(() => parseTransferSave(JSON.stringify(foreign)), /stock.*invalide/);
  const tooLarge = { ...foreign, resources: [{ name: "science", value: maxSavedStock + 1 }] };
  assert.throws(() => copyStocksToAGLLM(destination, parseTransferSave(JSON.stringify(tooLarge))), /Science.*dépasse/);
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
