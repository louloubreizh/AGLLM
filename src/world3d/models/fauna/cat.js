import { animal, coatMaterial, eye, joint, limb, oval, sides } from "./rig.js";

export function createCat(resources, index, censusCoat) {
  const { materials: m, part } = resources;
  const { model, body } = animal("Chat");
  const coat = coatMaterial(m, "catFur", index, censusCoat);
  const shape = (...args) => oval(resources, ...args);
  shape(body, coat, 0, 0.24, -0.035, 0.22, 0.205, 0.43);
  shape(body, m.animalCream, 0, 0.205, 0.10, 0.16, 0.16, 0.19);
  shape(body, coat, 0, 0.275, 0.14, 0.19, 0.21, 0.17);
  const head = joint(body, "Head", 0, 0.348, 0.19);
  shape(head, coat, 0, 0.017, 0.024, 0.243, 0.199, 0.212);
  shape(head, m.animalCream, 0, -0.048, 0.073, 0.133, 0.082, 0.11);
  const ears = [];
  for (const side of sides) {
    const ear = joint(head, "Ear", side * 0.078, 0.079, 0.01);
    ear.rotation.z = -side * 0.25;
    part(ear, "cone", coat, 0, 0.045, 0, 0.093, 0.131, 0.064);
    part(ear, "cone", m.animalRose, 0, 0.037, 0.023, 0.056, 0.080, 0.024);
    ears.push(ear);
    eye(resources, head, m.animalJade, side * 0.064, 0.027, 0.108, 0.053, side * 0.45, true);
    shape(head, m.animalCream, side * 0.031, -0.025, 0.113, 0.067, 0.047, 0.043);
    for (let i = 0; i < 3; i++) {
      limb(resources, head, m.animalGlint, [side * 0.049, -0.027, 0.125],
        [side * (0.149 - i * 0.012), -0.009 - i * 0.024, 0.13 - i * 0.01], 0.0035).castShadow = false;
    }
  }
  shape(head, m.animalRose, 0, -0.009, 0.14, 0.041, 0.024, 0.022);

  const tail = joint(body, "Tail", 0, 0.264, -0.21);
  limb(resources, tail, coat, [0, 0, 0], [0, 0.085, -0.10], 0.058);
  const tip = joint(tail, "Tail tip", 0, 0.085, -0.10);
  limb(resources, tip, coat, [0, 0, 0], [0, 0.126, -0.052], 0.047);
  limb(resources, tip, coat, [0, 0.122, -0.05], [0, 0.179, -0.019], 0.037);
  const legs = [];
  for (const end of [-1, 1]) {
    for (const side of sides) {
      const leg = joint(body, "Leg", side * 0.075, 0.195, end * 0.137);
      const hock = joint(leg, "Hock", 0, -0.09, end < 0 ? -0.018 : 0);
      limb(resources, leg, coat, [0, 0, 0], [0, -0.09, hock.position.z], end < 0 ? 0.09 : 0.063);
      limb(resources, hock, coat, [0, 0, 0], [0, -0.073, 0.014], 0.046);
      shape(hock, coat, 0, -0.078, 0.027, 0.065, 0.05, 0.086);
      legs.push({ leg, hock, offset: (side > 0 ? Math.PI : 0) + (end > 0 ? Math.PI * 0.56 : 0) });
    }
  }

  return { model, animate(distance, motion, rest, time, look = 0) {
    const phase = distance * 31;
    const rub = Math.sin(Math.PI * rest);
    body.position.y = Math.cos(phase * 2) * 0.012 * motion;
    body.rotation.z = Math.sin(phase) * 0.055 * motion;
    head.rotation.y = Math.sin(time * 2.6) * rub * 0.42 + look * 0.27;
    head.rotation.z = rub * 0.22;
    tail.rotation.z = Math.sin(phase * 0.5 + time * 2.3) * 0.30;
    tip.rotation.x = 0.17 * Math.sin(time * 4.1);
    ears[0].rotation.y = rub * Math.sin(time * 13) * 0.27 + Math.min(0, look) * 0.6;
    ears[1].rotation.y = Math.max(0, look) * 0.6;
    for (const { leg, hock, offset } of legs) {
      const step = phase + offset;
      leg.rotation.x = Math.sin(step) * 0.48 * motion;
      hock.rotation.x = Math.max(0, Math.cos(step)) * 0.60 * motion;
    }
  } };
}
