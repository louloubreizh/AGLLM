import { Raycaster, Vector2 } from "three";

const labels = {
  Cliff: "Falaise",
  River: "Rivière",
  "Village paths": "Chemins du village",
  "Village square": "Place du village",
  Bridge: "Pont",
  Rock: "Rocher",
  Tree: "Arbre",
};

export function createScenePicker(camera, buildings, terrain, trails, residents) {
  const raycaster = new Raycaster();
  const pointer = new Vector2();

  return function pick(x, y) {
    const targets = new Map();
    camera.updateMatrixWorld();
    raycaster.setFromCamera(pointer.set(x * 2 - 1, 1 - y * 2), camera);
    function add(model, target) {
      if (!model.visible) return;
      model.updateWorldMatrix(true, true);
      model.traverseVisible((child) => {
        if (child.isMesh && !child.isInstancedMesh) targets.set(child, target);
      });
    }

    for (const [type, models] of buildings.instances) {
      models.forEach((model, index) => {
        if (!raycaster.ray.intersectsBox(buildings.bounds.get(model))) return;
        add(model, {
          label: model.name,
          type, index,
          resolve: () => buildings.instances.get(type)?.[index],
        });
      });
    }
    for (const model of [...terrain.children, trails]) {
      if (model.name === "Island plateau" || model.name === "Lake") {
        add(model, null);
        continue;
      }
      add(model, {
        label: model.userData.species ?? labels[model.name] ?? model.name,
        resolve: () => model.parent && model.visible ? model : null,
      });
    }
    for (const model of residents.children) {
      if (raycaster.ray.distanceSqToPoint(model.position) > 0.38 ** 2) continue;
      add(model, {
        label: model.name,
        resolve: () => model.parent === residents ? model : null,
        follow: true,
      });
    }
    const hit = raycaster.intersectObjects([...targets.keys()], false)[0];
    return hit ? targets.get(hit.object) : null;
  };
}
