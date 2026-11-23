export function oilWell({ box, beam, round }) {
  box("basalt", 0, .063, 0, 1.71, .127, 1.31);
  for (const x of [-.48, .48]) {
    for (const z of [-.47, .33]) {
      beam("iron", [x, .14, z], [x * .23, 1.75, z * .23], .067);
      beam("steel", [x, .14, z], [-x * .48, 1.07, z * .48], .038);
    }
  }
  for (const y of [.39, .84, 1.28, 1.73]) box("iron", 0, y, -.038, 1.05 - y * .46, .056, .89 - y * .37);
  beam("copper", [0, 1.71, -.04], [0, .161, -.04], .053);
  round("iron", .55, .37, .34, .37, .46);
  round("rustCloth", .55, .38, .34, .385, .074);
  beam("copper", [0, .19, -.04], [.56, .23, .34], .07);
}
