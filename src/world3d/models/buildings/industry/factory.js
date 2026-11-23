export function factory({ box, window, round, door }) {
  box("granite", 0, .066, 0, 1.75, .132, 1.36);
  box("brick", -.06, .48, -.07, 1.56, .7, 1.06);
  for (const x of [-.55, -.06, .43]) {
    box("slate", x, .98, -.07, .55, .065, 1.12, 0, 0, .37);
    box("glass", x + .22, .93, -.07, .033, .29, 1.06);
    if (x !== -.06) window(x, .57, .477, .26, .32, "granite", "glass");
  }
  for (const [x, height] of [[-.63, 1.63], [-.35, 1.31]]) {
    round("brick", x, height / 2, -.53, .22, height, .14);
    round("iron", x, height, -.53, .19, .086);
  }
  box("iron", .61, .30, .59, .37, .36, .25);
  door(-.06, .132, .47, .43, .57, "granite", "steel");
}
