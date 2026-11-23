import { BufferGeometry, Color, Float32BufferAttribute, InstancedMesh, Object3D } from "three";
import { noise } from "./noise.js";
import { edgeRatio, riverExtent, riverWidth, riverX, terraceRadius, terrainY } from "./terrain-profile.js";

export function groundCoverGeometry() {
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute([
    -0.065, 0, -0.028, 0.021, 0, -0.01, -0.12, 0.31, 0.035,
    0.016, 0, 0.015, 0.084, 0, 0.048, 0.14, 0.26, -0.02,
    -0.021, 0, -0.035, 0.027, 0, 0.023, 0.038, 0.39, -0.12,
  ], 3));
  geometry.computeVertexNormals();
  return geometry;
}

export function createGroundCover(geometry, material) {
  const candidates = 5800;
  const grass = new InstancedMesh(geometry, material, candidates);
  const transform = new Object3D();
  const color = new Color();
  const tufts = [];
  for (let i = 1; i <= candidates; i += 1) {
    const angle = i * 2.39996323;
    const radius = 19.1 * Math.sqrt(i / candidates) * edgeRatio(angle);
    const x = radius * Math.cos(angle);
    const z = radius * Math.sin(angle);
    const bankDistance = Math.abs(x - riverX(z)) - riverWidth(z);
    const nearBank = Math.abs(z) < riverExtent + 0.35 && bankDistance > 0.21 && bankDistance < 1.08;
    const meadow = Math.max(Math.abs(x), Math.abs(z)) > 11.85 && noise(x * 0.39, z * 0.39) > -0.15;
    if ((!nearBank && !meadow) || radius > terraceRadius * edgeRatio(angle) - 0.22
      || (Math.abs(z) < riverExtent + 0.1 && bankDistance < 0.22)) continue;

    const size = 0.40 + ((i * 17) % 19) * 0.029;
    transform.position.set(x, terrainY(x, z) - 0.025, z);
    transform.rotation.y = angle * 2.7;
    transform.scale.set(size, nearBank ? size * 1.45 : size, size);
    transform.updateMatrix();
    const brightness = 0.62 + ((i * 11) % 23) * 0.019;
    color.setRGB(brightness * 1.05, brightness, brightness * 0.75);
    tufts.push({ x, z, matrix: transform.matrix.clone(), color: color.clone() });
  }
  grass.name = "Meadow and riverbank grasses";
  grass.receiveShadow = true;

  function update(keep) {
    let count = 0;
    for (const tuft of tufts) {
      if (keep && !keep(tuft.x, tuft.z, 0.14)) continue;
      grass.setMatrixAt(count, tuft.matrix);
      grass.setColorAt(count, tuft.color);
      count += 1;
    }
    grass.count = count;
    grass.instanceMatrix.needsUpdate = true;
    grass.instanceColor.needsUpdate = true;
    grass.computeBoundingSphere();
  }

  update();
  return { mesh: grass, update };
}
