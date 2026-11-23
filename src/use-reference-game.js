import { useCallback, useEffect, useRef, useState } from "react";

const seasons = ["spring", "summer", "autumn", "winter"];

function runningGame(frame) {
  try {
    const game = frame.current?.contentWindow?.gamePage;
    return game?.worker || game?._mainTimer ? game : null;
  } catch {
    return null;
  }
}

function snapshotFor(frame) {
  const game = runningGame(frame);
  if (!game) return null;
  const { calendar, bld, village, resPool } = game;
  const document = frame.current.contentDocument;
  const pollutionBase = bld.getPollutionLevelBase();
  return {
    calendarText: document.getElementById("calendarDiv")?.textContent ?? "",
    season: calendar.getCurSeason()?.name ?? seasons[calendar.season],
    weather: calendar.weather,
    paused: Boolean(game.isPaused),
    population: village.getKittens(),
    loginOpen: Boolean(document.querySelector(".login-popup")),
    toolbar: {
      happiness: Math.floor(village.happiness * 100),
      pollution: pollutionBase > 0 ? (bld.cathPollution / pollutionBase) * 100 : null,
      energy: { production: resPool.energyProd, consumption: resPool.energyCons, winterProduction: resPool.energyWinterProd },
      sorrow: resPool.get("sorrow").value,
    },
    buildings: bld.buildingsData.flatMap((building, slot) => building.val > 0 ? [{
      id: building.name,
      label: building.stages?.[building.stage]?.label || building.label,
      count: Math.floor(building.val),
      stage: building.stage ?? 0,
      slot,
    }] : []),
  };
}

export function useReferenceGame() {
  const frame = useRef(null);
  const [access, setAccess] = useState("checking");
  const [engineStatus, setEngineStatus] = useState("loading");
  const [snapshot, setSnapshot] = useState(null);
  const [notice, setNotice] = useState("");
  const state = access === "granted";

  useEffect(() => {
    const controller = new AbortController();
    const hold = Promise.withResolvers();
    const connection = import.meta.env.DEV ? null : new EventSource("/api/session");

    function persist() {
      runningGame(frame)?.save();
    }

    function stop(event) {
      connection?.close();
      try {
        persist();
      } finally {
        window.removeEventListener("pagehide", persist);
        controller.abort();
        hold.resolve();
        setAccess("stopped");
        if (event?.type === "shutdown" && JSON.parse(event.data).closeBrowser) window.close();
      }
    }

    async function acquire() {
      if (!navigator.locks) {
        setAccess("granted");
        return;
      }
      setAccess("waiting");
      try {
        await navigator.locks.request("agllm-reference-game", { signal: controller.signal }, async () => {
          if (controller.signal.aborted) return;
          setAccess("granted");
          await hold.promise;
        });
      } catch {
        if (!controller.signal.aborted) stop();
      }
    }

    window.addEventListener("pagehide", persist);
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
      window.removeEventListener("pagehide", persist);
    };
  }, []);

  useEffect(() => {
    if (!state) return;
    const timer = window.setInterval(() => {
      const current = snapshotFor(frame);
      if (current) {
        setSnapshot(current);
        setEngineStatus("playing");
      }
    }, 350);
    return () => window.clearInterval(timer);
  }, [state]);

  const onDocument = useCallback((ready) => {
    setSnapshot(null);
    setNotice("");
    setEngineStatus(ready ? "loading" : "missing");
  }, []);

  return {
    frame, state, snapshot: state ? snapshot : null, status: state ? engineStatus : access, notice, setNotice, onDocument,
    act(command) {
      const game = runningGame(frame);
      if (command !== "pause" || !game) return;
      game.togglePause();
      setSnapshot(snapshotFor(frame));
    },
    save: () => runningGame(frame)?.saveUI(),
    openOptions() {
      const game = runningGame(frame);
      if (game) frame.current.contentDocument.getElementById("options-link").click();
    },
    openConnection() {
      frame.current?.contentDocument?.querySelector(".kgnet-login-link-container")?.click();
    },
  };
}
