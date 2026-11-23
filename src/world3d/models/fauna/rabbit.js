import { animal, coatMaterial, eye, joint, limb, oval, sides } from "./rig.js";

export function createRabbit(resources, index, censusCoat) {
  const { materials: m } = resources;
  const { model, body } = animal("Lapin", 0.33);
  const coat = coatMaterial(m, "rabbitFur", index, censusCoat);
  const shape = (...args) => oval(resources, ...args);
  shape(body, coat, 0, 0.185, -0.07, 0.258, 0.285, 0.35);
  shape(body, coat, 0, 0.223, 0.096, 0.189, 0.235, 0.22);
  shape(body, m.animalCream, 0, 0.155, 0.105, 0.175, 0.17, 0.181);
  shape(body, m.animalCream, 0, 0.17, -0.245, 0.115, 0.118, 0.121);
  const head = joint(body, "Head", 0, 0.288, 0.159);
  shape(head, coat, 0, 0.014, 0.018, 0.22, 0.211, 0.235);
  const nose = joint(head, "Nose", 0, -0.022, 0.125);
  shape(nose, m.animalRose, 0, 0.004, 0.019, 0.034, 0.026, 0.023);
  const ears = [];
  const feet = [];
  for (const side of sides) {
    const ear = joint(head, "Ear", side * 0.063, 0.088, -0.006);
    ear.rotation.z = -side * 0.13;
    shape(ear, coat, 0, 0.139, 0, 0.079, 0.32, 0.056);
    shape(ear, m.animalRose, 0, 0.143, 0.022, 0.049, 0.248, 0.020);
    ears.push(ear);
    eye(resources, head, m.animalAmber, side * 0.093, 0.029, 0.071, 0.054, side * 1.02);
    shape(nose, m.animalCream, side * 0.026, -0.02, -0.006, 0.071, 0.052, 0.046);
    const hind = joint(body, "Leg", side * 0.095, 0.13, -0.109);
    shape(hind, coat, 0, 0.025, -0.012, 0.118, 0.191, 0.186);
    const foot = joint(hind, "Hock", 0, -0.094, -0.026);
    shape(foot, coat, 0, -0.006, 0.048, 0.079, 0.06, 0.173);
    const fore = joint(body, "Leg", side * 0.061, 0.149, 0.121);
    limb(resources, fore, coat, [0, 0, 0], [0, -0.108, 0.036], 0.048);
    shape(fore, m.animalCream, 0, -0.12, 0.045, 0.057, 0.05, 0.085);
    feet.push({ hind, foot, fore });
  }

  return { model, animate(distance, motion, rest, time, look = 0) {
    const phase = distance * 5.8 % 1;
    const leap = phase > 0.18 ? Math.sin(Math.PI * (phase - 0.18) / 0.82) : 0;
    const crouch = phase < 0.32 ? Math.sin(Math.PI * phase / 0.32) * 0.034 : 0;
    const lookout = Math.sin(Math.PI * rest);
    body.position.y = (leap * 0.19 - crouch) * motion;
    body.rotation.x = Math.sin(phase * Math.PI * 2) * -0.28 * motion;
    head.rotation.y = Math.sin(time * 5) * lookout * 0.36 + look * 0.18;
    head.rotation.x = -lookout * 0.28;
    nose.position.y = -0.022 + (0.003 + lookout * 0.004) * Math.sin(time * 23);
    ears.forEach((ear, i) => {
      ear.rotation.x = -leap * 0.52 * motion + Math.sin(time * 7 + i) * 0.13 * lookout;
      ear.rotation.y = Math.sin(time * 4 + i) * 0.22 * lookout + look * 0.55;
    });
    for (const { hind, foot, fore } of feet) {
      hind.rotation.x = (-leap * 0.74 + crouch * 10) * motion;
      foot.rotation.x = leap * 1.06 * motion;
      fore.rotation.x = Math.sin(phase * Math.PI * 2 + 0.7) * 0.56 * motion;
    }
  } };
}
