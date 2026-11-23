import { Raycaster, Vector2 } from "three";

const labels = {
  "Island plateau": "Plateau de l’île",
  Cliff: "Falaise",
  Lake: "Lac",
  River: "Rivière",
  "Village paths": "Chemins du village",
  "Village square": "Place du village",
  Bridge: "Pont",
  Rock: "Rocher",
  Tree: "Arbre",
  Cat: "Chat",
};

export function createScenePicker(camera, buildings, terrain, trails, residents) {
  const raycaster = new Raycaster();
  const pointer = new Vector2();

  return function pick(x, y) {
    const targets = new Map();
    function add(model, target) {
      if (!model.visible) return;
      model.updateWorldMatrix(true, true);
      model.traverseVisible((child) => {
        if (child.isMesh && !child.isInstancedMesh) targets.set(child, target);
      });
    }

    for (const [type, models] of buildings) {
      models.forEach((model, index) => add(model, {
        label: model.name,
        type, index,
        resolve: () => buildings.get(type)?.[index],
      }));
    }
    for (const model of [...terrain.children, trails, ...residents.children]) {
      add(model, {
        label: labels[model.name] ?? model.name,
        resolve: () => model.parent && model.visible ? model : null,
        follow: model.parent === residents,
      });
    }
    camera.updateMatrixWorld();
    raycaster.setFromCamera(pointer.set(x * 2 - 1, 1 - y * 2), camera);
    const hit = raycaster.intersectObjects([...targets.keys()], false)[0];
    return hit ? targets.get(hit.object) : null;
  };
}
