export function zebraWorkshop({ box, arch, beam }) {
  box("limestone", 0, .058, 0, 1.62, .116, 1.31);
  box("sandstone", -.28, .55, -.13, .85, .87, .87);
  box("terracotta", -.28, 1.04, -.13, 1.00, .12, .94);
  arch("limestone", -.25, .115, .321, .40, .54, .069, .096);
  box("ink", -.25, .43, .346, .41, .60, .034);
  box("tealCloth", .47, .77, .23, .66, .064, .72, 0, .19);
  for (const z of [-.19, .52]) box("oak", .67, .43, z, .066, .62, .066);
  box("cedar", .43, .30, .37, .46, .28, .32);
  for (const x of [.29, .43, .56]) beam("iron", [x, .46, .278], [x, .46, .46], .031);
}
