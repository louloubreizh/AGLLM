export function ziggurat({ box }) {
  for (let i = 0; i < 6; i += 1) {
    const width = 1.71 - i * .21;
    box(i % 2 ? "sandstone" : "limestone", 0, .11 + i * .17, -.07, width, .21, width * .83);
  }
  for (let i = 0; i < 11; i += 1) box("sandstone", 0, .08 + i * .087, .73 - i * .069, .31, .10, .20);
  box("tealCloth", 0, 1.09, -.15, .41, .22, .41);
  box("brass", 0, 1.23, -.15, .47, .1, .49);
  box("ink", 0, 1.09, .065, .18, .16, .035);
}
