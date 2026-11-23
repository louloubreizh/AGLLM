export function temple({ box, round, ring, dome, sphere, arch }) {
  for (let i = 0; i < 3; i += 1) round("sandstone", 0, .053 + i * .096, 0, 1.74 - i * .144, .11, 1.74 - i * .144, 12);
  round("limestone", 0, .71, -.10, .91, .84, .91, 12);
  round("basalt", 0, .72, -.10, .935, .065, .935, 12);
  arch("limestone", 0, .30, .332, .29, .39, .052, .12);
  box("ink", 0, .548, .375, .28, .51, .028);
  for (const x of [-.51, .51]) {
    round("limestone", x, .69, .34, .131, .81, .116);
    ring("brass", x, .95, .34, .126, .023, true);
  }
  round("zinc", 0, 1.13, -.065, 1.27, .13, 1.20, 24);
  dome("copper", 0, 1.19, -.065, 1.18, .43);
  ring("brass", 0, 1.202, -.065, 1.16, .030, true);
  sphere("brass", 0, 1.644, -.065, .092);
}
