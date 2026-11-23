export function biolab({ box, roof, window, round, dome, ring, beam, door }) {
  box("limestone", 0, .06, 0, 1.54, .12, 1.25);
  box("porcelain", -.22, .48, -.08, .90, .69, .91);
  roof("glass", -.22, .84, -.08, 1.02, 1.0, .37, "glass");
  for (const x of [-.54, .10]) window(x, .61, .394, .16, .39, "zinc", "green");
  door(-.22, .12, .389, .29, .49, "zinc", "glass");
  round("steel", .53, .49, -.29, .43, .67);
  dome("glass", .53, .83, -.29, .42, .26);
  ring("brass", .53, .84, -.29, .43, .034, true);
  beam("copper", [.53, .56, -.10], [.53, .60, .44], .064);
  round("green", .53, .43, .43, .20, .43);
  round("steel", .53, .66, .43, .25, .064);
}
