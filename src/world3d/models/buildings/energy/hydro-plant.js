export function hydroplant({ box, arch, window }) {
  box("water", 0, .048, 0, 1.77, .096, 1.36);
  for (const x of [-.7, .7]) box("basalt", x, .18, 0, .34, .35, 1.35);
  box("granite", 0, .41, -.20, 1.51, .56, .65);
  box("slate", 0, .73, -.22, 1.57, .13, .75);
  for (const x of [-.47, 0, .47]) {
    arch("limestone", x, .085, .221, .27, .23, .054, .20);
    box("ink", x, .31, .218, .31, .39, .04);
    box("water", x, .13, .46, .24, .084, .31, 0, .16);
  }
  window(.46, .56, .13, .20, .13, "steel", "aqua");
}
