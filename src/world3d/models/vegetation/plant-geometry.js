import { BufferGeometry, Color, Float32BufferAttribute, Vector3 } from "three";

export function plantGeometry() {
  const positions = [];
  const colors = [];
  const uvs = [];
  const indices = [];

  function vertex(x, y, z, color, shade, u, v) {
    positions.push(x, y, z);
    colors.push(color.r * shade, color.g * shade, color.b * shade);
    uvs.push(u, v);
    return positions.length / 3 - 1;
  }

  function strip(rows, color) {
    const tint = new Color(color);
    let last;
    for (const [index, [x, y, z, dx, dz, shade = 1]] of rows.entries()) {
      const v = index / (rows.length - 1);
      const a = vertex(x - dx, y, z - dz, tint, shade * 0.86, 0, v);
      const b = vertex(x, y + Math.hypot(dx, dz) * 0.28, z, tint, shade, 0.5, v);
      const c = vertex(x + dx, y, z + dz, tint, shade * 0.91, 1, v);
      if (last !== undefined) indices.push(last, a, b, last, b, last + 1, last + 1, b, c, last + 1, c, last + 2);
      last = a;
    }
  }

  function card(x, y, z, width, height, azimuth, tilt, color, shade) {
    const dx = Math.cos(azimuth) * width / 2;
    const dz = Math.sin(azimuth) * width / 2;
    const sx = -Math.sin(azimuth) * Math.sin(tilt) * height / 2;
    const sz = Math.cos(azimuth) * Math.sin(tilt) * height / 2;
    const sy = Math.cos(tilt) * height / 2;
    const tint = new Color(color);
    const start = vertex(x - dx - sx, y - sy, z - dz - sz, tint, shade * 0.74, 0, 0);
    vertex(x + dx - sx, y - sy, z + dz - sz, tint, shade * 0.86, 1, 0);
    vertex(x + dx + sx, y + sy, z + dz + sz, tint, shade, 1, 1);
    vertex(x - dx + sx, y + sy, z - dz + sz, tint, shade * 0.92, 0, 1);
    indices.push(start, start + 1, start + 2, start, start + 2, start + 3);
  }

  function stem(from, to, base, tip, color, sides = 6) {
    const start = new Vector3(...from);
    const end = new Vector3(...to);
    const axis = end.clone().sub(start).normalize();
    const tangent = axis.clone().cross(Math.abs(axis.y) > 0.9 ? new Vector3(1, 0, 0) : new Vector3(0, 1, 0)).normalize();
    const bitangent = axis.clone().cross(tangent);
    const tint = new Color(color);
    const first = positions.length / 3;
    for (const [ring, [center, radius]] of [[start, base], [end, tip]].entries()) {
      for (let i = 0; i <= sides; i++) {
        const angle = i / sides * Math.PI * 2;
        const point = center.clone().addScaledVector(tangent, Math.cos(angle) * radius).addScaledVector(bitangent, Math.sin(angle) * radius);
        vertex(point.x, point.y, point.z, tint, 0.86 + 0.14 * Math.cos(angle + 0.6), i / sides, ring * start.distanceTo(end));
        if (!ring || !i) continue;
        const current = first + sides + 1 + i;
        indices.push(current - sides - 2, current - sides - 1, current, current - sides - 2, current, current - 1);
      }
    }
  }

  function build() {
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
    geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
    geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }

  return { strip, card, stem, build };
}

export function plantRandom(seed) {
  let state = seed;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}
