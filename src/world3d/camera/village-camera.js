import { Box3, MOUSE, PerspectiveCamera, Quaternion, Sphere, Spherical, Vector3 } from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { mix, smoothstep } from "../models/landscape/noise.js";
import { lakeHorizonRadius } from "../models/landscape/terrain-profile.js";
import { chooseObservation } from "./observation.js";

export function createVillageCamera(canvas, renderer, instances) {
  const camera = new PerspectiveCamera(34, 1, 0.1, lakeHorizonRadius * 2);
  const controls = new OrbitControls(camera, canvas);
  const orbitLimit = Math.PI * 0.45;
  let overviewLimit = orbitLimit;
  controls.mouseButtons = { LEFT: null, MIDDLE: MOUSE.ROTATE, RIGHT: MOUSE.PAN };
  controls.addEventListener("start", () => canvas.classList.add("is-moving"));
  controls.addEventListener("end", () => canvas.classList.remove("is-moving"));
  controls.target.set(0, -0.7, 0);
  controls.minDistance = 13;
  controls.maxDistance = 85;
  controls.maxPolarAngle = orbitLimit;
  controls.enableDamping = true;
  controls.dampingFactor = 0.1;
  camera.position.set(32, 26, 37);
  controls.update();
  controls.saveState();

  const axis = new Vector3();
  const orientation = new Quaternion();
  const orbit = new Spherical();
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
    const projection = camera.projectionMatrix.elements;
    const topRay = Math.atan((1 + projection[9]) / projection[5]);
    // Keep the top of the overview pointed into the lake on narrow screens and low orbits.
    overviewLimit = Math.min(orbitLimit, Math.PI / 2 - topRay - Math.PI / 15);
    updateControls();
  }

  function updateControls() {
    const distance = camera.position.distanceTo(controls.target);
    const overview = smoothstep(controls.maxDistance * 0.77, controls.maxDistance, distance);
    controls.maxPolarAngle = mix(orbitLimit, overviewLimit, overview);
    controls.update();
  }

  function zoom(factor) {
    transition = null;
    axis.subVectors(camera.position, controls.target);
    axis.setLength(Math.min(controls.maxDistance, Math.max(controls.minDistance, axis.length() * factor)));
    camera.position.copy(controls.target).add(axis);
    updateControls();
  }

  function moveCamera(position, target, minDistance) {
    controls.enableDamping = false;
    updateControls();
    controls.minDistance = minDistance;
    controls.target.copy(target);
    camera.position.copy(position);
    updateControls();
    controls.enableDamping = true;
  }

  function frameModel(model, faceFront) {
    model.updateWorldMatrix(true, false);
    const { center, radius } = new Box3().setFromObject(model).getBoundingSphere(new Sphere());
    const verticalAngle = camera.fov * Math.PI / 360;
    const horizontalAngle = Math.atan(Math.tan(verticalAngle) * camera.aspect);
    const distance = Math.max(1, 1.24 * radius / Math.sin(Math.min(verticalAngle, horizontalAngle)));
    if (faceFront) {
      const elevation = Math.PI / 8;
      axis.set(0, 0, 1).applyQuaternion(model.getWorldQuaternion(orientation)).setY(0).normalize();
      axis.multiplyScalar(Math.cos(elevation)).setY(Math.sin(elevation));
      // Compensate for the overview's vertical view offset when centering a facade.
      const projection = camera.projectionMatrix.elements;
      const shift = -projection[9] / projection[5];
      center.y += distance * shift / (Math.cos(elevation) - shift * Math.sin(elevation));
    } else {
      center.y -= radius * 0.24;
      axis.subVectors(camera.position, controls.target).normalize();
    }
    glideTo(center.clone().addScaledVector(axis, distance), center, distance * 0.75);
  }

  function glideTo(position, target, minDistance) {
    if (canvas.ownerDocument.defaultView.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      transition = null;
      moveCamera(position, target, minDistance);
      return;
    }
    const from = new Spherical().setFromVector3(axis.subVectors(camera.position, controls.target));
    const to = new Spherical().setFromVector3(axis.subVectors(position, target));
    const turn = to.theta - from.theta;
    to.theta = from.theta + Math.atan2(Math.sin(turn), Math.cos(turn));
    transition = { from, to, fromTarget: controls.target.clone(), target, minDistance, start: performance.now() };
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
    frameModel(model, Boolean(subject.type));
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
        const { from, to, fromTarget, target, start, minDistance } = transition;
        const followed = observation?.subject.follow && observation.subject.resolve();
        if (followed) {
          followed.getWorldPosition(axis).sub(followedPosition);
          target.add(axis);
          followedPosition.add(axis);
        }
        const progress = Math.max(0, Math.min(1, (time - start) / 720));
        const ease = progress * progress * (3 - 2 * progress);
        const focus = fromTarget.clone().lerp(target, ease);
        orbit.set(mix(from.radius, to.radius, ease), mix(from.phi, to.phi, ease), mix(from.theta, to.theta, ease));
        moveCamera(axis.setFromSpherical(orbit).add(focus), focus, progress === 1 ? minDistance : 0.1);
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
      updateControls();
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
      if (subject) frameModel(subject, Boolean(observation.subject.type));
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
