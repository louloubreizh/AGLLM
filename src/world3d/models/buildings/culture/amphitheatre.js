export function amphitheatre({ round, box }) {
  round("granite", 0, .055, 0, 1.78, .11, 1.78, 40);
  round("sandstone", 0, .112, .06, 1.48, .07);
  for (let row = 0; row < 4; row += 1) {
    const distance = .35 + row * .126;
    for (let i = -7; i <= 7; i += 1) {
      const angle = i * .187;
      box(row % 2 ? "limestone" : "sandstone", Math.sin(angle) * distance, .15 + row * .096,
        -Math.cos(angle) * distance + .12, distance * .194, .13 + row * .065, .131, -angle);
    }
  }
  box("oak", 0, .19, .43, .68, .10, .44);
  for (const x of [-.45, .45]) {
    round("limestone", x, .35, .40, .081, .46);
    box("rustCloth", x, .49, .432, .18, .19, .037);
  }
}
