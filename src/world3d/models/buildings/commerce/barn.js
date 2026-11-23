export function barn({ box, roof, door, beam, window }) {
  box("granite", 0, .066, 0, 1.43, .132, 1.17);
  box("terracotta", 0, .57, -.04, 1.18, .91, .88);
  roof("slate", 0, 1.03, -.04, 1.38, 1.08, .37, "terracotta");
  door(0, .13, .414, .64, .61, "limestone", "cedar");
  beam("canvas", [-.31, .19, .48], [.30, .69, .48], .043);
  beam("canvas", [.31, .19, .48], [-.30, .69, .48], .043);
  window(0, .91, .414, .26, .14, "limestone", "ink");
  for (const x of [-.45, .46]) box("straw", x, .22, .52, .26, .22, .26);
}
