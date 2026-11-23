export function academy({ box, round, roof, arch, door, window }) {
  box("sandstone", 0, .08, 0, 1.7, .16, 1.33);
  box("stucco", 0, .46, -.29, 1.46, .62, .58);
  for (const x of [-.65, -.22, .22, .65]) {
    round("limestone", x, .47, .46, .115, .68, .092);
    round("sandstone", x, .18, .46, .16, .084);
  }
  box("limestone", 0, .86, .14, 1.58, .12, .93);
  roof("terracotta", 0, .92, .085, 1.70, 1.16, .28, "stucco");
  arch("sandstone", 0, .16, -.003, .34, .45, .057, .069);
  door(0, .16, .016, .27, .43);
  for (const x of [-.48, .48]) window(x, .55, .025, .20, .24, "limestone");
}
