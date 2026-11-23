export function spaceport({ round, ring, box }) {
  round("basalt", 0, .064, 0, 1.77, .128);
  ring("ochreCloth", 0, .133, 0, 1.26, .035, true);
  round("porcelain", .21, .80, -.12, .40, 1.21, .36);
  round("porcelain", .21, 1.52, -.12, .36, .28, .039);
  round("terracotta", .21, .92, -.12, .40, .21, .392);
  round("iron", .21, .23, -.12, .33, .21, .30);
  for (const dx of [-.23, .23]) box("terracotta", .21 + dx, .34, -.12, .094, .45, .24, 0, 0, dx);
  for (const z of [-.42, .17]) box("steel", -.51, .72, z, .062, 1.18, .062);
  for (const y of [.38, .66, .96, 1.22]) box("iron", -.51, y, -.12, .09, .046, .64);
  box("oak", -.12, .92, -.12, .74, .081, .20);
}
