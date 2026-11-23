import { Box3, MOUSE, PerspectiveCamera, Sphere, Vector3 } from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { chooseObservation } from "./observation.js";

export function createVillageCamera(canvas, renderer, instances) {
  const camera = new PerspectiveCamera(34, 1, 0.1, 150);
  const controls = new OrbitControls(camera, canvas);
  controls.mouseButtons = { LEFT: null, MIDDLE: MOUSE.ROTATE, RIGHT: MOUSE.PAN };
  controls.addEventListener("start", () => canvas.classList.add("is-moving"));
  controls.addEventListener("end", () => canvas.classList.remove("is-moving"));
  controls.target.set(0, -0.7, 0);
  controls.minDistance = 13;
  controls.maxDistance = 85;
  controls.maxPolarAngle = Math.PI * 0.45;
  controls.enableDamping = true;
  controls.dampingFactor = 0.1;
  camera.position.set(32, 26, 37);
  controls.update();
  controls.saveState();

  const axis = new Vector3();
  const lastObserved = new Map();
  const followedPosition = new Vector3();
  let observation = null;

  let transition;
  controls.addEventListener("start", () => { transition = null; });
  function resize() {
    const width = Math.max(1, canvas.clientWidth);
    const height = Math.max(1, canvas.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    const verticalFov = 2 * Math.atan(Math.tan(Math.PI / 8) / camera.aspect) * 180 / Math.PI;
    camera.fov = Math.min(85, Math.max(38, verticalFov));
    const offset = width <= 1050 ? 0.19 : 0.13;
    camera.setViewOffset(width, height, 0, height * offset, width, height);
  }

  function zoom(factor) {
    transition = null;
    axis.subVectors(camera.position, controls.target);
    axis.setLength(Math.min(controls.maxDistance, Math.max(controls.minDistance, axis.length() * factor)));
    camera.position.copy(controls.target).add(axis);
    controls.update();
  }

  function moveCamera(position, target, minDistance) {
    controls.enableDamping = false;
    controls.update();
    controls.minDistance = minDistance;
    controls.target.copy(target);
    camera.position.copy(position);
    controls.update();
    controls.enableDamping = true;
  }

  function frameModel(model) {
    model.updateWorldMatrix(true, false);
    const { center, radius } = new Box3().setFromObject(model).getBoundingSphere(new Sphere());
    const verticalAngle = camera.fov * Math.PI / 360;
    const horizontalAngle = Math.atan(Math.tan(verticalAngle) * camera.aspect);
    const distance = Math.max(1, 1.24 * radius / Math.sin(Math.min(verticalAngle, horizontalAngle)));
    center.y -= radius * 0.24;
    axis.subVectors(camera.position, controls.target).normalize();
    glideTo(center.clone().addScaledVector(axis, distance), center, distance * 0.75);
  }

  function glideTo(position, target, minDistance) {
    if (canvas.ownerDocument.defaultView.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      transition = null;
      moveCamera(position, target, minDistance);
      return;
    }
    transition = {
      from: camera.position.clone(), fromTarget: controls.target.clone(),
      position, target, minDistance, start: performance.now(),
    };
  }

  function preview(subject) {
    const model = subject?.resolve();
    if (!model) return null;
    if (subject.type) lastObserved.set(subject.type, subject.index);
    // Switching subjects keeps the camera position from before the first preview.
    const previous = observation?.previous ?? {
      position: camera.position.clone(),
      target: controls.target.clone(),
      minDistance: controls.minDistance,
    };
    observation = { subject, previous };
    if (subject.follow) model.getWorldPosition(followedPosition);
    frameModel(model);
    return subject.label;
  }

  function inspect(type) {
    const models = instances.get(type);
    if (!models?.length) return false;

    const index = chooseObservation(models.length, lastObserved.get(type));
    return Boolean(preview({ label: models[index].name, type, index, resolve: () => instances.get(type)?.[index] }));
  }

  function endInspection() {
    if (!observation) return;
    const { position, target, minDistance } = observation.previous;
    observation = null;
    glideTo(position, target, minDistance);
  }

  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();

  return {
    camera,
    update(time) {
      if (transition) {
        const { from, fromTarget, position, target, start, minDistance } = transition;
        const followed = observation?.subject.follow && observation.subject.resolve();
        if (followed) {
          followed.getWorldPosition(axis).sub(followedPosition);
          position.add(axis);
          target.add(axis);
          followedPosition.add(axis);
        }
        const progress = Math.max(0, Math.min(1, (time - start) / 720));
        const ease = progress * progress * (3 - 2 * progress);
        moveCamera(from.clone().lerp(position, ease), fromTarget.clone().lerp(target, ease), progress === 1 ? minDistance : 0.1);
        if (progress === 1) transition = null;
        return;
      }
      if (observation?.subject.follow) {
        const model = observation.subject.resolve();
        if (model) {
          model.getWorldPosition(axis);
          axis.sub(followedPosition);
          camera.position.add(axis);
          controls.target.add(axis);
          followedPosition.add(axis);
        }
      }
      controls.update();
    },
    zoom,
    pan: (dx, dy) => { transition = null; controls.pan(dx, dy); },
    inspect,
    preview,
    endInspection,
    zoomIn: () => zoom(0.82),
    zoomOut: () => zoom(1 / 0.82),
    rotate: (side, tilt) => {
      transition = null;
      controls.rotateLeft(side);
      controls.rotateUp(tilt);
    },
    reset() {
      transition = null;
      const subject = observation?.subject.resolve();
      if (subject) frameModel(subject);
      else if (observation) endInspection();
      else controls.reset();
    },
    dispose() {
      observer.disconnect();
      canvas.classList.remove("is-moving");
      controls.dispose();
    },
  };
}
