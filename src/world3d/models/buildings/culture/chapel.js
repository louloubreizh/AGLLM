export function chapel({ box, roof, arch, door, sphere, round, beam }) {
  box("shale", 0, .06, 0, 1.18, .12, 1.46);
  box("limestone", 0, .52, -.13, .88, .80, .97);
  roof("slate", 0, .94, -.13, 1.05, 1.13, .43, "limestone");
  box("stucco", 0, .79, .47, .39, 1.34, .37);
  arch("sandstone", 0, .12, .68, .22, .39, .049, .097);
  door(0, .12, .724, .193, .44, "walnut");
  box("ink", 0, 1.26, .664, .18, .21, .02);
  sphere("brass", 0, 1.27, .686, .13, .17, .1);
  round("slate", 0, 1.60, .47, .61, .31, .039, 4);
  beam("brass", [0, 1.74, .47], [0, 1.98, .47], .027);
  beam("brass", [-.071, 1.89, .47], [.071, 1.89, .47], .027);
}
