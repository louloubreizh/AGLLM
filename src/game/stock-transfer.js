import LZString from "lz-string";
import { resources } from "./catalog.js";
import { maxSavedStock, serialize } from "./saves.js";

export const maxTransferFileSize = 4_500_000;
const sharedStocks = { wood: "timber", iron: "metal", science: "notes" };
const isRecord = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

export function parseTransferSave(source) {
  if (typeof source !== "string" || !source.trim()) throw new Error("La sauvegarde est vide.");
  if (source.length > maxTransferFileSize) throw new Error("Le fichier de sauvegarde est trop volumineux.");
  const content = source.replace(/^\uFEFF/, "");
  const trimmed = content.trim();
  let save;
  try {
    let json = trimmed;
    if (!trimmed.startsWith("{")) {
      const base64 = /^[A-Za-z0-9+/=\s]+$/.test(trimmed)
        ? LZString.decompressFromBase64(trimmed.replace(/\s/g, "")) : null;
      json = base64?.startsWith("{") ? base64 : LZString.decompressFromUTF16(content);
    }
    if (!json || json.length > 8_000_000) throw new Error();
    save = JSON.parse(json);
  } catch {
    throw new Error("Impossible de lire le fichier de sauvegarde.");
  }
  if (!isRecord(save) || !Number.isSafeInteger(save.saveVersion) || save.saveVersion < 1
    || !isRecord(save.calendar) || !isRecord(save.village) || !Array.isArray(save.buildings)
    || !Array.isArray(save.resources)) {
    throw new Error("Le fichier doit être une sauvegarde Kittens Game.");
  }
  const entries = save.resources.filter((entry) => typeof entry?.name === "string" && Object.hasOwn(sharedStocks, entry.name));
  if (!entries.length) throw new Error("Le fichier ne contient aucun stock de bois, de fer ou de science.");
  if (new Set(entries.map(({ name }) => name)).size !== entries.length
    || entries.some(({ value }) => !Number.isFinite(value) || value < 0)) {
    throw new Error("Le fichier contient un stock transférable invalide ou en double.");
  }
  return {
    save,
    stocks: entries.map(({ name, value }) => ({ name, id: sharedStocks[name], value })),
  };
}

export function copyStocksToAGLLM(state, transfer) {
  const stocks = { ...state.stocks };
  for (const { id, value } of transfer.stocks) {
    if (value > maxSavedStock) {
      throw new Error(`Le stock « ${resources[id].label} » dépasse la limite d’une sauvegarde AGLLM.`);
    }
    stocks[id] = value;
  }
  return serialize({ ...state, stocks });
}

export function copyStocksToKittensGame(state, { save, stocks }) {
  const quantities = new Map(stocks.map(({ name, id }) => [name, state.stocks[id]]));
  const updated = save.resources.map((stock) => quantities.has(stock?.name)
    ? { ...stock, value: quantities.get(stock.name) }
    : stock);
  return LZString.compressToBase64(JSON.stringify({ ...save, resources: updated }));
}
