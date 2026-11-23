export function field({ box, beam }) {
  box("earth", 0, .062, 0, 1.71, .124, 1.26);
  for (let row = -2; row <= 2; row += 1) {
    const x = row * .29;
    box("clay", x, .125, 0, .19, .07, 1.13);
    for (let i = 0; i < 6; i += 1) {
      const z = (i - 2.5) * .187;
      const height = .31 + ((i + row + 2) % 3) * .026;
      beam("foliage", [x, .14, z], [x + .032, height, z + .019], .020);
      box("crop", x - .038, .238, z, .054, .153, .019, .54, .14, .49);
      box("foliage", x + .051, .272, z, .052, .15, .019, -.69, -.15, -.62);
    }
  }
  for (const x of [-.85, .85]) box("limestone", x, .084, 0, .08, .13, 1.22);
}
