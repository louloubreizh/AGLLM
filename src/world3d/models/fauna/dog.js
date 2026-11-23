import { animal, coatMaterial, eye, joint, limb, oval, sides } from "./rig.js";

export function createDog(resources, index, censusCoat) {
  const { materials: m } = resources;
  const { model, body } = animal("Chien", 0.38);
  const coat = coatMaterial(m, "dogFur", index, censusCoat);
  const shape = (...args) => oval(resources, ...args);
  shape(body, coat, 0, 0.29, -0.025, 0.256, 0.231, 0.49);
  shape(body, m.animalUmber, 0, 0.355, -0.074, 0.226, 0.133, 0.378);
  shape(body, m.animalCream, 0, 0.283, 0.155, 0.20, 0.236, 0.202);
  shape(body, coat, 0, 0.347, 0.143, 0.226, 0.25, 0.22);
  const head = joint(body, "Head", 0, 0.411, 0.199);
  shape(head, coat, 0, 0.015, 0.019, 0.255, 0.213, 0.228);
  shape(head, m.animalCream, 0, 0.045, 0.115, 0.060, 0.105, 0.045);
  shape(head, m.animalCream, 0, -0.029, 0.133, 0.171, 0.102, 0.208);
  shape(head, m.eye, 0, -0.005, 0.229, 0.081, 0.05, 0.039);
  const jaw = joint(head, "Jaw", 0, -0.046, 0.095);
  shape(jaw, m.animalUmber, 0, -0.019, 0.061, 0.127, 0.038, 0.148);
  shape(jaw, m.animalRose, 0, -0.013, 0.093, 0.058, 0.031, 0.086);
  const ears = [];
  for (const side of sides) {
    const ear = joint(head, "Ear", side * 0.102, 0.067, 0.011);
    ear.rotation.z = side * 0.32;
    limb(resources, ear, m.animalUmber, [0, 0.029, 0], [side * 0.036, -0.112, 0.027], 0.068, 0.128);
    eye(resources, head, m.animalAmber, side * 0.076, 0.033, 0.11, 0.049, side * 0.64);
    ears.push(ear);
  }
  const tail = joint(body, "Tail", 0, 0.318, -0.232);
  limb(resources, tail, coat, [0, 0, 0.018], [0, 0.096, -0.103], 0.065);
  limb(resources, tail, coat, [0, 0.09, -0.096], [0, 0.156, -0.18], 0.048);
  limb(resources, tail, m.animalCream, [0, 0.147, -0.168], [0, 0.155, -0.223], 0.034);
  const legs = [];
  for (const end of [-1, 1]) {
    for (const side of sides) {
      const leg = joint(body, "Leg", side * 0.088, 0.256, end * 0.155);
      const ankle = joint(leg, "Ankle", 0, -0.131, end < 0 ? -0.041 : 0);
      limb(resources, leg, coat, [0, 0, 0], [0, -0.137, ankle.position.z], end < 0 ? 0.104 : 0.068);
      limb(resources, ankle, coat, [0, 0, 0], [0, -0.092, 0.024], 0.053);
      shape(ankle, m.animalCream, 0, -0.097, 0.035, 0.080, 0.057, 0.103);
      legs.push({ leg, ankle, sign: end * side });
    }
  }

  return { model, animate(distance, motion, rest, time, look = 0) {
    const phase = distance * 29;
    const sniff = Math.sin(Math.PI * rest);
    body.position.y = (1 - Math.cos(phase * 2)) * 0.018 * motion;
    body.rotation.x = sniff * 0.22;
    head.rotation.x = sniff * (0.35 + 0.09 * Math.sin(time * 18));
    head.rotation.y = sniff * Math.sin(time * 8) * 0.31 + look * 0.68;
    jaw.rotation.x = 0.19 * (1 - sniff) * (0.6 + 0.4 * Math.sin(time * 12));
    tail.rotation.y = Math.sin(time * 12) * (0.30 + sniff * 0.39 + Math.abs(look) * 0.45);
    ears.forEach((ear, i) => { ear.rotation.x = Math.sin(phase + i * 0.8) * 0.24 * motion + sniff * 0.18; });
    for (const { leg, ankle, sign } of legs) {
      leg.rotation.x = sign * Math.sin(phase) * 0.64 * motion;
      ankle.rotation.x = Math.max(0, sign * Math.cos(phase)) * 0.72 * motion;
    }
  } };
}
