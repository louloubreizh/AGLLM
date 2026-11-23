const identities = new WeakMap();
let nextIdentity = 0;

export function residentId(kitten) {
  if (!identities.has(kitten)) identities.set(kitten, ++nextIdentity);
  return identities.get(kitten);
}
