import React, { useEffect, useId, useRef, useState } from "react";
import { Icon } from "./Icon.jsx";

const seasons = { spring: "Printemps", summer: "Été", autumn: "Automne", winter: "Hiver" };
const metric = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 });

function InformationRow({ icon, label, description, warning, children }) {
  const descriptionId = useId();
  return (
    <div className={`information-row ${warning ? "metric-warning" : ""}`} tabIndex={0} aria-describedby={descriptionId}>
      <span className="information-icon"><Icon name={icon} /></span>
      <div>
        <strong>{label}</strong>
        <p>{children}</p>
        <p className="information-description" id={descriptionId}>{description}</p>
      </div>
    </div>
  );
}

export function GameInformation({ snapshot, stateLabel, saveFeedback }) {
  const [open, setOpen] = useState(false);
  const pinned = useRef(false);
  const menu = useRef(null);
  const trigger = useRef(null);
  const popoverId = useId();
  const toolbar = snapshot?.toolbar;
  const energy = toolbar?.energy;

  useEffect(() => {
    if (!open) return;
    function close() {
      pinned.current = false;
      setOpen(false);
    }
    function dismissOutside(event) {
      if (!menu.current.contains(event.target)) close();
    }
    function escape(event) {
      if (event.key !== "Escape") return;
      close();
      if (menu.current.contains(document.activeElement)) trigger.current.focus();
    }
    document.addEventListener("pointerdown", dismissOutside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", dismissOutside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  return (
    <div
      ref={menu}
      className="info-menu"
      onPointerEnter={(event) => { if (event.pointerType === "mouse") setOpen(true); }}
      onPointerLeave={() => { if (!pinned.current) setOpen(false); }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          pinned.current = false;
          setOpen(false);
        }
      }}
    >
      <button
        ref={trigger}
        className="info-button"
        type="button"
        aria-label="Infos"
        aria-expanded={open}
        aria-controls={popoverId}
        onClick={() => {
          pinned.current = !pinned.current;
          setOpen(pinned.current);
        }}
      >
        <Icon name="info" /><span>Infos</span>
      </button>
      <section id={popoverId} className="info-popover" aria-label="Informations de la partie" hidden={!open}>
        {snapshot && (
          <InformationRow icon="calendar" label={seasons[snapshot.season]} description="Saison, année et jour dans la partie.">
            An {metric.format(snapshot.year)} · Jour {metric.format(snapshot.day)}
          </InformationRow>
        )}
        <InformationRow icon={snapshot?.paused ? "pause" : "play"} label="État" description="Indique si la partie est active, en pause ou arrêtée.">
          {stateLabel}
        </InformationRow>
        {toolbar?.happiness != null && (
          <InformationRow icon="heart" label="Moral" description="Le moral influence la production des habitants.">
            {metric.format(toolbar.happiness)} %
          </InformationRow>
        )}
        {energy && (
          <InformationRow
            icon="energy"
            label="Énergie"
            warning={energy.production < energy.consumption}
            description={`Production ${metric.format(energy.production)} · Demande ${metric.format(energy.consumption)} · En hiver ${metric.format(energy.winterProduction)}`}
          >
            {metric.format(energy.production - energy.consumption)} unités
          </InformationRow>
        )}
        {toolbar?.pollutionVisible && (
          <InformationRow icon="cloud" label="Pollution" description="La fumée des fours réduit le moral. Les roselières améliorent la qualité de l’air.">
            {metric.format(toolbar.pollution)} / 500
          </InformationRow>
        )}
        {saveFeedback && <InformationRow icon="check" label="Sauvegarde" description="Notification de sauvegarde du jeu.">{saveFeedback}</InformationRow>}
      </section>
    </div>
  );
}
