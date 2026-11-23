export function mansion({ box, roof, window, door, round, ring }) {
  box("limestone", 0, .07, 0, 1.78, .14, 1.23);
  box("stucco", 0, .66, -.11, 1.47, 1.01, .92);
  box("limestone", 0, .77, .37, 1.51, .08, .074);
  box("slate", 0, 1.28, -.11, 1.65, .26, 1.1);
  roof("slate", 0, 1.41, -.11, 1.42, .98, .22, "stucco");
  for (const x of [-.50, 0, .50]) window(x, .98, .37, .23, .26, "limestone");
  for (const x of [-.52, .52]) window(x, .44, .366, .22, .24, "limestone", "warm");
  door(0, .15, .398, .31, .47);
  for (const x of [-.31, .31]) round("limestone", x, .49, .56, .085, .67);
  box("limestone", 0, .85, .55, .8, .122, .41);
  ring("iron", 0, .9, .75, .17, .028);
}
