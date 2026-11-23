import React, { useId } from "react";
import { Icon } from "./Icon.jsx";
import { residentSpecies } from "./resident-species.js";

export function ResidentSpeciesPicker({ species, onChange }) {
  const id = useId();

  return (
    <div className="species-picker">
      <button className="wordmark" type="button" popoverTarget={id}
        title={`Habitants du village · ${residentSpecies[species].fr[1]}`}>
        <span className="brand-icon"><Icon name="brand" /></span>AGLLM
        <span className="wordmark-chevron"><Icon name="down" /></span>
      </button>
      <section id={id} className="species-popover" popover="auto" aria-label="Habitants du village">
        <fieldset>
          <legend>Habitants du village</legend>
          {Object.entries(residentSpecies).map(([key, entry]) => (
            <label key={key} className="species-option">
              <input type="radio" name="resident-species" value={key} checked={key === species}
                onChange={() => onChange(key)} />
              <Icon name={entry.icon} />
              <span><strong>{entry.fr[0]}</strong><small>{entry.gait}</small></span>
            </label>
          ))}
        </fieldset>
      </section>
    </div>
  );
}
