export function zebraOutpost({ box, beam }) {
  box("earth", 0, .058, 0, 1.61, .116, 1.30);
  for (const x of [-.43, .44]) {
    for (const z of [-.37, .31]) beam("walnut", [x, .12, z], [x * .85, .98, z * .85], .071);
  }
  box("oak", 0, .94, -.03, 1.12, .10, .88);
  box("slate", 0, 1.43, -.03, 1.16, .09, .90, 0, .13);
  for (const x of [-.45, .45]) {
    box("cedar", x, 1.17, -.02, .068, .44, .79);
    box("cedar", x, .53, -.03, .071, .09, .78);
  }
  for (const x of [-.17, .04]) beam("cedar", [x, .125, .59], [x, 1.09, .366], .045);
  for (let i = 0; i < 5; i += 1) box("oak", -.065, .24 + i * .15, .57 - i * .035, .25, .029, .055);
  box("canvas", .31, 1.56, .23, .27, .15, .044);
}
