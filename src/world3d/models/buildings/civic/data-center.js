export function dataCenter({ box, beam }) {
  box("basalt", 0, .085, 0, 1.54, .17, 1.13);
  for (const x of [-.5, 0, .5]) {
    box("iron", x, .69, -.12, .41, 1.12, .66);
    box("porcelain", x, 1.27, -.12, .44, .10, .70);
    for (let i = 0; i < 5; i += 1) {
      box("ink", x, .31 + i * .184, .224, .32, .095, .034);
      box(i % 2 ? "aqua" : "green", x + .102, .31 + i * .184, .250, .055, .022, .021);
    }
  }
  box("steel", 0, .25, .40, 1.28, .13, .33);
  for (const x of [-.52, .52]) beam("copper", [x, .30, .545], [x, 1.39, .54], .035);
}
