import { Box3, Color, DirectionalLight, HemisphereLight, PerspectiveCamera, Scene, Vector3, WebGLRenderer } from "three";
import { createRenderResources } from "../../render-resources.js";
import { speciesModels } from "./species-models.js";

export function createSpeciesPreview(canvas) {
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
  const resources = createRenderResources(new Color(0x172e24));
  const scene = new Scene();
  const camera = new PerspectiveCamera(32, 1, 0.01, 30);
  const key = new DirectionalLight(0xffe4bf, 2.6);
  key.position.set(2, 4, 3);
  scene.add(new HemisphereLight(0xc7e4ff, 0x9b8561, 2.3), key);
  let animal;
  let center;
  let diameter;

  return {
    show(species) {
      if (animal) scene.remove(animal.model);
      animal = speciesModels[species](resources, 0);
      scene.add(animal.model);
      const bounds = new Box3().setFromObject(animal.model);
      center = bounds.getCenter(new Vector3());
      diameter = bounds.getSize(new Vector3()).length();
    },
    render(width, height, time = 0, mode = "idle", yaw = 0.7, pitch = 0.22) {
      if (canvas.width !== width || canvas.height !== height) renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      const radius = diameter * 1.48 / Math.min(1, camera.aspect);
      camera.position.set(Math.sin(yaw) * radius, pitch * radius, Math.cos(yaw) * radius).add(center);
      camera.lookAt(center);
      const motion = mode === "move" ? 1 : 0;
      animal.animate(time * motion * 0.65, motion, mode === "look" ? (1 - Math.cos(time * 2.5)) / 2 : 0,
        time, mode === "look" ? Math.sin(time * 2.5) * 0.8 : 0);
      renderer.render(scene, camera);
    },
    dispose() {
      resources.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
