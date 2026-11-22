const plots = [];
for (let row = -4; row <= 4; row += 1) {
  for (let column = -4; column <= 4; column += 1) {
    if (row || column) {
      plots.push({ x: column * 2.8, z: row * 2.8 });
    }
  }
}
plots.sort((a, b) => (a.x ** 2 + a.z ** 2) - (b.x ** 2 + b.z ** 2) || b.z - a.z || a.x - b.x);

export const maximumResidents = 28;

export function chooseObservation(count, previous = -1, random = Math.random) {
  if (count < 2) return count - 1;
  if (previous < 0 || previous >= count) return Math.floor(random() * count);
  const picked = Math.floor(random() * (count - 1));
  return picked < previous ? picked : picked + 1;
}

export function planVillage(buildings, population) {
  return {
    plots: buildings.flatMap((building) => {
      const position = plots[building.slot];
      return position ? [{ ...position, ...building, models: Math.min(3, building.count) }] : [];
    }),
    residents: Math.min(maximumResidents, population),
  };
}
