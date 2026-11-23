import { planVillage } from "./layout.js";

self.onmessage = ({ data: entries }) => {
  self.postMessage(planVillage(entries, 0));
};
