import { animal, coatMaterial, eye, joint, limb, oval, sides } from "./rig.js";

export function createRaptor(resources, index, censusCoat) {
  const { materials: m } = resources;
  const { model, body } = animal("Vélociraptor", 0.37);
  const coat = coatMaterial(m, "raptorPlume", index, censusCoat);
  const shape = (...args) => oval(resources, ...args);
  shape(body, coat, 0, 0.386, -0.035, 0.23, 0.217, 0.39);
  shape(body, m.animalClay, 0, 0.335, 0.031, 0.169, 0.137, 0.28);
  limb(resources, body, coat, [0, 0.374, 0.087], [0, 0.54, 0.18], 0.139);
  const head = joint(body, "Head", 0, 0.544, 0.177);
  shape(head, coat, 0, 0.015, 0.066, 0.148, 0.131, 0.22);
  limb(resources, head, m.animalClay, [0, 0.014, 0.092], [0, -0.017, 0.219], 0.084, 0.064);
  const jaw = joint(head, "Jaw", 0, -0.047, 0.051);
  limb(resources, jaw, m.animalClay, [0, 0, 0], [0, 0, 0.166], 0.067, 0.037);
  for (const side of sides) {
    eye(resources, head, m.animalAmber, side * 0.062, 0.03, 0.098, 0.043, side * 0.92, true);
    shape(head, m.eye, side * 0.028, 0, 0.193, 0.023, 0.012, 0.02);
    for (let i = 0; i < 3; i++) {
      limb(resources, head, m.animalCopper, [side * 0.013, 0.051, 0.048 - i * 0.025],
        [side * 0.021, 0.114 - i * 0.015, 0.002 - i * 0.029], 0.028, 0.011);
    }
  }
  const tail = joint(body, "Tail", 0, 0.39, -0.187);
  limb(resources, tail, coat, [0, 0, 0.03], [0, 0.018, -0.231], 0.11);
  const tailTip = joint(tail, "Tail tip", 0, 0.018, -0.21);
  limb(resources, tailTip, coat, [0, 0, 0.026], [0, 0.022, -0.22], 0.064);
  for (const side of sides) {
    limb(resources, tailTip, m.animalCopper, [0, 0.017, -0.17], [side * 0.046, 0.05, -0.286], 0.033, 0.017);
  }
  const pairs = sides.map((side) => {
    const wing = joint(body, "Feathered arm", side * 0.093, 0.40, 0.107);
    limb(resources, wing, coat, [0, 0, 0], [side * 0.043, -0.10, 0.034], 0.062);
    for (let i = 0; i < 4; i++) {
      limb(resources, wing, i % 2 ? m.animalCopper : coat, [side * 0.028, -0.055 - i * 0.013, 0.03],
        [side * (0.056 + i * 0.006), -0.10 - i * 0.017, -0.07 - i * 0.009], 0.04, 0.016);
    }
    const leg = joint(body, "Leg", side * 0.084, 0.364, -0.056);
    const shin = joint(leg, "Shin", 0, -0.123, 0.059);
    limb(resources, leg, coat, [0, 0, 0], [0, -0.124, 0.064], 0.108);
    limb(resources, shin, m.animalClay, [0, 0, 0], [0, -0.123, -0.092], 0.056);
    const toe = joint(shin, "Foot", 0, -0.187, -0.042);
    limb(resources, shin, m.animalClay, [0, -0.113, -0.088], [0, -0.19, -0.044], 0.036);
    for (let i = -1; i <= 1; i++) {
      const tip = [i * 0.039, -0.03, 0.083 - Math.abs(i) * 0.012];
      limb(resources, toe, m.animalClay, [0, -0.017, 0], tip, 0.023);
      limb(resources, toe, m.animalUmber, tip, [tip[0], -0.033, tip[2] + 0.021], 0.012);
    }
    limb(resources, toe, m.animalCream, [side * 0.019, -0.009, 0.04], [side * 0.04, 0.023, 0.071], 0.019);
    return { side, wing, leg, shin, toe };
  });

  return { model, animate(distance, motion, rest, time, look = 0) {
    const phase = distance * 24;
    const alert = Math.sin(Math.PI * rest);
    body.position.y = (1 - Math.cos(phase * 2)) * 0.023 * motion;
    body.rotation.x = 0.16 * motion - 0.09 * alert;
    head.rotation.x = -body.rotation.x + Math.sin(phase * 2 + 0.6) * 0.06 * motion;
    head.rotation.y = Math.sin(time * 5.7) * 0.55 * alert + look * 0.75;
    jaw.rotation.x = (Math.sin(time * 15) + 1) * 0.13 * alert;
    tail.rotation.y = -Math.sin(phase) * 0.21 * motion + Math.sin(time * 1.9) * 0.08;
    tailTip.rotation.y = tail.rotation.y * 0.36;
    for (const { side, wing, leg, shin, toe } of pairs) {
      const step = side * Math.sin(phase);
      leg.rotation.x = step * 0.72 * motion - body.rotation.x;
      shin.rotation.x = Math.max(0, side * Math.cos(phase)) * 0.87 * motion;
      toe.rotation.x = -leg.rotation.x - shin.rotation.x - body.rotation.x;
      wing.rotation.x = -step * 0.20 * motion;
      wing.rotation.z = side * alert * 0.55;
    }
  } };
}
