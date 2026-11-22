import { buildings } from "./game/catalog.js";
import { calendar, energy, hasResearch, morale } from "./game/engine.js";

export function readGameState(state) {
  if (!state) return null;
  return {
    ...calendar(state.day),
    weather: state.weather,
    paused: state.paused,
    population: state.residents.length,
    buildings: Object.entries(buildings).flatMap(([id, item], slot) => state.buildings[id] ? [{
      id, label: item.label, model: item.model, count: state.buildings[id], slot,
      stage: Number(id === "garden" && state.irrigated),
    }] : []),
    toolbar: {
      happiness: Math.round(morale(state)),
      energy: hasResearch(state, "power") ? energy(state) : null,
      pollution: Math.round(state.pollution),
      pollutionVisible: state.pollution > 0 || hasResearch(state, "river"),
    },
  };
}
