import {
  buildings, daysPerSeason, festival, gathering, irrigation, jobs, recipes, research, resources, seasons, trades, trails,
} from "./catalog.js";

const names = ["Amande", "Biscotte", "Cèdre", "Dune", "Érable", "Fougère", "Galet", "Hibou", "Iris", "Jonc", "Lichen", "Mousse"];
const species = ["Lapin", "Blaireau", "Loutre", "Hérisson", "Renard", "Écureuil"];
const seasonYield = [1.15, 1, 1.3, 0.48];
const blank = (catalog) => Object.fromEntries(Object.keys(catalog).map((id) => [id, 0]));
const find = (catalog, id) => typeof id === "string" && Object.hasOwn(catalog, id) ? catalog[id] : undefined;
const numberInStock = (state, id) => state.stocks[id] ?? 0;
const roundStock = (value) => Math.round(value * 1e6) / 1e6;

export function createResident(id, day) {
  return {
    id, name: names[(id - 1) % names.length], species: species[Math.floor((id - 1) / names.length + id - 1) % species.length],
    joined: day, job: null, experience: 0, rank: 0, favorite: false,
  };
}

export function newGame() {
  const state = {
    day: 0,
    weather: null,
    stocks: { ...blank(resources), food: 36, timber: 12, clay: 8 },
    buildings: blank(buildings),
    researched: [],
    residents: [createResident(1, 0), createResident(2, 0)],
    nextResident: 3,
    disabled: [],
    irrigated: false,
    leader: null,
    festivalUntil: 0,
    pollution: 0,
    hunger: 0,
    growth: 0,
    automation: null,
    expedition: null,
    journeys: [],
    inaugurated: false,
    paused: false,
    speed: 1,
    journal: [],
  };
  addEvent(state, "Le village s’installe à l’orée du bois.");
  return state;
}

export function calendar(day) {
  const season = Math.floor(day / daysPerSeason) % seasons.length;
  return { year: Math.floor(day / (daysPerSeason * seasons.length)) + 1, day: day % daysPerSeason + 1, season: seasons[season] };
}

export function addEvent(state, text) {
  state.journal.unshift({ day: state.day, text });
  if (state.journal.length > 60) state.journal.length = 60;
}

export function hasResearch(state, id) {
  return !id || state.researched.includes(id);
}

export function canStudy(state, id) {
  const item = find(research, id);
  return Boolean(item && state.buildings.archive && !hasResearch(state, id)
    && (item.after ?? []).every((entry) => hasResearch(state, entry)));
}

export function capacity(state, id) {
  return resources[id].capacity + state.buildings.storehouse * 60;
}

export function housing(state) {
  return 2 + state.buildings.shelter * 2 + state.buildings.lodge * 4;
}

export function buildingCost(state, id) {
  const { cost } = buildings[id];
  const factor = 1 + 0.18 * state.buildings[id];
  return Object.fromEntries(Object.entries(cost).map(([resource, amount]) => [resource, Math.ceil(amount * factor)]));
}

export function canPay(state, cost) {
  return Object.entries(cost).every(([id, amount]) => numberInStock(state, id) >= amount);
}

export function hasRoom(state, output, cost = {}) {
  return Object.entries(output).every(([id, amount]) =>
    roundStock(numberInStock(state, id) - (cost[id] ?? 0) + amount) <= capacity(state, id));
}

function changeStocks(state, changes, direction = 1) {
  for (const [id, amount] of Object.entries(changes)) {
    const current = numberInStock(state, id);
    const value = Math.min(Math.max(current, capacity(state, id)), Math.max(0, current + direction * amount));
    state.stocks[id] = roundStock(value);
  }
}

export function canUseJob(state, id) {
  const job = find(jobs, id);
  return Boolean(job && (!job.building || state.buildings[job.building]));
}

export function canUseRecipe(state, id) {
  const recipe = find(recipes, id);
  return Boolean(state.buildings.studio && recipe && hasResearch(state, recipe.requires));
}

export function recipeOutput(state, id) {
  const { craftBonusPerExtra, craftBonusMax } = buildings.studio;
  const bonus = Math.min(craftBonusMax, Math.max(0, state.buildings.studio - 1) * craftBonusPerExtra);
  return Object.fromEntries(Object.entries(recipes[id].output).map(([resource, amount]) =>
    [resource, roundStock(amount * (1 + bonus / 100))]));
}

