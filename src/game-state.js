export function readGameState(game) {
  if (!game?.calendar || typeof game.village?.getKittens !== "function"
    || !Array.isArray(game.bld?.buildingsData)) {
    return null;
  }

  const count = (value) => Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  const calendar = game.calendar;
  const season = calendar.getCurSeason?.()?.name
    ?? ["spring", "summer", "autumn", "winter"][calendar.season];
  const population = count(game.village.getKittens());
  const pool = game.resPool;
  const energy = game.science?.get("electricity")?.researched && pool
    ? { production: pool.energyProd, consumption: pool.energyCons, winterProduction: pool.energyWinterProd }
    : null;
  const ecology = game.science?.get("ecology")?.researched;
  const pollutionVisible = !game.opts?.disablePollution && (game.bld.cathPollution > 100000 || ecology);
  const buildings = [];
  for (const [slot, building] of game.bld.buildingsData.entries()) {
    const quantity = count(building.val);
    if (quantity > 0) {
      buildings.push({
        id: building.name,
        label: building.stages?.[building.stage]?.label || building.label || building.name,
        count: quantity,
        stage: count(building.stage),
        slot,
      });
    }
  }

  return {
    year: count(calendar.year) + 1,
    day: Number.isFinite(calendar.day) ? Math.floor(calendar.day) + 1 : 1,
    season: ["spring", "summer", "autumn", "winter"].includes(season) ? season : "spring",
    weather: calendar.weather === "warm" || calendar.weather === "cold" ? calendar.weather : null,
    paused: Boolean(game.isPaused),
    population,
    buildings,
    toolbar: {
      tickTime: game.isLocalhost && Number.isFinite(game.fps?.ms) ? game.fps.ms : null,
      happiness: population > 5 && Number.isFinite(game.village.happiness) ? Math.floor(game.village.happiness * 100) : null,
      energy,
      pollution: pollutionVisible && ecology
        ? 100 * game.bld.cathPollution / game.bld.getPollutionLevelBase()
        : null,
      pollutionVisible: Boolean(pollutionVisible),
      sorrow: pool?.get("sorrow")?.value || null,
    },
  };
}
