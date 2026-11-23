export function pasture({ box, sphere }) {
  box("moss", 0, .055, 0, 1.64, .11, 1.32);
  for (const x of [-.73, .73]) {
    for (const z of [-.58, 0, .58]) box("cedar", x, .23, z, .072, .35, .072);
    for (const y of [.20, .32]) box("oak", x, y, 0, .038, .056, 1.15);
  }
  for (const y of [.20, .32]) box("oak", 0, y, -.58, 1.47, .056, .038);
  box("straw", -.4, .20, -.31, .43, .26, .33);
  box("limestone", .37, .15, .36, .48, .13, .22);
  box("water", .37, .222, .36, .36, .018, .13);
  for (const x of [-.37, -.14, .12, .35]) sphere("foliage", x, .134, .03, .14, .11, .12);
}
