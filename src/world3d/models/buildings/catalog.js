import { buildingUpgrades } from "./upgrades.js";
import { field } from "./agriculture/field.js";
import { pasture } from "./agriculture/pasture.js";
import { solarFarm } from "./energy/solar-farm.js";
import { aqueduct } from "./infrastructure/aqueduct.js";
import { hydroplant } from "./energy/hydro-plant.js";
import { hut } from "./housing/hut.js";
import { logHouse } from "./housing/log-house.js";
import { mansion } from "./housing/mansion.js";
import { library } from "./civic/library.js";
import { dataCenter } from "./civic/data-center.js";
import { academy } from "./civic/academy.js";
import { observatory } from "./civic/observatory.js";
import { biolab } from "./civic/biolab.js";
import { barn } from "./commerce/barn.js";
import { warehouse } from "./commerce/warehouse.js";
import { spaceport } from "./infrastructure/spaceport.js";
import { harbor } from "./infrastructure/harbor.js";
import { mine } from "./industry/mine.js";
import { quarry } from "./industry/quarry.js";
import { smelter } from "./industry/smelter.js";
import { calciner } from "./industry/calciner.js";
import { steamworks } from "./energy/steamworks.js";
import { magneto } from "./energy/magneto.js";
import { lumberMill } from "./industry/lumber-mill.js";
import { oilWell } from "./industry/oil-well.js";
import { workshop } from "./industry/workshop.js";
import { factory } from "./industry/factory.js";
import { reactor } from "./energy/reactor.js";
import { accelerator } from "./energy/accelerator.js";
import { tradepost } from "./commerce/tradepost.js";
import { mint } from "./commerce/mint.js";
import { brewery } from "./commerce/brewery.js";
import { amphitheatre } from "./culture/amphitheatre.js";
import { broadcasttower } from "./culture/broadcast-tower.js";
import { chapel } from "./culture/chapel.js";
import { temple } from "./culture/temple.js";
import { unicornPasture } from "./agriculture/unicorn-pasture.js";
import { ziggurat } from "./culture/ziggurat.js";
import { chronosphere } from "./technology/chronosphere.js";
import { aiCore } from "./technology/ai-core.js";
import { zebraOutpost } from "./frontier/zebra-outpost.js";
import { zebraWorkshop } from "./frontier/zebra-workshop.js";
import { zebraForge } from "./frontier/zebra-forge.js";
import { stasisPod } from "./technology/stasis-pod.js";
import { ivoryTemple } from "./frontier/ivory-temple.js";

export const buildingDesigns = {
  field, pasture, solarfarm: solarFarm, aqueduct, hydroplant,
  hut, logHouse, mansion, library, dataCenter,
  academy, observatory, biolab, barn, warehouse,
  spaceport, harbor, mine, quarry, smelter,
  calciner, steamworks, magneto, lumberMill, oilWell,
  workshop, factory, reactor, accelerator, tradepost,
  mint, brewery, amphitheatre, broadcasttower, chapel,
  temple, unicornPasture, ziggurat, chronosphere, aiCore,
  zebraOutpost, zebraWorkshop, zebraForge, stasisPod, ivoryTemple,
};

export function buildingModelId(id, stage) {
  return stage > 0 && Object.hasOwn(buildingUpgrades, id) ? buildingUpgrades[id] : id;
}
