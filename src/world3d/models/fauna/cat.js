import { createModelGroup } from "../model-group.js";

export function createCat({ part, materials }, index) {
  const cat = createModelGroup("Cat");
  const body = createModelGroup("Body");
  cat.add(body);
  const coat = materials.cats[index % materials.cats.length];
  part(body, "cap", coat, 0, 0.16, 0, 0.35, 0.29, 0.49);
  part(body, "leaf", coat, 0, 0.26, 0.22, 0.31, 0.29, 0.31);
  for (const side of [-1, 1]) {
    part(body, "cone", coat, side * 0.09, 0.41, 0.23, 0.11, 0.19, 0.11);
    part(body, "cap", materials.eye, side * 0.062, 0.29, 0.35, 0.043, 0.044, 0.045);
  }
  const tail = part(body, "column", coat, 0, 0.2, -0.27, 0.069, 0.24, 0.069);
  tail.rotation.x = -0.8;

  const legs = [];
  for (const side of [-1, 1]) {
    for (const end of [-1, 1]) {
      const leg = createModelGroup("Leg");
      leg.position.set(side * 0.102, 0.137, end * 0.148);
      part(leg, "cap", coat, 0, -0.066, 0, 0.074, 0.152, 0.078);
      legs.push({ leg, phase: side * end });
      cat.add(leg);
    }
  }
  cat.scale.setScalar(0.84);

  return {
    model: cat,
    stride(distance) {
      const phase = distance * 19;
      body.position.y = 0.067 + (1 - Math.cos(phase * 2)) * 0.005;
      tail.rotation.z = Math.sin(phase * 0.54) * 0.25;
      for (const { leg, phase: side } of legs) leg.rotation.x = side * Math.sin(phase) * 0.52;
    },
  };
}
