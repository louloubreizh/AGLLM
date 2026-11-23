export function magneto({ box, beam, ring, sphere }) {
  box("shale", 0, .067, 0, 1.61, .134, 1.21);
  for (const x of [-.50, .50]) {
    box("iron", x, .55, -.19, .25, .97, .34);
    box("copper", x, .96, .084, .28, .23, .23);
    for (let i = 0; i < 6; i += 1) box("copper", x, .26 + i * .088, .032, .31, .041, .39);
  }
  box("iron", 0, .23, -.17, .77, .19, .37);
  beam("steel", [0, .57, -.34], [0, .57, .49], .35);
  ring("brass", 0, .57, .527, .37, .056);
  sphere("aqua", 0, .57, .553, .17);
  box("oak", 0, .185, .43, .46, .096, .41);
}
