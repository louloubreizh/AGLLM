import LZString from "lz-string";
import { buildings, daysPerSeason, jobs, recipes, research, resources, trails } from "./catalog.js";
import { addEvent, canUseJob, canUseRecipe, createResident, hasResearch, newGame } from "./engine.js";

export const saveKey = "agllm.save";
const maxSaveLength = 1_500_000;
const limit = (value, max) => Number.isFinite(value) ? Math.min(max, Math.max(0, value)) : 0;
const whole = (value, max) => Math.floor(limit(value, max));
const text = (value, max) => typeof value === "string" ? value.slice(0, max) : "";
const list = (value) => Array.isArray(value) ? value : [];
const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const contains = (catalog, id) => typeof id === "string" && Object.hasOwn(catalog, id);
const known = (catalog, values) => [...new Set(list(values).filter((id) => contains(catalog, id)))];

export function serialize(state) {
  return JSON.stringify({ format: "AGLLM", version: 1, state });
}

function normalize(data) {
  if (!object(data) || !object(data.stocks) || !object(data.buildings) || !Array.isArray(data.residents)) {
    throw new Error("La sauvegarde est incomplète.");
  }
  const state = newGame();
  state.day = whole(data.day, 10_000_000);
  state.weather = ["cold", "warm"].includes(data.weather) ? data.weather : null;
  state.speed = data.speed === 2 ? 2 : 1;
  state.paused = data.paused === true;
  for (const [id, item] of Object.entries(buildings)) state.buildings[id] = whole(data.buildings[id], item.limit ?? 250);
  for (const id of Object.keys(resources)) state.stocks[id] = limit(data.stocks[id], 1e12);
  state.researched = known(research, data.researched);
  state.disabled = known(buildings, data.disabled).filter((id) => buildings[id].switchable);
  state.irrigated = Boolean(state.buildings.garden && data.irrigated === true);
  const residentIds = new Set();
  state.residents = data.residents.slice(0, 500).flatMap((resident) => {
    if (!object(resident)) return [];
    const id = whole(resident.id, 1e8);
    if (!id || residentIds.has(id)) return [];
    residentIds.add(id);
    const defaults = createResident(id, state.day);
    return [{
      id, name: text(resident.name, 80) || defaults.name, species: text(resident.species, 30) || defaults.species,
      joined: whole(resident.joined, state.day), job: canUseJob(state, resident.job) ? resident.job : null,
      experience: whole(resident.experience, 1e8), rank: whole(resident.rank, 3), favorite: resident.favorite === true,
    }];
  });
  state.nextResident = Math.max(whole(data.nextResident, 1e8), 1 + Math.max(0, ...residentIds));
  state.leader = state.buildings.hall && residentIds.has(data.leader) ? data.leader : null;
  state.festivalUntil = whole(data.festivalUntil, state.day + 20);
  state.pollution = limit(data.pollution, 500);
  state.hunger = whole(data.hunger, 100);
  state.growth = whole(data.growth, 12);
  if (hasResearch(state, "automation") && canUseRecipe(state, data.automation)) state.automation = data.automation;
  if (object(data.expedition) && contains(trails, data.expedition.id) && state.buildings.lodge) {
    const { id, returns } = data.expedition;
    state.expedition = { id, returns: Math.max(state.day + 1, whole(returns, state.day + trails[id].duration)) };
  }
  state.journeys = known(trails, data.journeys);
  state.inaugurated = Boolean(state.buildings.beacon && data.inaugurated === true);
  state.journal = list(data.journal).filter(object).slice(0, 60).map((event) =>
    ({ day: whole(event.day, state.day), text: text(event.text, 240) })).filter(({ text: entry }) => entry);
  return state;
}

const previousResources = {
  catnip: "food", wood: "timber", minerals: "stone", science: "notes", beam: "boards", slab: "stone",
  iron: "metal", steel: "metal", furs: "cloth", gold: "coins", relic: "relics",
};
const previousBuildings = {
  field: "garden", hut: "shelter", logHouse: "lodge", mansion: "lodge", barn: "storehouse", warehouse: "storehouse",
  library: "archive", workshop: "studio", mine: "pit", quarry: "pit", tradepost: "market", smelter: "foundry",
  factory: "mill", solarfarm: "windmill", amphitheatre: "hall", observatory: "archive",
};
const previousResearch = {
  agriculture: "cultivation", construction: "craft", mining: "masonry", currency: "routes", metal: "kilns",
  electricity: "power", ecology: "river", civil: "council",
};
const previousJobs = {
  farmer: "forager", woodcutter: "forester", geologist: "potter", scholar: "mapper", miner: "mason", engineer: "weaver",
};

