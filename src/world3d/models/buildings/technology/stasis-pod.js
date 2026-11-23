export function stasisPod({ box, round, dome, ring, beam }) {
  box("basalt", 0, .06, 0, 1.42, .12, 1.16);
  round("iron", 0, .22, 0, .91, .22);
  round("porcelain", 0, .39, 0, .68, .16, .57);
  round("glass", 0, .89, 0, .52, .92);
  box("aqua", 0, .87, .259, .17, .47, .017);
  ring("steel", 0, .56, 0, .54, .054, true);
  ring("zinc", 0, 1.20, 0, .54, .055, true);
  dome("iron", 0, 1.35, 0, .64, .17);
  for (const x of [-.34, .34]) {
    beam("steel", [x, .35, .09], [x * .82, 1.32, .08], .054);
    beam("copper", [x, .36, .09], [x * 1.65, .19, .37], .038);
  }
  box("iron", .49, .29, .37, .28, .21, .28);
  box("green", .49, .40, .39, .13, .023, .10);
}
