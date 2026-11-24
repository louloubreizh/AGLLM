import { animal, coatMaterial, eye, joint, limb, oval, sides } from "./rig.js";

export function createDrake(resources, index, censusCoat) {
  const { materials: m, part } = resources;
  const { model, body } = animal("Dragon bleu", 0.37);
  const coat = coatMaterial(m, "drakeScales", index, censusCoat);
  const shape = (...args) => oval(resources, ...args);
  shape(body, coat, 0, 0.21, -0.035, 0.199, 0.215, 0.357);
  shape(body, m.animalIce, 0, 0.172, 0.054, 0.153, 0.143, 0.23);
  limb(resources, body, coat, [0, 0.201, 0.086], [0, 0.314, 0.179], 0.139);
  const head = joint(body, "Head", 0, 0.312, 0.177);
  shape(head, coat, 0, 0.018, 0.037, 0.195, 0.169, 0.196);
  shape(head, m.animalIce, 0, -0.02, 0.113, 0.139, 0.070, 0.115);
  const throat = shape(body, m.animalGlow, 0, 0.21, 0.156, 0.063, 0.081, 0.026);
  const tail = joint(body, "Tail", 0, 0.226, -0.18);
  limb(resources, tail, coat, [0, 0, 0.025], [0, 0.007, -0.15], 0.079);
  const tip = joint(tail, "Tail tip", 0, 0.007, -0.142);
  limb(resources, tip, coat, [0, 0, 0.02], [0, 0.045, -0.13], 0.044);
  const fin = shape(tip, m.animalGlow, 0, 0.052, -0.144, 0.091, 0.027, 0.09);
  const pairs = sides.map((side) => {
    eye(resources, head, m.animalGlow, side * 0.071, 0.026, 0.093, 0.054, side * 0.77, true);
    shape(head, m.eye, side * 0.034, 0.001, 0.156, 0.022, 0.013, 0.013);
    limb(resources, head, m.animalIce, [side * 0.062, 0.068, 0.001], [side * 0.107, 0.119, -0.055], 0.057);
    limb(resources, head, m.animalIce, [side * 0.106, 0.114, -0.048], [side * 0.119, 0.175, -0.081], 0.029);

    const wing = joint(body, "Wing", side * 0.074, 0.269, 0.024);
    part(wing, side < 0 ? "animalWingLeft" : "animalWingRight", m.animalMembrane, 0, 0, 0, 1, 1, 1);
    const elbow = [side * 0.19, 0.09, 0.09];
    limb(resources, wing, coat, [0, 0, 0], elbow, 0.038);
    limb(resources, wing, coat, elbow, [side * 0.44, 0.03, -0.04], 0.025);
    limb(resources, wing, m.animalIce, elbow, [side * 0.3, -0.02, -0.25], 0.014);
    limb(resources, wing, m.animalIce, elbow, [side * 0.13, -0.02, -0.30], 0.013);
    const feet = [-1, 1].map((end) => {
      const leg = joint(body, "Leg", side * 0.064, 0.123, end * 0.104);
      limb(resources, leg, coat, [0, 0, 0], [side * 0.021, -0.084, 0.004], 0.064);
      shape(leg, m.animalIce, side * 0.021, -0.097, 0.022, 0.058, 0.042, 0.071);
      return leg;
    });
    return { side, wing, feet };
  });

  return { model, animate(distance, motion, rest, time, look = 0) {
    const flap = Math.sin(time * 21);
    const attention = Math.sin(Math.PI * rest);
    body.position.y = (0.255 + flap * 0.034) * motion;
    body.rotation.x = 0.11 * motion - attention * 0.16;
    head.rotation.x = -body.rotation.x * 0.58;
    head.rotation.y = Math.sin(time * 4) * attention * 0.42 + look * 0.49;
    throat.scale.z = 0.026 + attention * 0.012 * (1 + Math.sin(time * 7));
    tail.rotation.y = Math.sin(distance * 15 + time * 2) * 0.29;
    tip.rotation.x = (flap * 0.13 - 0.34) * motion + attention * 0.32;
    fin.rotation.z = Math.sin(time * 8) * attention * 0.35;
    for (const { side, wing, feet } of pairs) {
      wing.rotation.z = side * (0.51 * flap * motion + 0.28 * motion + 0.23 * attention * (1 - motion));
      wing.rotation.y = side * 1.22 * (1 - motion);
      for (const leg of feet) leg.rotation.x = motion * -0.82;
    }
  } };
}
