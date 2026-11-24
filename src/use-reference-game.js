import { useCallback, useEffect, useRef, useState } from "react";
import { residentId } from "./resident-identity.js";
import { villageIndicators } from "./village-indicators.js";

const seasons = ["spring", "summer", "autumn", "winter"];
const saveKey = "com.nuclearunicorn.kittengame.savedata";

function progressKey(game) {
  const { calendar, bld, village, resPool, science, workshop } = game;
  return JSON.stringify([
    calendar.year, calendar.season, Math.floor(calendar.day),
    resPool.resources.map(({ value }) => value),
    bld.buildingsData.map(({ val, on, stage }) => [val, on, stage]),
    village.sim.kittens.map(({ job, rank, favorite }) => [job, rank, favorite]),
    science.techs.map(({ researched }) => researched),
    workshop.upgrades.map(({ researched }) => researched),
    game.colorScheme, game.opts,
  ]);
}

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
  const obscured = game.religion.getPact?.("fractured")?.val && game.getFeatureFlag("MAUSOLEUM_PACTS");
  const nameTemplate = obscured ? document.createElement("template") : null;
  return {
    calendarText: document.getElementById("calendarDiv")?.textContent ?? "",
    season: calendar.getCurSeason()?.name ?? seasons[calendar.season],
    weather: calendar.weather,
    paused: Boolean(game.isPaused),
    population: village.getKittens(),
    residents: village.sim.kittens.map((kitten) => {
      if (nameTemplate) nameTemplate.innerHTML = village.getStyledName(kitten);
      const color = obscured ? kitten.fakeColor : kitten.color;
      return { id: residentId(kitten), name: nameTemplate?.content.textContent ?? `${kitten.name} ${kitten.surname}`,
        coat: (color && kitten.colors?.[color + 1]?.color) || undefined };
    }),
    indicators: villageIndicators(game),
    sorrow: resPool.get("sorrow").value,
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
  const [saved, setSaved] = useState(false);
  const lastSave = useRef({ storage: null, progress: null, visibleUntil: 0 });
  const state = access === "granted";

  useEffect(() => {
    const controller = new AbortController();
    const hold = Promise.withResolvers();
    const connection = import.meta.env.DEV || import.meta.env.MODE === "pages"
      ? null
      : new EventSource("/api/session");

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
        const game = runningGame(frame);
        const stored = frame.current.contentWindow.LCstorage?.[saveKey] ?? null;
        const progress = progressKey(game);
        if (stored !== lastSave.current.storage) {
          lastSave.current = { storage: stored, progress: stored ? progress : null, visibleUntil: 0 };
        }
        setSaved(performance.now() < lastSave.current.visibleUntil || progress === lastSave.current.progress);
        setSnapshot(current);
        setEngineStatus("playing");
      }
    }, 350);
    return () => window.clearInterval(timer);
  }, [state]);

  const onDocument = useCallback((ready) => {
    lastSave.current = { storage: null, progress: null, visibleUntil: 0 };
    setSaved(false);
    setSnapshot(null);
    setNotice("");
    setEngineStatus(ready ? "loading" : "missing");
  }, []);

  return {
    frame, state, snapshot: state ? snapshot : null, status: state ? engineStatus : access, notice, setNotice, onDocument,
    saved,
    save() {
      const game = runningGame(frame);
      if (!game || game.isReadOnly() || game.currentSaveIsBroken) return;
      game.saveUI();
      const stored = frame.current.contentWindow.LCstorage?.[saveKey];
      const progress = progressKey(game);
      if (stored && (stored !== lastSave.current.storage || progress === lastSave.current.progress)) {
        lastSave.current = { storage: stored, progress, visibleUntil: performance.now() + 1200 };
        setSaved(true);
      }
    },
    openOptions() {
      const game = runningGame(frame);
      const engineDocument = frame.current?.contentDocument;
      const options = engineDocument?.getElementById("optionsDiv");
      if (game && options?.style.display === "none") {
        const opener = document.activeElement;
        options.parentElement.addEventListener("close", () => opener?.focus(), { once: true });
        engineDocument.getElementById("options-link").click();
      }
    },
  };
}
