export function library({ box, roof, window, arch, door }) {
  box("granite", 0, .06, 0, 1.61, .12, 1.22);
  box("brick", 0, .54, -.13, 1.39, .85, .84);
  roof("slate", 0, .975, -.13, 1.58, .99, .27, "brick");
  for (const x of [-.43, .43]) {
    window(x, .62, .305, .20, .35, "limestone", "warm");
    arch("limestone", x, .42, .383, .205, .34, .04, .055);
  }
  door(0, .12, .303, .31, .46, "limestone", "oak");
  for (const x of [-.46, .46]) box("limestone", x, .29, .38, .44, .061, .10);
  for (const x of [-.56, .57]) box("cedar", x, .24, .54, .32, .22, .19);
  for (const [x, material] of [[-.45, "rustCloth"], [-.34, "tealCloth"], [.39, "ochreCloth"]]) box(material, x, .21, .53, .08, .20, .16, -.16);
}
