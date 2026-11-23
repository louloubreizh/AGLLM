export function logHouse({ box, beam, roof, door, window }) {
  box("granite", 0, .074, 0, 1.56, .147, 1.04);
  box("cedar", 0, .43, -.03, 1.24, .59, .78);
  for (let i = 0; i < 5; i += 1) {
    const y = .18 + .12 * i;
    for (const z of [-.42, .36]) beam("oak", [-.73, y, z], [.73, y, z], .106);
    for (const x of [-.63, .63]) beam("cedar", [x, y, -.49], [x, y, .42], .108);
  }
  roof("slate", 0, .75, -.033, 1.53, 1.12, .35, "cedar");
  door(.12, .15, .42, .29, .46);
  window(-.36, .52, .43, .24, .24);
  box("brick", .43, .93, -.22, .24, .54, .25);
  box("granite", .43, 1.20, -.22, .29, .067, .30);
}
