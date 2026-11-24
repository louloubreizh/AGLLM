import assert from "node:assert/strict";
import { test } from "node:test";
import { Color, Scene } from "three";
import { createLighting } from "../src/world3d/lighting.js";

test("une nouvelle saison fait évoluer ensemble le paysage, les arbres et la brume", () => {
  const material = () => ({ color: new Color() });
  const materials = Object.fromEntries(
    ["grass", "water", "dark", "leaf", "crop", "groundCover", "buildingLeaves", "pool"]
      .map((key) => [key, material()]),
  );
  const canopy = { broadleaf: material(), drooping: material(), needle: material() };
  const scene = new Scene();
  const lighting = createLighting(scene, materials, canopy);
  lighting.update({ season: "summer" }, 0);
  const summer = materials.grass.color.clone();
  lighting.update({ season: "winter", weather: "cold" }, 10);
  assert.ok(materials.grass.color.equals(summer));
  lighting.animate(1310);
  const halfway = materials.grass.color.clone();
  assert.ok(halfway.equals(summer.clone().lerp(new Color(0xa8bcc2), 0.5)));
  assert.equal(scene.fog.near, 64);
  assert.notEqual(canopy.broadleaf.color.getHex(), 0xa1b7b2);

  lighting.update({ season: "autumn" }, 1310);
  lighting.animate(1310);
  assert.ok(materials.grass.color.equals(halfway));
  lighting.update({ season: "autumn" }, 1450, true);
  assert.equal(materials.grass.color.getHex(), 0x877044);
  assert.equal(canopy.broadleaf.color.getHex(), 0xe5b379);
  lighting.dispose();
});
