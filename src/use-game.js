import { useCallback, useEffect, useRef, useState } from "react";
import { dayDuration } from "./game/catalog.js";
import { advanceDay, newGame, perform } from "./game/engine.js";
import { parseSave, restore, saveKey, serialize } from "./game/saves.js";
import { readGameState } from "./game-state.js";

export function useGame() {
  const game = useRef(null);
  const autosaveAllowed = useRef(true);
  const [state, setState] = useState(null);
  const [status, setStatus] = useState("checking");
  const [notice, setNotice] = useState("");
  const snapshot = readGameState(state);

  const publish = useCallback(() => setState({ ...game.current }), []);

  const save = useCallback((manual = false) => {
    if (!game.current || (!manual && !autosaveAllowed.current)) return;
    try {
      localStorage.setItem(saveKey, serialize(game.current));
      autosaveAllowed.current = true;
      if (manual) setNotice("Partie sauvegardée.");
    } catch {
      setNotice("Le navigateur n’a pas pu enregistrer la partie. Vous pouvez l’exporter depuis les options.");
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const hold = Promise.withResolvers();
    let clock;
    let autosave;
    let ending = false;
    const connection = import.meta.env.DEV ? null : new EventSource("/api/session");

    function persist() { save(); }
    function stop(event) {
      ending = true;
      connection?.close();
      persist();
      game.current = null;
      setState(null);
      controller.abort();
      hold.resolve();
      clearInterval(clock);
      clearInterval(autosave);
      window.removeEventListener("pagehide", persist);
      setStatus("stopped");
      if (event?.type === "shutdown" && JSON.parse(event.data).closeBrowser) window.close();
    }

    function begin() {
      if (ending || game.current) return;
      try {
        game.current = restore(localStorage);
      } catch (error) {
        autosaveAllowed.current = false;
        game.current = newGame();
        setNotice(`${error.message} Vous pouvez importer une sauvegarde depuis les options. L’enregistrement automatique est suspendu.`);
      }
      publish();
      setStatus("playing");
      clock = window.setInterval(() => {
        for (let day = 0; day < game.current.speed; day += 1) {
          if (!advanceDay(game.current)) return;
        }
        publish();
      }, dayDuration);
      autosave = window.setInterval(persist, 15000);
      window.addEventListener("pagehide", persist);
    }

    async function acquire() {
      if (!navigator.locks) {
        begin();
        return;
      }
      setStatus("waiting");
      try {
        await navigator.locks.request("agllm-partie", { signal: controller.signal }, async () => {
          begin();
          await hold.promise;
        });
      } catch {
        if (!controller.signal.aborted) stop();
      }
    }

    if (connection) {
      connection.onopen = acquire;
      connection.onerror = stop;
      connection.addEventListener("shutdown", stop);
    } else {
      acquire();
    }
    return () => {
      connection?.close();
      controller.abort();
      hold.resolve();
      clearInterval(clock);
      clearInterval(autosave);
      window.removeEventListener("pagehide", persist);
      game.current = null;
    };
  }, [publish, save]);

  function act(command, id, value) {
    if (game.current && perform(game.current, command, id, value)) publish();
  }

  function importSave(source) {
    if (!game.current) throw new Error("La partie est fermée.");
    const imported = parseSave(source);
    localStorage.setItem(saveKey, serialize(imported));
    game.current = imported;
    autosaveAllowed.current = true;
    publish();
    setNotice("Sauvegarde importée.");
  }

  return { state, snapshot, status, notice, act, save: () => save(true), importSave, exportSave: () => serialize(game.current) };
}
