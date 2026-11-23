export function broadcasttower({ box, beam, sphere, dome }) {
  box("granite", 0, .067, 0, 1.28, .135, 1.13);
  for (const x of [-.38, .38]) {
    for (const z of [-.35, .35]) {
      beam("steel", [x, .132, z], [x * .12, 1.83, z * .12], .053);
      beam("iron", [x, .14, z], [-x * .54, .92, z * .54], .031);
      beam("iron", [x * .54, .92, z * .54], [-x * .17, 1.73, z * .17], .027);
    }
  }
  beam("iron", [0, 1.76, 0], [0, 2.13, 0], .052);
  sphere("furnace", 0, 2.15, 0, .091);
  dome("steel", -.22, 1.32, .07, .41, .12);
  box("porcelain", .41, .25, .28, .33, .33, .31);
  box("aqua", .41, .32, .443, .12, .041, .018);
}
