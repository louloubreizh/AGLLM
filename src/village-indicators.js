export function villageIndicators(game) {
  const { calendar, bld, village, resPool } = game;
  const inhabitants = village.getKittens();
  const festivalDays = calendar.festivalDays;
  const festival = festivalDays > 0 ? 30 * (1 + game.getEffect("festivalRatio")) : 0;
  const happiness = village.happiness * 100;

  const pollutionScale = 100 / bld.getPollutionLevelBase();
  const concentration = bld.cathPollution;
  const rate = bld.cathPollutionPerTick;
  const decay = bld.pollutionEffects.pollutionDissipationRatio;
  const ticks = calendar.ticksPerDay;
  const horizon = decay > 0 ? -Math.expm1(-decay * ticks) / decay : ticks;
  const equilibrium = bld.getEquilibriumPollution();

  return {
    happiness: {
      value: Math.floor(happiness),
      afterFestival: Math.floor(Math.max(25, happiness - festival)),
      festivalDays,
      festival,
      buildings: game.getEffect("happiness"),
      environment: village.getEnvironmentEffect(),
      population: -(inhabitants > 5 ? village.getUnhappiness() : 0) - 2 * Math.max(0, village.getOverpopulation()),
      karma: village.getHappinessFromKarma(),
    },
    energy: {
      production: resPool.energyProd,
      consumption: resPool.energyCons,
      winterProduction: resPool.energyWinterProd,
    },
    pollution: {
      hidden: game.opts.disablePollution,
      value: concentration * pollutionScale,
      level: bld.getPollutionLevel(),
      dailyChange: rate * ticks * pollutionScale,
      tomorrow: Math.max(0, concentration + rate * horizon) * pollutionScale,
      equilibrium: equilibrium < 0 ? null : equilibrium * pollutionScale,
    },
  };
}
