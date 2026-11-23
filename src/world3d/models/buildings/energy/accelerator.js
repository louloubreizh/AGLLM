export function accelerator({ box, ring, beam, sphere }) {
  box("basalt", 0, .075, 0, 1.73, .15, 1.31);
  for (const x of [-.65, .65]) box("porcelain", x, .32, 0, .28, .41, 1.04);
  for (const z of [-.35, 0, .35]) ring("iron", 0, .83, z, 1.07, .14);
  for (const z of [-.42, .42]) ring("aqua", 0, .83, z, .93, .043);
  beam("steel", [-.71, .79, -.06], [.71, .79, -.06], .084);
  sphere("violet", 0, .81, -.06, .26);
  for (const x of [-.60, .6]) beam("copper", [x, .41, -.44], [x, .75, -.44], .076);
}
