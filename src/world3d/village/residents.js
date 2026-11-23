import { createCat } from "../models/fauna/cat.js";
import { trailHeight } from "../models/infrastructure/trail.js";
import { createModelGroup } from "../models/model-group.js";
import { projectOntoRoad, roadSample } from "./road-network.js";

const turn = Math.PI * 2;

export function createVillageResidents(resources) {
  const group = createModelGroup("Residents");
  const walkers = [];
  let network;
  let previousTime;

  function place(walker, elapsed) {
    const { road, distance, direction, cat } = walker;
    const sample = roadSample(road, distance);
    const yaw = sample.yaw + (direction < 0 ? Math.PI : 0);
    const lane = Math.min(0.045, (road.width - 0.29) / 2)
      * Math.min(1, distance * 3, (road.length - distance) * 3);
    const x = sample.x + Math.cos(yaw) * lane;
    const z = sample.z - Math.sin(yaw) * lane;
    cat.model.position.set(x, trailHeight(x, z) + 0.006, z);
    const delta = yaw - cat.model.rotation.y;
    cat.model.rotation.y += Math.atan2(Math.sin(delta), Math.cos(delta)) * (elapsed === undefined ? 1 : Math.min(1, elapsed * 12));
    cat.stride(walker.travelled);
  }

  function update(count, nextNetwork) {
    if (network?.key === nextNetwork.key && count === walkers.length) return;
    network = nextNetwork;
    const roads = [...network.roads.values()];
    while (walkers.length > count) walkers.pop().cat.model.removeFromParent();
    while (walkers.length < count) {
      const index = walkers.length;
      const cat = createCat(resources, index);
      walkers.push({ index, cat, travelled: index * 0.319, visits: 0 });
      group.add(cat.model);
    }

    const totalLength = roads.reduce((sum, road) => sum + road.length, 0);
    for (const walker of walkers) {
      if (walker.road && network.roads.has(walker.road.id)) continue;
      if (walker.road) {
        const { x, z } = walker.cat.model.position;
        let nearest = Infinity;
        for (const road of roads) {
          const { along, distanceSquared } = projectOntoRoad(x, z, road);
          if (distanceSquared < nearest) {
            nearest = distanceSquared;
            walker.road = road;
            walker.distance = along;
          }
        }
        place(walker);
        continue;
      }
      let distance = ((0.07 + walker.index * 0.61803398875) % 1) * totalLength;
      let index = 0;
      while (index < roads.length - 1 && distance > roads[index].length) {
        distance -= roads[index].length;
        index += 1;
      }
      walker.road = roads[index];
      walker.distance = distance;
      walker.direction = walker.index % 2 ? -1 : 1;
      place(walker);
    }
  }

  function advance(walker, distance) {
    walker.travelled += distance;
    while (distance > 0) {
      const { road, direction } = walker;
      const left = direction > 0 ? road.length - walker.distance : walker.distance;
      if (left >= distance) {
        walker.distance += direction * distance;
        return;
      }
      distance -= left;
      const junction = direction > 0 ? road.end : road.start;
      const connected = network.junctions.get(junction);
      const alternatives = connected.filter((candidate) => candidate !== road);
      walker.visits += 1;
      const choice = (Math.imul(walker.index + 9, 2654435761) ^ Math.imul(walker.visits, 1597334677)) >>> 0;
      walker.road = alternatives.length ? alternatives[choice % alternatives.length] : road;
      walker.direction = walker.road.start === junction ? 1 : -1;
      walker.distance = walker.direction > 0 ? 0 : walker.road.length;
    }
  }

  function animate(time, paused) {
    const elapsed = previousTime === undefined ? 0 : Math.max(0, Math.min(50, time - previousTime)) / 1000;
    previousTime = time;
    if (paused || !elapsed) return;
    for (const walker of walkers) {
      advance(walker, elapsed * (0.53 + (walker.index % 5) * 0.073));
      place(walker, elapsed);
    }
  }

  return { group, update, animate };
}
