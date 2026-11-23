export function hut({ round, ring, door, window, box }) {
  round("sandstone", 0, .073, 0, .96, .145, .93, 20);
  round("stucco", 0, .41, 0, .84, .60, .79, 20);
  round("straw", 0, .83, 0, 1.07, .30, .52, 24);
  round("straw", 0, 1.02, 0, .55, .25, .035, 24);
  ring("oak", 0, .68, 0, .93, .038, true);
  door(0, .14, .421, .26, .43);
  window(.24, .49, .335, .12, .15, "cedar");
  round("brick", -.25, .88, -.19, .12, .40);
  box("oak", 0, .10, .59, .43, .09, .24);
}
