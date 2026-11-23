export function tradepost({ box, roof, barrel, sphere }) {
  box("sandstone", 0, .06, 0, 1.55, .12, 1.31);
  box("cedar", 0, .41, -.26, 1.14, .57, .58);
  roof("terracotta", 0, .71, -.26, 1.31, .74, .22, "cedar");
  for (const x of [-.55, .55]) box("oak", x, .42, .52, .07, .60, .07);
  for (let i = 0; i < 7; i += 1) {
    const x = (i - 3) * .18;
    const color = i % 2 ? "canvas" : "rustCloth";
    box(color, x, .767, .32, .181, .057, .66, 0, .21);
    box(color, x, .67, .66, .181, .13, .055);
  }
  box("walnut", 0, .192, .46, 1.11, .144, .30);
  box("oak", 0, .281, .46, 1.15, .038, .34);
  barrel("oak", -.64, .12, .27, .23, .35);
  sphere("ochreCloth", .34, .345, .46, .092);
}
