export function unicornPasture({ round, box, beam, sphere }) {
  round("moss", 0, .059, 0, 1.68, .12, 1.66, 32);
  for (let i = 0; i < 9; i += 1) {
    const a = Math.PI * (.03 + 1.27 * i / 8);
    box("limestone", Math.cos(a) * .71, .22, -Math.sin(a) * .71, .09, .32, .09);
    if (i < 8) {
      const next = a + Math.PI * 1.27 / 8;
      beam("cedar", [Math.cos(a) * .71, .236, -Math.sin(a) * .71],
        [Math.cos(next) * .71, .236, -Math.sin(next) * .71], .037);
    }
  }
  round("sandstone", .23, .22, .24, .41, .25);
  round("water", .23, .353, .24, .35, .025);
  for (const [x, z] of [[-.54, .37], [-.37, -.43], [.48, -.22]]) {
    sphere("foliage", x, .20, z, .22, .17, .20);
    sphere("violet", x, .29, z, .095);
  }
}
