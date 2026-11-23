export function brewery({ box, roof, window, round, dome, beam, barrel }) {
  box("shale", 0, .07, 0, 1.66, .14, 1.27);
  box("stucco", -.19, .51, -.19, 1.14, .73, .79);
  roof("terracotta", -.19, .88, -.19, 1.27, .92, .30, "stucco");
  window(-.38, .58, .225, .21, .23, "oak");
  round("copper", .56, .48, -.20, .45, .69);
  dome("copper", .56, .83, -.20, .46, .19);
  beam("brass", [.56, .95, -.21], [.09, .95, -.21], .045);
  barrel("oak", -.35, .14, .46, .31, .37);
  barrel("oak", .06, .14, .51, .27, .31);
  box("cedar", .35, .40, .215, .25, .11, .08);
}
