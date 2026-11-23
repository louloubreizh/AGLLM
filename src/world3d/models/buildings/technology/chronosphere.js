export function chronosphere({ round, ring, sphere }) {
  round("basalt", 0, .12, 0, 1.59, .24, 1.44, 24);
  ring("brass", 0, .286, 0, 1.28, .052, true);
  ring("copper", 0, .84, 0, 1.12, .087);
  ring("brass", 0, .84, 0, .92, .042, true);
  sphere("violet", 0, .84, 0, .55);
  for (const x of [-.60, .60]) {
    round("steel", x, .47, 0, .17, .44, .13);
    sphere("aqua", x, .72, 0, .15);
  }
  ring("aqua", 0, .84, .23, .39, .025);
}