function migrate(data) {
  if (!object(data?.calendar) || !Array.isArray(data.resources) || !Array.isArray(data.buildings)
    || !data.resources.some((entry) => contains(previousResources, entry?.name))
    || !data.buildings.some((entry) => contains(previousBuildings, entry?.name))) {
    throw new Error("Ce format de sauvegarde n’est pas reconnu.");
  }

  const state = newGame();
  state.day = whole(data.calendar.year, 80_000) * 4 * daysPerSeason
    + whole(data.calendar.season, 3) * daysPerSeason + whole(data.calendar.day * daysPerSeason / 100, daysPerSeason - 1);
  state.weather = data.calendar.weather;
  const mappedStocks = new Map();
  for (const entry of data.resources.filter(object)) {
    if (contains(previousResources, entry.name)) {
      const id = previousResources[entry.name];
      mappedStocks.set(id, Math.max(mappedStocks.get(id) ?? 0, limit(entry.value, 1e12)));
    }
  }
  for (const [id, value] of mappedStocks) state.stocks[id] = value;
  for (const entry of data.buildings.filter(object)) {
    if (contains(previousBuildings, entry.name)) state.buildings[previousBuildings[entry.name]] += whole(entry.val, 250);
  }
  for (const entry of list(data.science?.techs).filter(object)) {
    if (entry.researched === true && contains(previousResearch, entry.name)) state.researched.push(previousResearch[entry.name]);
  }
  for (const [id, item] of Object.entries(buildings)) {
    if (state.buildings[id] && item.requires) state.researched.push(item.requires);
  }
  for (const id of state.researched) {
    for (const prerequisite of research[id].after ?? []) {
      if (!state.researched.includes(prerequisite)) state.researched.push(prerequisite);
    }
  }
  if (object(data.village)) {
    const roster = Object.values(data.village).find((group) => Array.isArray(group)
      && group.some((entry) => object(entry) && ("seed" in entry || "ssn" in entry || "surname" in entry || "skills" in entry)));
    if (roster) {
      const oldJobs = list(data.village.jobs);
      state.residents = roster.slice(0, 500).filter(object).map((entry, index) => {
        const resident = createResident(index + 1, state.day);
        const job = Number.isInteger(entry.job) ? oldJobs[entry.job]?.name : entry.job;
        if (entry.isLeader === true) state.leader = resident.id;
        return {
          ...resident, name: text(entry.name, 40) ? `${entry.name} ${text(entry.surname, 35)}`.trim() : resident.name,
          job: contains(previousJobs, job) ? previousJobs[job] : null,
          experience: entry.exp, rank: entry.rank, favorite: entry.favorite,
        };
      });
    }
  }
  state.festivalUntil = state.day + whole(data.calendar.festivalDays, 20);
  state.journal = [];
  addEvent(state, "La sauvegarde précédente a été adaptée aux règles d’AGLLM.");
  return normalize(state);
}

export function parseSave(source) {
  if (typeof source !== "string" || !source.trim()) throw new Error("La sauvegarde est vide.");
  if (source.length > maxSaveLength) throw new Error("Le fichier de sauvegarde est trop volumineux.");
  const value = source.trimStart();
  let data;
  try {
    if (value.startsWith("{")) {
      data = JSON.parse(value);
    } else {
      const base64 = /^[A-Za-z0-9+/=\s]+$/.test(value) ? LZString.decompressFromBase64(value.replace(/\s+/g, "")) : null;
      const unpacked = base64?.startsWith("{") ? base64 : LZString.decompressFromUTF16(source);
      if (!unpacked?.startsWith("{") || unpacked.length > maxSaveLength * 4) throw new Error();
      data = JSON.parse(unpacked);
    }
  } catch {
    throw new Error("Impossible de lire le contenu de la sauvegarde.");
  }
  if (data?.format !== "AGLLM") return { state: migrate(data), migrated: true };
  if (data.version !== 1) throw new Error("Cette version de sauvegarde AGLLM n’est pas prise en charge.");
  return { state: normalize(data.state), migrated: false };
}

export function restore(storage) {
  const current = storage.getItem(saveKey);
  if (current !== null) return parseSave(current);
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key?.endsWith(".savedata")) {
      try {
        const result = parseSave(storage.getItem(key));
        if (result.migrated) return result;
      } catch {
        // A different game or an incomplete save may use the same suffix.
      }
    }
  }
  return { state: newGame(), migrated: false };
}
