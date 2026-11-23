export function chooseObservation(count, previous = -1, random = Math.random) {
  if (count < 2) return count - 1;
  if (previous < 0 || previous >= count) return Math.floor(random() * count);
  const picked = Math.floor(random() * (count - 1));
  return picked < previous ? picked : picked + 1;
}
