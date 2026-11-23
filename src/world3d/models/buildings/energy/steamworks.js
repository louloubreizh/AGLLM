export function steamworks({ box, roof, beam, ring, sphere, round, window, door }) {
  box("basalt", 0, .068, 0, 1.66, .136, 1.24);
  box("brick", -.39, .40, -.16, .73, .66, .78);
  roof("slate", -.39, .73, -.16, .86, .88, .23, "brick");
  beam("copper", [.33, .45, -.45], [.33, .45, .45], .54);
  for (const z of [-.28, .27]) ring("iron", .33, .45, z, .54, .055);
  ring("steel", .33, .45, .492, .29, .042);
  sphere("ink", .33, .45, .49, .20, .20, .065);
  round("brick", .44, 1.10, -.33, .27, 1.01, .22);
  beam("brass", [.34, .69, -.17], [-.27, .98, -.17], .055);
  door(-.43, .135, .245, .28, .41, "iron", "cedar");
  window(-.43, .642, .245, .17, .11, "limestone", "warm");
}
