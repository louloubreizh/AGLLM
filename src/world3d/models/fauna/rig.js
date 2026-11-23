import { BufferGeometry, DataTexture, Float32BufferAttribute, LinearFilter, LinearMipmapLinearFilter, RGBAFormat, Vector3 } from "three";
import { createModelGroup } from "../model-group.js";

export const residentScale = 0.34;
export const sides = [-1, 1];

export function joint(parent, name, x = 0, y = 0, z = 0) {
  const group = createModelGroup(name);
  group.position.set(x, y, z);
  parent.add(group);
  return group;
}

export function animal(name, scale = residentScale) {
  const model = createModelGroup(name);
  model.scale.setScalar(scale);
  const body = joint(model, "Body");
  return { model, body };
}

export function oval({ part }, parent, material, x, y, z, w, h, d) {
  return part(parent, "animalOval", material, x, y, z, w, h, d);
}

export function limb(resources, parent, material, from, to, width, depth = width) {
  const a = new Vector3(...from);
  const b = new Vector3(...to);
  const direction = b.clone().sub(a);
  const center = a.addScaledVector(direction, 0.5);
  const mesh = oval(resources, parent, material, center.x, center.y, center.z, width, direction.length() + width * 0.55, depth);
  mesh.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), direction.normalize());
  return mesh;
}

export function eye(resources, head, iris, x, y, z, size, yaw, slit = false) {
  const socket = joint(head, "Eye", x, y, z);
  socket.rotation.y = yaw;
  oval(resources, socket, resources.materials.eye, 0, 0, 0, size * 1.08, size, size * 0.62);
  oval(resources, socket, iris, 0, 0, size * 0.26, size * 0.76, size * 0.81, size * 0.28);
  oval(resources, socket, resources.materials.eye, 0, 0, size * 0.38, size * (slit ? 0.2 : 0.49), size * 0.6, size * 0.13);
  oval(resources, socket, resources.materials.animalGlint, -size * 0.12, size * 0.16, size * 0.43, size * 0.17, size * 0.17, size * 0.09);
}

export function coatMaterial(materials, family, index, coat) {
  return coat ? materials[family + "Tint"] : materials[family][Math.abs(index) % materials[family].length];
}

export function surfaceTexture(pattern) {
  const size = 128;
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const wave = Math.sin(x * Math.PI / 16);
      const grain = ((Math.imul(x + 29, 17431) ^ Math.imul(y + 7, 11939)) & 31) / 31;
      const fibers = Math.sin(x * Math.PI / 2 + wave * 2 + y * Math.PI / 16);
      const stripe = Math.max(0, Math.sin(y * Math.PI / 16 + wave * 0.6)) ** 8;
      const scaleX = (x + Math.floor(y / 8) % 2 * 4) % 8 - 3.5;
      const scaleY = y % 8 - 3.5;
      const edge = Math.max(Math.abs(scaleX), Math.abs(scaleY)) / 3.5;
      let shade = 222 + fibers * 14 + grain * 17;
      if (pattern === "tabby") shade -= stripe * 68;
      if (pattern === "plumage") {
        const shaft = Math.abs((x + Math.floor(y / 16) % 2 * 8) % 16 - 7.5);
        const barbs = Math.sin((y + shaft * 1.4) * Math.PI / 2);
        shade = 210 + grain * 14 + barbs * 15 - Math.max(0, shaft - 5) * 13;
      }
      if (pattern === "scales") shade = 232 - edge ** 4 * 58 + grain * 17;
      const offset = (y * size + x) * 4;
      data.set([shade, shade, shade, 255], offset);
    }
  }
  const texture = new DataTexture(data, size, size, RGBAFormat);
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

export function wingMembrane(side) {
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute([
    0, 0, 0, side * 0.19, 0.09, 0.09, side * 0.44, 0.03, -0.04,
    side * 0.32, 0, -0.12, side * 0.30, -0.02, -0.25, side * 0.19, -0.01, -0.19,
    side * 0.13, -0.02, -0.30, side * 0.07, 0, -0.20,
  ], 3));
  geometry.setIndex([0, 1, 5, 1, 2, 3, 1, 3, 5, 3, 4, 5, 0, 5, 7, 5, 6, 7]);
  geometry.computeVertexNormals();
  return geometry;
}
