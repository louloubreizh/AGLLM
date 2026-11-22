import React, { useEffect, useId, useRef } from "react";
import { Icon } from "./Icon.jsx";

export function BuildingInformation({ building, onClose }) {
  const titleId = useId();
  const dialog = useRef(null);

  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => {
      if (element.open) element.close();
      if (building.trigger.isConnected) building.trigger.focus({ preventScroll: true });
    };
  }, [building]);

  return (
    <dialog ref={dialog} className="building-information" aria-labelledby={titleId}
      onCancel={(event) => { event.preventDefault(); onClose(); }}>
      <button className="building-info-close" type="button" onClick={onClose}
        aria-label="Fermer la fiche du bâtiment"><Icon name="close" /></button>
      <img className="building-info-picture" src={building.picture} alt="" />
      <div className="building-info-copy">
        <h2 id={titleId}>{building.name}</h2>
        <p>{building.description}</p>
      </div>
    </dialog>
  );
}
