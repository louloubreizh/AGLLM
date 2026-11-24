import assert from "node:assert/strict";
import { test } from "node:test";
import { villageIndicators } from "../src/village-indicators.js";

test("les prévisions reprennent le festival, la production hivernale et la dissipation", () => {
  const game = {
    opts: { disablePollution: false },
    calendar: { festivalDays: 4, ticksPerDay: 10 },
    resPool: { energyProd: 25, energyCons: 22, energyWinterProd: 17 },
    village: {
      happiness: 1.5,
      getKittens: () => 7,
      getUnhappiness: () => 4,
      getOverpopulation: () => 1,
      getEnvironmentEffect: () => -2,
      getHappinessFromKarma: () => 5,
    },
    bld: {
      cathPollution: 10000,
      cathPollutionPerTick: 100,
      pollutionEffects: { pollutionDissipationRatio: 0.1 },
      getPollutionLevelBase: () => 10000,
      getPollutionLevel: () => 1,
      getEquilibriumPollution: () => 11000,
    },
    getEffect: (name) => ({ festivalRatio: 0.2, happiness: 7 }[name]),
  };
  const { happiness, energy, pollution } = villageIndicators(game);
  assert.deepEqual(happiness, {
    value: 150, afterFestival: 114, festivalDays: 4, festival: 36,
    buildings: 7, environment: -2, population: -6, karma: 5,
  });
  assert.deepEqual(energy, { production: 25, consumption: 22, winterProduction: 17 });
  assert.equal(pollution.value, 100);
  assert.equal(pollution.level, 1);
  assert.equal(pollution.dailyChange, 10);
  assert.equal(pollution.equilibrium, 110);
  assert.ok(Math.abs(pollution.tomorrow - 106.3212055883) < 1e-8);

  game.bld.cathPollutionPerTick = -2000;
  game.bld.pollutionEffects.pollutionDissipationRatio = 0;
  assert.equal(villageIndicators(game).pollution.tomorrow, 0);
});
