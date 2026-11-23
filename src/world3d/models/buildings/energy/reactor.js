export function reactor({ round, ring, box, beam }) {
  round("basalt", -.11, .078, .02, 1.58, .156);
  for (const [y, d, top] of [[.29, 1.06, .89], [.59, .89, .71], [.88, .71, .65], [1.18, .65, .76], [1.44, .76, .85]]) round("porcelain", -.13, y, .01, d, .31, top);
  ring("granite", -.13, 1.60, .01, .83, .054, true);
  round("ink", -.13, 1.60, .01, .79, .022);
  box("iron", .56, .39, .08, .43, .56, .66);
  box("green", .56, .46, .421, .26, .16, .021);
  beam("copper", [.21, .72, -.08], [.60, .56, -.08], .1);
}
