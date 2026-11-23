export function laneOffset(road, lane) {
  return road.width * (0.5 - (lane + 0.5) / road.lanes);
}

// With Y up, the right-hand vector is forward × up.
export function offsetToRight(point, yaw, offset) {
  return { x: point.x - offset * Math.cos(yaw), z: point.z + offset * Math.sin(yaw) };
}

export function normalLane(road, id) {
  return id % (road.lanes / 2);
}

function gapTo(walker, other) {
  const road = walker.road;
  const delta = (other.road.routeDistance + other.distance - road.routeDistance - walker.distance) * walker.direction;
  return road.routeLength ? delta - Math.round(delta / road.routeLength) * road.routeLength : delta;
}

export function drivingDecision(walker, traffic, clearance) {
  const { road, speed, direction, id, passing } = walker;
  const right = normalLane(road, id);
  const left = right + 1;
  const opposing = left >= road.lanes / 2;
  const others = traffic.filter((other) => other.id !== id);
  const spacing = 0.30;
  let leader;
  let gap = 1.0;
  for (const other of others) {
    const distance = gapTo(walker, other);
    if (other.direction === direction && other.lane === right && distance > 0 && distance < gap) {
      leader = other;
      gap = distance;
    }
  }

  if (passing !== undefined) {
    const passed = others.find((other) => other.id === passing);
    const distance = passed ? gapTo(walker, passed) : -Infinity;
    const rightClear = others.every((other) => other.direction !== direction || (other.lane !== right && other.previousLane !== right)
      || Math.abs(gapTo(walker, other)) >= spacing);
    const oncoming = opposing && others.some((other) => other.direction !== direction
      && gapTo(walker, other) >= 0 && gapTo(walker, other) < 0.9 + other.speed);
    if ((distance < -spacing || clearance < 0.42 || oncoming) && rightClear) return { lane: right, speed };
    return { lane: left, speed: oncoming ? Math.min(speed, 0.24) : speed, passing };
  }

  if (!leader) return { lane: right, speed };
  const gain = speed - leader.speed;
  if (gain > 0.045 && (!opposing || road.lanes === 2)) {
    const duration = (gap + spacing) / gain + 0.8;
    const travel = speed * duration;
    const free = others.every((other) => {
      const distance = gapTo(walker, other);
      if (other.direction !== direction) {
        return !opposing || distance < 0 || distance > travel + other.speed * duration + spacing;
      }
      return (other.lane !== left && other.previousLane !== left) || distance < -spacing - Math.max(0, other.speed - speed) * duration
        || distance > travel + spacing;
    });
    if (clearance > travel + 0.65 && free) return { lane: left, speed, passing: leader.id };
  }
  // Yield without stopping the independent itinerary indefinitely.
  return { lane: right, speed: gap < 0.65 ? Math.max(speed * 0.32, Math.min(speed, leader.speed)) : speed };
}
