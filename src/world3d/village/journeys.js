export function createJourneys(network, destinations) {
  const stops = [...destinations];
  stops.push({ node: "square", name: "Place du village" });
  if (stops.length < 3) {
    for (const [node, roads] of network.junctions) {
      if (roads.length > 2) stops.push({ node, name: "Carrefour du village" });
    }
  }
  const routes = new Map();

  function directionsTo(node) {
    if (routes.has(node)) return routes.get(node);
    const directions = new Map([[node, null]]);
    const queue = [node];
    for (const current of queue) {
      for (const road of network.junctions.get(current) ?? []) {
        const previous = road.start === current ? road.end : road.start;
        if (directions.has(previous)) continue;
        directions.set(previous, { road, from: road.start === previous ? 0 : road.length,
          to: road.start === previous ? road.length : 0, node: current,
          remaining: road.length + (directions.get(current)?.remaining ?? 0) });
        queue.push(previous);
      }
    }
    routes.set(node, directions);
    return directions;
  }

  return function choose(road, distance, previous) {
    const choices = stops.filter(({ node }) => node !== previous && network.junctions.has(node));
    const destination = choices[Math.floor(Math.random() * choices.length)];
    if (!destination) return null;
    const directions = directionsTo(destination.node);
    const startCost = distance + (directions.get(road.start)?.remaining ?? 0);
    const endCost = road.length - distance + (directions.get(road.end)?.remaining ?? 0);
    const towardStart = startCost <= endCost;
    const to = towardStart ? 0 : road.length;
    let node = towardStart ? road.start : road.end;
    const legs = [{ road, from: distance, to }];
    while (directions.get(node)) {
      const leg = directions.get(node);
      legs.push(leg);
      node = leg.node;
    }
    const steps = legs.filter(({ from, to }) => Math.abs(from - to) > 1e-6);
    const total = steps.reduce((sum, leg) => sum + Math.abs(leg.to - leg.from), 0);
    return { destination, steps, total, remaining: total, index: 0, onLeg: 0, rest: 0.65 + Math.random() * 1.2 };
  };
}
