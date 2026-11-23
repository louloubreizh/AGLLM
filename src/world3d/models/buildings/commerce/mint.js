export function mint({ box, roof, arch, door, ring, barrel }) {
  box("granite", 0, .06, 0, 1.51, .12, 1.25);
  box("sandstone", 0, .53, -.11, 1.2, .83, .94);
  roof("copper", 0, .96, -.11, 1.36, 1.02, .23, "sandstone");
  for (const x of [-.47, .47]) box("limestone", x, .51, .395, .135, .74, .115);
  arch("granite", 0, .125, .387, .44, .34, .078, .132);
  door(0, .124, .443, .39, .47, "iron", "steel");
  ring("brass", 0, .838, .45, .19, .049);
  box("brass", 0, .838, .469, .083, .083, .03, 0, 0, .77);
  barrel("oak", .64, .122, .39, .22, .27);
}
