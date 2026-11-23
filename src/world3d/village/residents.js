import { Color, DynamicDrawUsage, InstancedMesh } from "three";
import { residentSpecies } from "../../resident-species.js";
import { createCat } from "../models/fauna/cat.js";
import { createDog } from "../models/fauna/dog.js";
import { createRabbit } from "../models/fauna/rabbit.js";
import { createRaptor } from "../models/fauna/raptor.js";
import { createDrake } from "../models/fauna/drake.js";
import { trailHeight } from "../models/infrastructure/trail.js";
import { createModelGroup } from "../models/model-group.js";
import { projectOntoRoad, roadSample } from "./road-network.js";
import { createJourneys } from "./journeys.js";
import { drivingDecision, laneOffset, normalLane, offsetToRight } from "./lanes.js";

const models = { cat: createCat, dog: createDog, rabbit: createRabbit, raptor: createRaptor, drake: createDrake };

export function createVillageResidents(resources) {
  const group = createModelGroup("Residents");
  const display = createModelGroup("Resident meshes");
  let walkers = [];
  let byId = new Map();
  let chooseJourney;
  let destinationKey;
  let batches = [];
  let network;
  let previousTime;
  let animationTime = 0;
  const coatColor = new Color();

  function place(walker) {
    const { animal, pose } = walker;
    const { x, z, yaw } = pose;
    animal.model.position.set(x, trailHeight(x, z) + 0.006, z);
    animal.model.rotation.y = yaw;
    const rest = walker.journey?.remaining <= 1e-6 ? Math.max(0, Math.min(1, walker.journey.rest)) : 0;
    animal.animate(walker.travelled, walker.motion, rest, animationTime + (walker.id % 11) * 0.17, walker.look);
    animal.model.updateMatrixWorld(true);
  }

  function disposeBatches() {
    for (const { mesh } of batches) mesh.dispose();
    display.clear();
    batches = [];
  }

  function rebuildBatches() {
    disposeBatches();
    const parts = new Map();
    for (const { animal } of walkers) {
      animal.model.traverse((part) => {
        if (!part.isMesh) return;
        const key = `${part.geometry.id}:${part.material.id}`;
        if (!parts.has(key)) parts.set(key, []);
        parts.get(key).push(part);
      });
    }
    for (const members of parts.values()) {
      const source = members[0];
      const mesh = new InstancedMesh(source.geometry, source.material, members.length);
      mesh.instanceMatrix.setUsage(DynamicDrawUsage);
      mesh.castShadow = source.castShadow;
      mesh.receiveShadow = source.receiveShadow;
      mesh.frustumCulled = false;
      display.add(mesh);
      batches.push({ mesh, members });
    }
  }

  function uploadPoses() {
    for (const { mesh, members } of batches) {
      for (const [index, part] of members.entries()) mesh.setMatrixAt(index, part.matrixWorld);
      mesh.instanceMatrix.needsUpdate = true;
    }
  }

  function update(count, nextNetwork, identities, destinations = [], species = "cat") {
    const entry = residentSpecies[species];
    const people = identities ?? Array.from({ length: count }, (_, id) => ({ id }));
    const changed = network?.key !== nextNetwork.key;
    network = nextNetwork;
    const roads = [...network.roads.values()];
    const nextDestinationKey = JSON.stringify(destinations);
    if (changed || destinationKey !== nextDestinationKey) {
      chooseJourney = createJourneys(network, destinations);
      const names = new Map(destinations.map(({ node, name }) => [node, name]));
      for (const { journey } of walkers) {
        if (journey && names.has(journey.destination.node)) {
          journey.destination.name = names.get(journey.destination.node);
        }
      }
      destinationKey = nextDestinationKey;
    }
    let rebuild = people.length !== walkers.length;
    const nextWalkers = people.map(({ id, name, coat }, index) => {
      let walker = byId.get(id);
      if (!walker) {
        walker = { id, baseSpeed: 0.43 + Math.random() * 0.27, travelled: 0, motion: 0, look: 0 };
      }
      const replaceModel = walker.species !== species || Boolean(walker.coat) !== Boolean(coat);
      if (replaceModel) {
        const stableModel = walker.animal?.model;
        const animal = models[species](resources, id, coat);
        if (stableModel) {
          stableModel.clear();
          stableModel.add(...animal.model.children);
          stableModel.scale.copy(animal.model.scale);
          animal.model = stableModel;
        }
        walker.animal = animal;
        walker.species = species;
        walker.speed = walker.baseSpeed * entry.speed;
        walker.actualSpeed = undefined;
        rebuild = true;
      }
      if (walker !== walkers[index]) rebuild = true;
      walker.animal.model.name = name ?? entry.fr[0];
      if (replaceModel || walker.coat !== coat) {
        walker.coat = coat;
        walker.animal.model.traverse((part) => {
          if (part.material?.userData.residentTint) part.userData.coat = coat;
        });
      }
      if (changed || !walker.road) {
        if (walker.pose) {
          const { x, z } = walker.pose;
          let nearest = Infinity;
          for (const road of roads) {
            const { along, distanceSquared } = projectOntoRoad(x, z, road);
            if (distanceSquared >= nearest) continue;
            nearest = distanceSquared;
            walker.road = road;
            walker.distance = along;
          }
        } else {
          walker.road = roads[Math.floor(Math.random() * roads.length)];
          walker.distance = Math.random() * walker.road.length;
        }
        walker.journey = chooseJourney(walker.road, walker.distance);
        if (!walker.pose) setPosition(walker, walker.journey?.steps[0]);
      }
      if (changed || replaceModel) place(walker);
      return walker;
    });
    walkers = nextWalkers;
    byId = new Map(walkers.map((walker) => [walker.id, walker]));
    if (rebuild) {
      group.clear();
      for (const { animal } of walkers) group.add(animal.model);
      rebuildBatches();
    }
    for (const { mesh, members } of batches) {
      if (!mesh.material.userData.residentTint) continue;
      for (const [index, part] of members.entries()) mesh.setColorAt(index, coatColor.set(part.userData.coat));
      mesh.instanceColor.needsUpdate = true;
    }
    uploadPoses();
  }

  function setPosition(walker, leg) {
    const sample = roadSample(walker.road, walker.distance);
    const yaw = sample.yaw + (leg && leg.to < leg.from ? Math.PI : 0);
    const target = laneOffset(walker.road, normalLane(walker.road, walker.id));
    const lane = (walker.lateral ?? target) * Math.min(1, walker.distance / 0.42, (walker.road.length - walker.distance) / 0.42);
    walker.pose = { ...offsetToRight(sample, yaw, lane), yaw };
  }

  function advance(walker, elapsed, traffic) {
    const trip = walker.journey;
    if (!trip) return;
    if (trip.remaining <= 1e-6) {
      if (Number.isFinite(trip.destination.facing)) {
        const turn = trip.destination.facing - walker.pose.yaw;
        walker.pose.yaw += Math.atan2(Math.sin(turn), Math.cos(turn)) * Math.min(1, elapsed * 8);
      }
      trip.rest -= elapsed;
      if (trip.rest <= 0) {
        walker.journey = chooseJourney(walker.road, walker.distance, trip.destination.node);
        walker.passing = undefined;
      }
      return;
    }
    const active = trip.steps[trip.index];
    const direction = Math.sign(active.to - active.from);
    let clearance = Math.abs(active.to - active.from) - trip.onLeg;
    for (let index = trip.index + 1; index < trip.steps.length; index += 1) {
      const previous = trip.steps[index - 1];
      const junction = previous.to === 0 ? previous.road.start : previous.road.end;
      if (network.junctions.get(junction).length > 2) break;
      const leg = trip.steps[index];
      if (leg.road.route !== active.road.route || Math.sign(leg.to - leg.from) !== direction) break;
      clearance += Math.abs(leg.to - leg.from);
    }
    const passing = walker.road.route === active.road.route ? walker.passing : undefined;
    const decision = drivingDecision({ ...walker, road: active.road, distance: active.from + direction * trip.onLeg,
      direction, passing }, traffic.get(active.road.route) ?? [], clearance);
    walker.passing = decision.passing;
    walker.lane = decision.lane;
    walker.actualSpeed = decision.speed;
    const sample = walker.trafficSample;
    if (sample && sample.lane !== decision.lane) {
      sample.previousLane = sample.lane;
      sample.lane = decision.lane;
    }
    const desired = laneOffset(active.road, decision.lane);
    const lateral = walker.lateral ?? desired;
    walker.lateral = lateral + Math.max(-elapsed * 0.38, Math.min(elapsed * 0.38, desired - lateral));
    let budget = decision.speed * elapsed;
    while (budget > 0 && trip.index < trip.steps.length) {
      const leg = trip.steps[trip.index];
      const length = Math.abs(leg.to - leg.from);
      const distance = Math.min(budget, length - trip.onLeg);
      trip.onLeg += distance;
      trip.remaining = Math.max(0, trip.remaining - distance);
      budget -= distance;
      walker.travelled += distance;
      walker.road = leg.road;
      walker.distance = leg.from + Math.sign(leg.to - leg.from) * trip.onLeg;
      setPosition(walker, leg);
      if (trip.onLeg >= length) {
        trip.index += 1;
        trip.onLeg = 0;
      }
    }
    if (trip.index === trip.steps.length) trip.remaining = 0;
  }

  function animate(time, paused) {
    const elapsed = previousTime === undefined ? 0 : Math.max(0, Math.min(50, time - previousTime)) / 1000;
    previousTime = time;
    if (paused || !elapsed) return;
    animationTime += elapsed;
    const traffic = new Map();
    for (const walker of walkers) {
      const leg = walker.journey?.steps[walker.journey.index];
      walker.trafficSample = undefined;
      if (!leg) continue;
      const { road } = leg;
      if (!traffic.has(road.route)) traffic.set(road.route, []);
      const direction = Math.sign(leg.to - leg.from);
      const lane = walker.road.route === road.route ? walker.lane : undefined;
      walker.trafficSample = { id: walker.id, road, direction, distance: leg.from + direction * walker.journey.onLeg,
        speed: walker.actualSpeed ?? walker.speed, lane: lane ?? normalLane(road, walker.id), pose: walker.pose };
      traffic.get(road.route).push(walker.trafficSample);
    }
    for (const walker of walkers) {
      const before = walker.travelled;
      advance(walker, elapsed, traffic);
      const target = walker.travelled > before ? 1 : 0;
      walker.motion += (target - walker.motion) * Math.min(1, elapsed * 9);
      const look = neighborLook(walker, traffic.get(walker.road.route) ?? []);
      walker.look += (look - walker.look) * Math.min(1, elapsed * 7);
      place(walker);
    }
    uploadPoses();
  }

  function journey(id) {
    const trip = byId.get(id)?.journey;
    if (!trip) return null;
    return {
      destination: trip.destination.name,
      meters: trip.remaining,
      progress: trip.total ? Math.min(1, 1 - trip.remaining / trip.total) : 1,
    };
  }

  return { group, display, update, animate, journey, model: (id) => byId.get(id)?.animal.model, dispose: disposeBatches };
}

function neighborLook(walker, neighbors) {
  const radius = 0.55;
  const { x, z, yaw } = walker.pose;
  const sin = Math.sin(yaw);
  const cos = Math.cos(yaw);
  let nearest = radius ** 2;
  let turn = 0;
  for (const other of neighbors) {
    if (other.id === walker.id) continue;
    const dx = other.pose.x - x;
    const dz = other.pose.z - z;
    const squared = dx * dx + dz * dz;
    if (squared >= nearest || dx * sin + dz * cos < -0.10) continue;
    nearest = squared;
    turn = Math.max(-1, Math.min(1, (dx * cos - dz * sin) * 8));
  }
  return turn * (1 - Math.sqrt(nearest) / radius);
}
