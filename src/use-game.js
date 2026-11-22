import { useEffect, useRef, useState } from "react";
import { readGameState } from "./game-state.js";

function runningGame(frame) {
  try {
    const game = frame.current?.contentWindow?.gamePage;
    return game?.worker || game?._mainTimer ? game : null;
  } catch {
    return null;
  }
}

export function useGame() {
  const frame = useRef(null);
  const [server, setServer] = useState(import.meta.env.DEV ? "ready" : "starting");
  const [access, setAccess] = useState("checking");
  const [snapshot, setSnapshot] = useState(null);
  const showGame = server === "ready" && access === "granted";

  useEffect(() => {
    function save() {
      runningGame(frame)?.save();
    }
    window.addEventListener("pagehide", save);

    const connection = import.meta.env.DEV ? null : new EventSource("/api/session");
    if (connection) {
      connection.onopen = () => setServer("ready");
      function stop(event) {
        connection.close();
        try {
          save();
        } finally {
          window.removeEventListener("pagehide", save);
          setServer("stopped");
          if (event.type === "shutdown" && JSON.parse(event.data).closeBrowser) {
            window.close();
          }
        }
      }
      connection.onerror = stop;
      connection.addEventListener("shutdown", stop);
    }
    return () => {
      connection?.close();
      window.removeEventListener("pagehide", save);
    };
  }, []);

  useEffect(() => {
    if (server !== "ready") {
      return;
    }
    const controller = new AbortController();
    const hold = Promise.withResolvers();

    async function openGame() {
      const response = await fetch("/jeu/version.json", { signal: controller.signal });
      if (!response.ok) {
        setAccess("missing");
        return;
      }
      if (!navigator.locks) {
        setAccess("granted");
        return;
      }

      setAccess("waiting");
      await navigator.locks.request("kgllm-partie", { signal: controller.signal }, async () => {
        if (!controller.signal.aborted) {
          setAccess("granted");
          await hold.promise;
        }
      });
    }

    openGame().catch(() => {
      if (!controller.signal.aborted) {
        setAccess("missing");
      }
    });
    return () => {
      controller.abort();
      hold.resolve();
    };
  }, [server]);

  useEffect(() => {
    if (!showGame) {
      return;
    }
    function refresh() {
      setSnapshot(readGameState(runningGame(frame)));
    }
    refresh();
    const interval = window.setInterval(refresh, 500);
    return () => window.clearInterval(interval);
  }, [showGame]);

  const status = server === "stopped" ? "stopped" : showGame ? (snapshot ? "playing" : "loading") : access;
  return { frame, showGame, snapshot: showGame ? snapshot : null, status };
}
