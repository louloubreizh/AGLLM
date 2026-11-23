export function quarry({ box, beam }) {
  box("limestone", 0, .065, 0, 1.73, .13, 1.34);
  for (let i = 0; i < 4; i += 1) {
    box(i % 2 ? "sandstone" : "limestone", -.20, .204 + i * .13, -.17 - i * .095, 1.18 - i * .2, .17, 1.08 - i * .21);
  }
  for (const z of [-.35, .42]) beam("oak", [.45, .13, z], [.60, 1.06, .05], .066);
  beam("oak", [.60, 1.04, .05], [.02, .85, .46], .072);
  beam("iron", [.07, .87, .423], [.07, .39, .423], .027);
  box("granite", .07, .32, .43, .30, .17, .23, -.16);
  for (const x of [-.66, -.38]) box("sandstone", x, .20, .50, .23, .13, .19, .20);
}