export function morale(state) {
  return Math.min(125, Math.max(25, 100 + Math.min(15, 3 * state.buildings.hall)
    + (state.festivalUntil > state.day ? 10 : 0) - state.hunger * 4 - state.pollution / 5));
}

function active(state, id) {
  return state.disabled.includes(id) ? 0 : state.buildings[id];
}

export function energy(state) {
  const winterProduction = active(state, "windmill") * 5;
  return {
    production: calendar(state.day).season === "winter" ? winterProduction : active(state, "windmill") * 3,
    consumption: active(state, "mill") * 2,
    winterProduction,
  };
}

export function dailyRates(state) {
  const rates = blank(resources);
  const index = seasons.indexOf(calendar(state.day).season);
  const yieldFactor = seasonYield[index] * (state.weather === "cold" ? 0.88 : state.weather === "warm" ? 1.08 : 1);
  rates.food = state.buildings.garden * (state.irrigated ? 1.6 : 1) * yieldFactor - 0.36 * state.residents.length;
  rates.notes = state.buildings.archive * 0.66;
  rates.stone = state.buildings.pit * 0.5;

  const mood = morale(state) / 100;
  const leader = state.residents.find(({ id }) => id === state.leader);
  const leadership = leader ? 1.04 + 0.02 * leader.rank : 1;
  for (const { job, rank } of state.residents) {
    if (!job) continue;
    const { resource, rate } = jobs[job];
    rates[resource] += rate * mood * leadership * (1 + 0.12 * rank) * (resource === "food" ? yieldFactor : 1);
  }

  const metalSpace = Math.max(0, capacity(state, "metal") - state.stocks.metal);
  const furnaces = Math.min(active(state, "foundry"), state.stocks.stone / 0.6, metalSpace / 0.31);
  rates.stone -= furnaces * 0.6;
  rates.metal += furnaces * 0.31;
  const power = energy(state);
  const clothSpace = Math.max(0, capacity(state, "cloth") - state.stocks.cloth);
  const mills = Math.min(active(state, "mill"), Math.floor(power.production / 2), state.stocks.timber / 0.45, clothSpace / 0.4);
  rates.timber -= mills * 0.45;
  rates.cloth += mills * 0.4;
  return rates;
}

function finishExpedition(state) {
  const id = state.expedition.id;
  const trail = trails[id];
  changeStocks(state, trail.output);
  state.expedition = null;
  if (!state.journeys.includes(id)) state.journeys.push(id);
  addEvent(state, `L’expédition « ${trail.label} » est revenue au village.`);
}

export function advanceDay(state, random = Math.random) {
  if (state.paused) return false;
  const rates = dailyRates(state);
  const foodShortage = state.stocks.food + rates.food < 0;
  state.pollution = Math.max(0, Math.min(500, state.pollution + (rates.metal > 0 ? rates.metal * 3 : 0)
    - 0.3 - state.buildings.wetland * 1.4));
  changeStocks(state, rates);
  state.day += 1;

  if (state.day % daysPerSeason === 0) {
    const roll = random();
    state.weather = roll < 0.18 ? "cold" : roll > 0.82 ? "warm" : null;
    addEvent(state, "Une nouvelle saison commence.");
  }
  if (foodShortage) {
    if (state.hunger === 0) addEvent(state, "Les réserves de vivres sont épuisées.");
    state.hunger = Math.min(state.hunger + 1, 100);
    if (state.hunger >= 10 && state.residents.length > 1) {
      const resident = state.residents.pop();
      if (state.leader === resident.id) state.leader = null;
      state.hunger = 6;
      addEvent(state, `${resident.name} est parti chercher des vivres ailleurs.`);
    }
  } else {
    state.hunger = Math.max(0, state.hunger - 2);
    if (state.residents.length < housing(state) && state.stocks.food >= 14) {
      state.growth += 1;
      if (state.growth >= 12 && state.residents.length < 500) {
        const resident = createResident(state.nextResident++, state.day);
        state.residents.push(resident);
        state.growth = 0;
        addEvent(state, `${resident.name} rejoint le village.`);
      }
    }
  }

  for (const resident of state.residents) {
    if (resident.job) resident.experience += 1;
  }
  if (state.expedition?.returns <= state.day) finishExpedition(state);
  if (state.automation && state.day % 5 === 0) {
    craftRecipe(state, state.automation);
  }
  return true;
}

