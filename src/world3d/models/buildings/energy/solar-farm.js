export function solarFarm({ box }) {
  box("granite", 0, .055, 0, 1.67, .11, 1.36);
  for (const z of [-.36, .36]) {
    for (const x of [-.58, .58]) box("steel", x, .22, z, .062, .33, .065);
    box("iron", 0, .39, z, 1.46, .064, .57, 0, .37);
    for (const x of [-.52, -.17, .17, .52]) {
      box("solar", x, .428, z, .32, .027, .51, 0, .37);
      for (const dz of [-.135, .135]) box("steel", x, .445 - dz * .39, z + dz, .30, .012, .012, 0, .37);
    }
  }
  box("porcelain", .69, .22, -.58, .24, .33, .23);
  box("green", .69, .30, -.456, .098, .062, .019);
}
