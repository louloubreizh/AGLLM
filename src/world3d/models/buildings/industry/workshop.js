export function workshop({ box, roof, door, window }) {
  box("sandstone", 0, .068, 0, 1.53, .136, 1.26);
  box("brick", -.14, .44, -.16, 1.13, .60, .81);
  roof("slate", -.14, .75, -.16, 1.30, .97, .27, "brick");
  door(-.44, .14, .27, .29, .47, "granite", "cedar");
  window(.09, .52, .27, .27, .20, "oak", "warm");
  box("oak", .19, .32, .48, .61, .11, .38);
  for (const x of [-.05, .43]) box("walnut", x, .19, .48, .076, .29, .25);
  box("iron", .20, .419, .51, .25, .083, .13);
  box("basalt", .49, .57, -.34, .25, .87, .26);
  box("slate", .49, 1.03, -.34, .31, .091, .31);
}
