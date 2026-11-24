import React, { useEffect, useId, useRef, useState } from "react";
import { Icon } from "./Icon.jsx";
import { residentSpecies } from "./resident-species.js";

const descriptions = {
  cat: "Un félin à la démarche souple, reconnaissable à son pelage tigré, ses moustaches et sa longue queue.",
  dog: "Un coureur à quatre pattes. Ses oreilles tombantes et sa queue mobile accompagnent son trot.",
  rabbit: "Ses longues oreilles se redressent lorsqu’il regarde autour de lui. Il se déplace par bonds.",
  raptor: "Un petit dinosaure à plumes qui court sur deux pattes et utilise sa longue queue pour s’équilibrer.",
  drake: "Un dragon aux écailles bleues, dont les ailes membraneuses se déploient en vol puis se replient au repos.",
};

function ResidentPreview({ species }) {
  const canvas = useRef(null);
  const animation = useRef("idle");
  const orbit = useRef({ yaw: 0.7, pitch: 0.22 });
  const drag = useRef(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    const element = canvas.current;
    let preview;
    let disposed = false;
    let frame;
    const start = performance.now();
    function draw(now) {
      const density = Math.min(2, devicePixelRatio);
      const width = Math.max(1, Math.round(element.clientWidth * density));
      const height = Math.max(1, Math.round(element.clientHeight * density));
      preview.render(width, height, (now - start) / 1000, animation.current, orbit.current.yaw, orbit.current.pitch);
      frame = requestAnimationFrame(draw);
    }
    import("./world3d/models/fauna/species-preview.js").then(({ createSpeciesPreview }) => {
      if (disposed) return;
      preview = createSpeciesPreview(element);
      preview.show(species);
      frame = requestAnimationFrame(draw);
    }).catch(() => { if (!disposed) setUnavailable(true); });
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      preview?.dispose();
    };
  }, [species]);

  return <div className="species-preview">
    {unavailable ? <p>Aperçu 3D indisponible.</p> : <>
      <canvas ref={canvas} tabIndex={0} aria-label="Modèle 3D. Glissez ou utilisez les flèches pour tourner."
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          drag.current = { x: event.clientX, y: event.clientY };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!drag.current || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
          orbit.current.yaw -= (event.clientX - drag.current.x) * 0.015;
          orbit.current.pitch = Math.max(-0.25, Math.min(0.8, orbit.current.pitch + (event.clientY - drag.current.y) * 0.01));
          drag.current = { x: event.clientX, y: event.clientY };
        }}
        onLostPointerCapture={() => { drag.current = null; }}
        onKeyDown={(event) => {
          const direction = { ArrowLeft: -1, ArrowRight: 1 }[event.key];
          if (!direction) return;
          event.preventDefault();
          event.stopPropagation();
          orbit.current.yaw += direction * 0.18;
        }} />
      <label>Animation
        <select defaultValue="idle" onChange={(event) => { animation.current = event.target.value; }}>
          <option value="idle">Au repos</option>
          <option value="move">{residentSpecies[species].gait}</option>
          <option value="look">Observer les alentours</option>
        </select>
      </label>
    </>}
  </div>;
}

function SpeciesDetails({ species, selected, onClose, onConfirm }) {
  const dialog = useRef(null);
  const title = useId();
  const entry = residentSpecies[species];
  useEffect(() => { dialog.current.showModal(); }, []);

  return <dialog ref={dialog} className="species-details" aria-labelledby={title}
    onCancel={(event) => { event.preventDefault(); onClose(); }}>
    <header>
      <h2 id={title}>{entry.fr[0]}</h2>
      <button type="button" aria-label="Fermer" onClick={onClose}><Icon name="close" /></button>
    </header>
    <ResidentPreview species={species} />
    <p>{descriptions[species]}</p>
    <dl>
      <div><dt>Déplacement</dt><dd>{entry.gait}</dd></div>
      <div><dt>Vitesse de déplacement en 3D</dt><dd>×{entry.speed.toLocaleString("fr-FR")}</dd></div>
    </dl>
    <button className="species-confirm" type="button" disabled={selected} onClick={onConfirm}>
      {selected ? "Habitant déjà sélectionné" : "Valider le changement d’habitant"}
    </button>
  </dialog>;
}

export function ResidentSpeciesPicker({ species, onChange }) {
  const id = useId();
  const [candidate, setCandidate] = useState(null);
  const [portraits, setPortraits] = useState(null);
  const trigger = useRef(null);

  const loadingPortraits = useRef(false);

  async function loadPortraits(event) {
    if (!event.currentTarget.matches(":popover-open") || loadingPortraits.current) return;
    loadingPortraits.current = true;
    const canvas = document.createElement("canvas");
    let preview;
    try {
      const { createSpeciesPreview } = await import("./world3d/models/fauna/species-preview.js");
      preview = createSpeciesPreview(canvas);
      setPortraits(Object.fromEntries(Object.keys(residentSpecies).map((key) => {
        preview.show(key);
        preview.render(160, 128);
        return [key, canvas.toDataURL()];
      })));
    } catch {
      setPortraits({});
    } finally {
      preview?.dispose();
    }
  }

  function closeDetails() {
    setCandidate(null);
    requestAnimationFrame(() => trigger.current?.focus({ preventScroll: true }));
  }

  return (
    <div className="species-picker">
      <button ref={trigger} className="wordmark" type="button" popoverTarget={id} aria-label="AGLLM"
        title={`Habitants du village · ${residentSpecies[species].fr[1]}`}>
        <span className="brand-icon"><Icon name="brand" /></span><span className="brand-label">AGLLM</span>
        <span className="wordmark-chevron"><Icon name="down" /></span>
      </button>
      <section id={id} className="species-popover" popover="auto" aria-label="Habitants du village" onToggle={loadPortraits}>
        <fieldset>
          <legend>Habitants du village</legend>
          {Object.entries(residentSpecies).map(([key, entry]) => (
            <div key={key} className="species-option">
              <input type="radio" aria-label={`Habitant actif · ${entry.fr[0]}`} checked={key === species} disabled />
              <button type="button" aria-haspopup="dialog" onClick={() => setCandidate(key)}>
                {portraits?.[key] ? <img src={portraits[key]} alt="" /> : <Icon name={entry.icon} />}
                <strong>{entry.fr[0]}</strong>
              </button>
            </div>
          ))}
        </fieldset>
      </section>
      {candidate && <SpeciesDetails species={candidate} selected={candidate === species} onClose={closeDetails}
        onConfirm={() => { onChange(candidate); closeDetails(); }} />}
    </div>
  );
}
