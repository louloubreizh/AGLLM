import { buildings, research, resources, trails } from "./catalog.js";
import { canUseJob, canUseRecipe, createResident, hasResearch, newGame } from "./engine.js";

export const saveKey = "agllm.save";
export const maxSavedStock = 1e12;
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
  for (const id of Object.keys(resources)) state.stocks[id] = limit(data.stocks[id], maxSavedStock);
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

export function parseSave(source) {
  if (typeof source !== "string" || !source.trim()) throw new Error("La sauvegarde est vide.");
  if (source.length > maxSaveLength) throw new Error("Le fichier de sauvegarde est trop volumineux.");
  let data;
  try {
    data = JSON.parse(source.trim());
  } catch {
    throw new Error("Impossible de lire le contenu de la sauvegarde.");
  }
  if (data?.format !== "AGLLM") throw new Error("Ce fichier n’est pas une sauvegarde AGLLM.");
  if (data.version !== 1) throw new Error("Cette version de sauvegarde AGLLM n’est pas prise en charge.");
  return normalize(data.state);
}

export function restore(storage) {
  const current = storage.getItem(saveKey);
  return current === null ? newGame() : parseSave(current);
}
