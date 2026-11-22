import React, { useEffect, useId, useRef, useState } from "react";
import { Icon } from "./Icon.jsx";

export function GameOptions({ game, onClose }) {
  const dialog = useRef(null);
  const title = useId();
  const [source, setSource] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const element = dialog.current;
    const focus = document.activeElement;
    element.showModal();
    return () => {
      if (element.open) element.close();
      if (focus?.isConnected) focus.focus();
    };
  }, []);

  function download() {
    const file = new Blob([game.exportSave()], { type: "application/json" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = "agllm-partie.json";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function readFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    try {
      if (file.size > 4_500_000) throw new Error("Le fichier de sauvegarde est trop volumineux.");
      setSource(await file.text());
      setError("");
    } catch (problem) {
      setError(problem.message);
    }
  }

  function load(event) {
    event.preventDefault();
    try {
      game.importSave(source);
      onClose();
    } catch (problem) {
      setError(problem.message);
    }
  }

  return (
    <dialog className="game-options" ref={dialog} aria-labelledby={title} onCancel={(event) => { event.preventDefault(); onClose(); }}>
      <button type="button" className="building-info-close" aria-label="Fermer les options" onClick={onClose}><Icon name="close" /></button>
      <h2 id={title}>Options AGLLM</h2>
      <label>
        Vitesse de la partie
        <select value={game.state.speed} onChange={(event) => game.act("speed", Number(event.target.value))}>
          <option value="1">Standard · 1 jour/s</option>
          <option value="2">Rapide · 2 jours/s</option>
        </select>
      </label>
      <section aria-label="Sauvegarde de la partie">
        <h3>Sauvegarde</h3>
        <button type="button" onClick={download}><Icon name="save" />Exporter la partie</button>
        <form onSubmit={load}>
          <label>Fichier de sauvegarde <input type="file" accept=".json,.txt,application/json,text/plain" onChange={readFile} /></label>
          <label>Contenu de la sauvegarde <textarea rows="4" value={source} onChange={(event) => setSource(event.target.value)} /></label>
          {error && <p role="alert">{error}</p>}
          <button type="submit" disabled={!source.trim()}>Remplacer la partie par cette sauvegarde</button>
        </form>
      </section>
    </dialog>
  );
}
