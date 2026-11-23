export function mine({ box, sphere, arch, round }) {
  box("earth", 0, .077, 0, 1.73, .154, 1.33);
  sphere("basalt", 0, .48, -.24, 1.46, 1.15, .95);
  sphere("shale", -.49, .30, -.04, .52, .54, .59);
  arch("oak", .12, .148, .25, .48, .30, .11, .15);
  box("ink", .12, .417, .233, .49, .52, .07);
  round("warm", -.23, .54, .34, .083, .106);
  for (const x of [-.03, .27]) box("iron", x, .16, .48, .024, .053, .51);
  for (const z of [.29, .43, .58, .68]) box("cedar", .12, .158, z, .39, .045, .052);
  box("iron", .53, .23, .53, .25, .17, .29);
}
