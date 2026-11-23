export function field({ box, beam, leaf }) {
  box("earth", 0, .062, 0, 1.71, .124, 1.26);
  for (let row = -2; row <= 2; row += 1) {
    const x = row * .29;
    box("clay", x, .125, 0, .19, .07, 1.13);
    for (let i = 0; i < 6; i += 1) {
      const z = (i - 2.5) * .187;
      const height = .31 + ((i + row + 2) % 3) * .026;
      const yaw = (row + i) * 1.7;
      beam("foliage", [x, .14, z], [x + .021, height, z + .017], .012);
      leaf("crop", x + .007, .212, z, .058, .134, yaw, .6, .58);
      leaf("foliage", x + .012, .254, z + .006, .051, .119, yaw + 2.6, .67, .47);
      leaf("crop", x + .022, height - .043, z + .016, .039, .102, yaw + 4.2, .38, .31);
    }
  }
  for (const x of [-.85, .85]) box("limestone", x, .084, 0, .08, .13, 1.22);
}