function exchange(state, item) {
  if (!item || !canPay(state, item.cost) || !hasRoom(state, item.output, item.cost)) return false;
  changeStocks(state, item.cost, -1);
  changeStocks(state, item.output);
  return true;
}

function craftRecipe(state, id) {
  return canUseRecipe(state, id) && exchange(state, { cost: recipes[id].cost, output: recipeOutput(state, id) });
}

const commands = {
  gather(state, id) {
    const amount = find(gathering, id);
    if (!amount || state.stocks[id] >= capacity(state, id)) return false;
    changeStocks(state, { [id]: amount });
    return true;
  },
  build(state, id) {
    const item = find(buildings, id);
    if (!item || !hasResearch(state, item.requires) || state.buildings[id] >= (item.limit ?? 250)) return false;
    const cost = buildingCost(state, id);
    if (!canPay(state, cost)) return false;
    changeStocks(state, cost, -1);
    state.buildings[id] += 1;
    addEvent(state, `Construction terminée · ${item.label}.`);
    return true;
  },
  switchBuilding(state, id) {
    if (!find(buildings, id)?.switchable || !state.buildings[id]) return false;
    state.disabled = state.disabled.includes(id) ? state.disabled.filter((entry) => entry !== id) : [...state.disabled, id];
    return true;
  },
  irrigate(state) {
    if (state.irrigated || !state.buildings.garden || !hasResearch(state, "cultivation") || !canPay(state, irrigation)) return false;
    changeStocks(state, irrigation, -1);
    state.irrigated = true;
    addEvent(state, "Les jardins sont désormais irrigués.");
    return true;
  },
  research(state, id) {
    if (!canStudy(state, id)) return false;
    const item = research[id];
    if (!canPay(state, item.cost)) return false;
    changeStocks(state, item.cost, -1);
    state.researched.push(id);
    addEvent(state, `Recherche terminée · ${item.label}.`);
    return true;
  },
  craft: craftRecipe,
  trade: (state, id) => Boolean(state.buildings.market && exchange(state, find(trades, id))),
  automate(state, id) {
    if (!hasResearch(state, "automation") || (id !== null && !canUseRecipe(state, id))) return false;
    state.automation = id;
    return true;
  },
  assign(state, id, job) {
    const resident = state.residents.find((entry) => entry.id === id);
    if (!resident || (job !== null && !canUseJob(state, job))) return false;
    resident.job = job;
    return true;
  },
  favorite(state, id) {
    const resident = state.residents.find((entry) => entry.id === id);
    if (!resident) return false;
    resident.favorite = !resident.favorite;
    return true;
  },
  lead(state, id) {
    if (!state.buildings.hall || !state.residents.some((resident) => resident.id === id)) return false;
    state.leader = state.leader === id ? null : id;
    return true;
  },
  promote(state, id) {
    const resident = state.residents.find((entry) => entry.id === id);
    const cost = promotionCost(resident);
    if (!cost || !canPay(state, cost)) return false;
    changeStocks(state, cost, -1);
    resident.rank += 1;
    return true;
  },
  festival(state) {
    if (!state.buildings.market || state.festivalUntil > state.day || !canPay(state, festival)) return false;
    changeStocks(state, festival, -1);
    state.festivalUntil = state.day + 20;
    addEvent(state, "La fête des rives commence et remonte le moral du village.");
    return true;
  },
  depart(state, id) {
    const trail = find(trails, id);
    if (!trail || !state.buildings.lodge || state.expedition || !hasResearch(state, trail.requires) || !canPay(state, trail.cost)) return false;
    changeStocks(state, trail.cost, -1);
    state.expedition = { id, returns: state.day + trail.duration };
    addEvent(state, `Départ de l’expédition « ${trail.label} ».`);
    return true;
  },
  inaugurate(state) {
    if (!state.buildings.beacon || state.inaugurated) return false;
    state.inaugurated = true;
    addEvent(state, "Le phare des migrations s’allume. Le village devient un refuge pour les voyageurs.");
    return true;
  },
  pause(state) {
    state.paused = !state.paused;
    return true;
  },
  speed(state, id) {
    if (id !== 1 && id !== 2) return false;
    state.speed = id;
    return true;
  },
};

export function promotionCost(resident) {
  if (!resident || resident.rank >= 3 || resident.experience < (resident.rank + 1) * 24) return null;
  return { coins: 6 * (resident.rank + 1) };
}

export function perform(state, command, id, value) {
  return find(commands, command)?.(state, id, value) ?? false;
}
