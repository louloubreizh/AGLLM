export function observatory({ round, ring, dome, beam, sphere, door, window }) {
  round("basalt", 0, .089, 0, 1.38, .18);
  round("limestone", 0, .46, 0, 1.18, .67);
  ring("iron", 0, .82, 0, 1.20, .054, true);
  dome("zinc", 0, .83, 0, 1.15, .54);
  beam("ink", [-.22, .94, .18], [.37, 1.53, -.13], .23);
  beam("brass", [.34, 1.50, -.12], [.57, 1.72, -.24], .16);
  sphere("aqua", .57, 1.72, -.24, .13);
  door(0, .16, .586, .26, .43, "granite");
  window(-.36, .55, .475, .13, .20, "iron", "glass");
}
