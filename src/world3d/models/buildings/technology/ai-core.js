export function aiCore({ box, sphere, beam }) {
  box("basalt", 0, .067, 0, 1.55, .134, 1.35);
  box("iron", 0, .55, 0, .82, .85, .74, .42);
  box("porcelain", 0, 1.04, 0, .75, .16, .77, .42);
  box("glass", 0, 1.20, 0, .50, .19, .50, .42);
  sphere("green", 0, 1.34, 0, .24);
  for (const x of [-.60, .60]) {
    box("iron", x, .29, .26, .22, .31, .36);
    beam("copper", [x, .40, .29], [x * .38, .62, .44], .057);
    for (const z of [.16, .26, .36]) box("green", x, .458, z, .11, .019, .05);
  }
  box("ink", 0, .64, .434, .40, .23, .044);
  for (const y of [.58, .69]) box("aqua", 0, y, .461, .24, .032, .016);
}
