import {
  Box3, BoxGeometry, CylinderGeometry, Euler, ExtrudeGeometry, IcosahedronGeometry,
  Matrix4, Mesh, Quaternion, Shape, SphereGeometry, TorusGeometry, Vector3,
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { createModelGroup } from "../model-group.js";
import { plantGeometry } from "../vegetation/plant-geometry.js";

export function createBuildingArchitecture(finishes) {
  const unitBox = new BoxGeometry();
  const up = new Vector3(0, 1, 0);
  const matrix = new Matrix4();
  const position = new Vector3();
  const rotation = new Quaternion();
  const scale = new Vector3();

  function build(name, design) {
    const parts = new Map();
    let doorway;

    function add(finish, geometry, x, y, z, width = 1, height = 1, depth = 1, orientation = new Quaternion()) {
      const material = finishes[finish];
      if (!material) throw new Error(`Unknown building material: ${finish}`);
      const data = geometry.index ? geometry.toNonIndexed() : geometry;
      matrix.compose(position.set(x, y, z), orientation, scale.set(width, height, depth));
      data.applyMatrix4(matrix);
      if (!parts.has(material)) parts.set(material, []);
      parts.get(material).push(data);
      if (geometry !== data && geometry !== unitBox) geometry.dispose();
    }

    function box(finish, x, y, z, width, height, depth, yaw = 0, pitch = 0, roll = 0) {
      rotation.setFromEuler(new Euler(pitch, yaw, roll));
      add(finish, unitBox, x, y, z, width, height, depth, rotation);
    }

    function round(finish, x, y, z, diameter, height, top = diameter, sides = 24) {
      add(finish, new CylinderGeometry(top / 2, diameter / 2, height, sides), x, y, z);
    }

    function beam(finish, from, to, diameter) {
      const start = new Vector3(...from);
      const end = new Vector3(...to);
      const direction = end.clone().sub(start);
      const length = direction.length();
      const center = start.lerp(end, 0.5);
      rotation.setFromUnitVectors(up, direction.normalize());
      add(finish, new CylinderGeometry(diameter / 2, diameter / 2, length, 8),
        center.x, center.y, center.z, 1, 1, 1, rotation);
    }

    function leaf(finish, x, y, z, width, length, yaw, pitch, roll) {
      const profile = [[0, 0.14], [0.19, 0.46], [0.43, 0.50], [0.67, 0.38], [0.84, 0.21], [1, 0.01]];
      const shape = plantGeometry();
      shape.strip(profile.map(([t, half]) => [0, t, t ** 1.4 * 0.45, half, 0]), 0xffffff);
      const geometry = shape.build();
      geometry.deleteAttribute("color");
      rotation.setFromEuler(new Euler(pitch, yaw, roll));
      add(finish, geometry, x, y, z, width, length, length, rotation);
    }

    function ring(finish, x, y, z, diameter, thickness, horizontal = false) {
      rotation.setFromEuler(new Euler(horizontal ? Math.PI / 2 : 0, 0, 0));
      add(finish, new TorusGeometry(diameter / 2, thickness / 2, 8, 36), x, y, z, 1, 1, 1, rotation);
    }

    function dome(finish, x, y, z, width, height, depth = width) {
      add(finish, new SphereGeometry(1, 32, 14, 0, Math.PI * 2, 0, Math.PI / 2),
        x, y, z, width / 2, height, depth / 2);
    }

    function sphere(finish, x, y, z, width, height = width, depth = width) {
      const geometry = new IcosahedronGeometry(0.5, 3);
      add(finish, geometry, x, y, z, width, height, depth);
    }

    function roof(finish, x, eave, z, width, depth, rise, gableFinish = finish) {
      const half = width / 2;
      const shape = new Shape();
      shape.moveTo(-half, 0);
      shape.lineTo(half, 0);
      shape.lineTo(0, rise);
      shape.closePath();
      add(gableFinish, new ExtrudeGeometry(shape, { depth: depth - 0.09, bevelEnabled: false }),
        x, eave, z - (depth - 0.09) / 2);
      const length = Math.hypot(half, rise);
      const slope = Math.atan2(rise, half);
      for (const side of [-1, 1]) {
        box(finish, x + side * half / 2, eave + rise / 2 + 0.025, z, length + 0.055, 0.058, depth, 0, 0, -side * slope);
        const seams = Math.max(3, Math.round(depth / 0.17));
        for (let i = 1; i < seams; i += 1) {
          box(finish, x + side * half / 2, eave + rise / 2 + 0.059, z + (i / seams - 0.5) * depth,
            length + 0.038, 0.019, 0.022, 0, 0, -side * slope);
        }
      }
      beam(finish, [x, eave + rise + 0.055, z - depth / 2], [x, eave + rise + 0.055, z + depth / 2], 0.042);
    }

    function window(x, y, z, width, height, frame = "oak", pane = "warm") {
      box(frame, x, y, z, width + 0.065, height + 0.07, 0.066);
      box(pane, x, y, z + 0.035, width, height, 0.013);
      box(frame, x, y, z + 0.045, 0.018, height, 0.016);
      box(frame, x, y - height / 2 - 0.015, z + 0.052, width + 0.09, 0.025, 0.09);
    }

    function door(x, y, z, width, height, frame = "walnut", panel = "cedar") {
      doorway ??= { x, z: z + 0.065, width, height };
      box(frame, x, y + height / 2, z, width + 0.085, height + 0.055, 0.065);
      box(panel, x, y + height / 2, z + 0.037, width, height, 0.017);
      for (const direction of [-1, 1]) {
        box(frame, x + direction * width * 0.19, y + height / 2, z + 0.048, 0.011, height, 0.014);
      }
      sphere("brass", x + width * 0.32, y + height * 0.49, z + 0.061, 0.043);
    }

    function arch(finish, x, y, z, width, leg, thickness, depth) {
      const radius = width / 2;
      const jamb = radius + thickness / 2;
      box(finish, x - jamb, y + leg / 2, z, thickness, leg, depth);
      box(finish, x + jamb, y + leg / 2, z, thickness, leg, depth);
      const shape = new Shape();
      shape.absarc(0, 0, radius + thickness, 0, Math.PI, false);
      shape.lineTo(-radius, 0);
      shape.absarc(0, 0, radius, Math.PI, 0, true);
      shape.closePath();
      add(finish, new ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 16 }),
        x, y + leg, z - depth / 2);
    }

    function barrel(finish, x, y, z, width, height) {
      round(finish, x, y + height / 2, z, width, height);
      for (const level of [0.17, 0.82]) round("iron", x, y + height * level, z, width + 0.015, 0.029);
      round("walnut", x, y + height + 0.007, z, width * 0.92, 0.018);
    }

    design({ box, round, beam, leaf, ring, dome, sphere, roof, window, door, arch, barrel });

    const group = createModelGroup(name);
    for (const [material, components] of parts) {
      const geometry = mergeGeometries(components);
      components.forEach((component) => component.dispose());
      const mesh = new Mesh(geometry, material);
      mesh.castShadow = mesh.receiveShadow = true;
      group.add(mesh);
    }
    const bounds = new Box3().setFromObject(group);
    const center = bounds.getCenter(new Vector3());
    group.children.forEach((mesh) => mesh.geometry.translate(-center.x, -bounds.min.y, -center.z));
    const depth = bounds.max.z - bounds.min.z;
    return { group, doorway, center, depth, height: bounds.max.y - bounds.min.y,
      footprint: Math.hypot(bounds.max.x - bounds.min.x, depth) };
  }

  return { build, dispose: () => unitBox.dispose() };
}
