function hash(x, z) {
  const value = Math.imul(x, 374761393) + Math.imul(z, 668265263);
  return ((Math.imul(value ^ (value >>> 13), 1274126177) >>> 0) / 4294967295) * 2 - 1;
}

export const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
export const mix = (a, b, amount) => a + (b - a) * amount;

export function smoothstep(min, max, value) {
  const amount = clamp((value - min) / (max - min));
  return amount * amount * (3 - 2 * amount);
}

export function noise(x, z, period) {
  const xi = Math.floor(x);
  const zi = Math.floor(z);
  const u = smoothstep(0, 1, x - xi);
  const v = smoothstep(0, 1, z - zi);
  const wrap = period ? (value) => ((value % period) + period) % period : (value) => value;
  const x0 = wrap(xi);
  const z0 = wrap(zi);
  const x1 = wrap(xi + 1);
  const z1 = wrap(zi + 1);
  return mix(mix(hash(x0, z0), hash(x1, z0), u), mix(hash(x0, z1), hash(x1, z1), u), v);
}
