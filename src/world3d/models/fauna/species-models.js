import { createCat } from "./cat.js";
import { createDog } from "./dog.js";
import { createRabbit } from "./rabbit.js";
import { createRaptor } from "./raptor.js";
import { createDrake } from "./drake.js";

export const speciesModels = { cat: createCat, dog: createDog, rabbit: createRabbit, raptor: createRaptor, drake: createDrake };
