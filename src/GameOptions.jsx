import React, { useEffect, useId, useRef, useState } from "react";
import { Icon } from "./Icon.jsx";
import { resources } from "./game/catalog.js";
import { copyStocksToAGLLM, copyStocksToKittensGame, maxTransferFileSize, parseTransferSave } from "./game/stock-transfer.js";

const saveFileTypes = ".json,.txt,application/json,text/plain";
const quantity = new Intl.NumberFormat("fr-FR", { maximumSignificantDigits: 21 });

function downloadSave(content, filename, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function SaveTransfer({ state }) {
  const [parsed, setParsed] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function inspectFile(event) {
    const file = event.target.files[0];
    setParsed(null);
    setError("");
    if (!file) return;
    setBusy(true);
    try {
      if (file.size > maxTransferFileSize) throw new Error("Le fichier de sauvegarde est trop volumineux.");
      const bytes = new Uint8Array(await file.arrayBuffer());
      const encoding = bytes[0] === 0xff && bytes[1] === 0xfe ? "utf-16le"
        : bytes[0] === 0xfe && bytes[1] === 0xff ? "utf-16be" : "utf-8";
      setParsed(parseTransferSave(new TextDecoder(encoding).decode(bytes)));
    } catch (problem) {
      setError(problem.message);
    } finally {
      setBusy(false);
    }
  }

  function transfer(makeCopy, filename, type) {
    setError("");
    try {
      downloadSave(makeCopy(state, parsed), filename, type);
    } catch (problem) {
      setError(problem.message);
    }
  }

  return (
    <details className="save-transfer">
      <summary>Transférer du bois, du fer ou de la science</summary>
      <div>
        <p>Le transfert remplace les quantités indiquées dans une copie de la sauvegarde de destination. Importez ensuite cette copie dans le jeu choisi.</p>
        <label>Export de Kittens Game
          <input type="file" accept={saveFileTypes} disabled={busy} onChange={inspectFile} />
        </label>
        {parsed && (
          <table aria-label="Quantités avant transfert">
            <thead>
              <tr><th scope="col">Stock</th><th scope="col">AGLLM</th><th scope="col">Kittens Game</th></tr>
            </thead>
            <tbody>
              {parsed.stocks.map(({ id, value }) => (
                <tr key={id}><th scope="row">{resources[id].label}</th>
                  <td>{quantity.format(state.stocks[id])}</td><td>{quantity.format(value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <button type="button" disabled={!parsed}
          onClick={() => transfer(copyStocksToAGLLM, "agllm-transfert.json", "application/json")}>
          Copier les stocks vers AGLLM
        </button>
        <button type="button" disabled={!parsed}
          onClick={() => transfer(copyStocksToKittensGame, "kittensgame-transfert.txt", "text/plain")}>
          Copier les stocks vers Kittens Game
        </button>
        {error && <p role="alert">{error}</p>}
      </div>
    </details>
  );
}

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
        <p><a href="/">Jouer à Kittens Game</a></p>
        <button type="button" onClick={() => downloadSave(game.exportSave(), "agllm-partie.json", "application/json")}>
          <Icon name="save" />Exporter la partie
        </button>
        <form onSubmit={load}>
          <label>Fichier de sauvegarde <input type="file" accept={saveFileTypes} onChange={readFile} /></label>
          <label>Contenu de la sauvegarde <textarea rows="4" value={source} onChange={(event) => setSource(event.target.value)} /></label>
          {error && <p role="alert">{error}</p>}
          <button type="submit" disabled={!source.trim()}>Remplacer la partie par cette sauvegarde</button>
        </form>
        <SaveTransfer state={game.state} />
      </section>
    </dialog>
  );
}
