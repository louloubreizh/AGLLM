export function aqueduct({ box, arch }) {
  box("shale", 0, .05, 0, 1.77, .10, .97);
  for (const x of [-.56, 0, .56]) arch("limestone", x, .10, 0, .38, .41, .088, .42);
  box("sandstone", 0, .82, 0, 1.79, .14, .46);
  for (const z of [-.208, .208]) box("limestone", 0, .94, z, 1.77, .17, .086);
  box("water", 0, .908, 0, 1.77, .038, .31);
  for (const x of [-.84, -.28, .28, .84]) box("sandstone", x, .16, 0, .17, .14, .52);
}
