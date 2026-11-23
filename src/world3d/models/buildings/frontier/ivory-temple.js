export function ivoryTemple({ box, dome, sphere, arch, door, round, ring }) {
  box("sandstone", 0, .075, 0, 1.68, .15, 1.44);
  box("limestone", 0, .49, -.18, .92, .67, .75);
  dome("porcelain", 0, .84, -.17, 1.00, .42, .92);
  sphere("brass", 0, 1.31, -.17, .10);
  arch("limestone", 0, .15, .255, .41, .43, .066, .19);
  door(0, .15, .356, .32, .47, "sandstone", "walnut");
  for (const x of [-.66, .66]) {
    round("limestone", x, .53, -.20, .21, .76, .19);
    ring("brass", x, .92, -.20, .21, .029, true);
    dome("porcelain", x, .925, -.20, .28, .19);
    box("violet", x, .62, -.087, .11, .12, .027);
  }
  box("limestone", 0, .10, .52, .58, .20, .25);
}
