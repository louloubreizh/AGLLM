export function lumberMill({ box, roof, beam }) {
  box("earth", 0, .06, 0, 1.78, .12, 1.32);
  for (const x of [-.72, .72]) {
    for (const z of [-.47, .34]) box("cedar", x, .48, z, .089, .73, .082);
  }
  roof("slate", 0, .86, -.07, 1.67, 1.10, .26, "cedar");
  box("oak", .03, .36, .06, 1.25, .10, .47);
  beam("steel", [.05, .39, .08], [.05, .39, .124], .45);
  for (let i = 0; i < 12; i += 1) {
    const a = i * Math.PI / 6;
    box("steel", .05 + Math.cos(a) * .23, .39 + Math.sin(a) * .23, .104, .047, .054, .037, 0, 0, a);
  }
  for (const x of [-.56, -.29, -.021]) beam("oak", [x, .22, .34], [x, .20, .67], .12);
}
