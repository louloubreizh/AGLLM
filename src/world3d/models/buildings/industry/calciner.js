export function calciner({ box, beam, ring, round }) {
  box("granite", 0, .067, 0, 1.70, .135, 1.26);
  for (const x of [-.42, .44]) {
    for (const z of [-.34, .31]) box("iron", x, .31, z, .09, .48, .09);
  }
  beam("steel", [-.57, .61, -.23], [.57, .79, -.15], .50);
  for (const x of [-.40, .32]) {
    const y = .70 + x * .16;
    const z = -.19 + x * .07;
    beam("iron", [x - .029, y - .005, z], [x + .029, y + .005, z], .547);
  }
  round("copper", -.53, .99, -.24, .26, .35, .40);
  round("iron", .45, 1.09, -.20, .24, .59, .19);
  ring("furnace", .07, .431, .36, .22, .06);
  box("iron", .07, .30, .35, .53, .31, .29);
}
