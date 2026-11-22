import React, { useState } from "react";
import { Icon } from "./Icon.jsx";
import { festival, jobs } from "./game/catalog.js";
import { canPay, canUseJob, housing, promotionCost } from "./game/engine.js";

const portraits = import.meta.glob("../assets/jobs/{farmer,woodcutter,geologist,scholar,miner,engineer}.jpg",
  { eager: true, query: "?url", import: "default" });
const normalize = (value) => value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

function Resident({ resident, state, jobsOpen, act }) {
  const { id, name, species, job, joined, rank, experience, favorite } = resident;
  const leader = state.leader === id;
  const promotion = promotionCost(resident);
  return (
    <details className="resident">
      <summary><span>{name} <small>{species}</small></span><span>{leader ? "Responsable" : jobs[job]?.label ?? "Sans métier"}</span></summary>
      <div className="resident-details">
        <p>Au village depuis {state.day - joined} j. · Expérience {experience} · Rang {rank}</p>
        <label>
          Métier de {name}
          <select value={job ?? ""} onChange={(event) => act("assign", id, event.target.value || null)}>
            <option value="">Sans métier</option>
            {jobsOpen.map(([key, item]) => <option key={key} value={key}>{item.label}</option>)}
          </select>
        </label>
        <div className="resident-actions">
          <button type="button" aria-pressed={favorite} onClick={() => act("favorite", id)}>
            <Icon name="star" />Favori
          </button>
          {state.buildings.hall > 0 && (
            <button type="button" aria-pressed={leader} onClick={() => act("lead", id)}>
              {leader ? "Retirer la responsabilité" : "Nommer responsable"}
            </button>
          )}
          <button type="button" disabled={!promotion || !canPay(state, promotion)} onClick={() => act("promote", id)}>
            {rank === 3 ? "Rang maximal" : promotion ? `Promouvoir · ${promotion.coins} jetons` : "Promouvoir"}
          </button>
        </div>
      </div>
    </details>
  );
}

export function VillagePanel({ state, act }) {
  const [query, setQuery] = useState("");
  const [jobFilter, setJobFilter] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const jobsOpen = Object.entries(jobs).filter(([id]) => canUseJob(state, id));
  const matches = state.residents.filter((entry) =>
    (!favoritesOnly || entry.favorite) && (!jobFilter || (entry.job ?? "none") === jobFilter)
    && normalize(`${entry.name} ${entry.species}`).includes(normalize(query.trim())));
  const assigned = state.residents.filter(({ job }) => job).length;
  const remaining = state.festivalUntil - state.day;
  const festivalCost = `${festival.food} vivres · ${festival.coins} jetons`;
  return (
    <div className="village-panel">
      <p>{state.residents.length} / {housing(state)} habitants · {state.residents.length - assigned} sans métier</p>
      <details className="village-group" open>
        <summary>Métiers</summary>
        <div className="job-cards">
          {jobsOpen.map(([id, item]) => {
            const workers = state.residents.filter(({ job }) => job === id);
            const free = state.residents.find(({ job }) => !job);
            return (
              <article className="job-card" key={id}>
                <img loading="lazy" src={portraits[`../assets/jobs/${item.picture}.jpg`]} alt="" />
                <strong>{item.label}</strong>
                <div className="job-actions">
                  <button type="button" aria-label={`Retirer · ${item.label}`} disabled={!workers.length}
                    onClick={() => act("assign", workers.at(-1).id, null)}><Icon name="minus" /></button>
                  <span>{workers.length}</span>
                  <button type="button" aria-label={`Affecter · ${item.label}`} disabled={!free}
                    onClick={() => act("assign", free.id, id)}><Icon name="plus" /></button>
                </div>
              </article>
            );
          })}
        </div>
      </details>
      <details className="village-group">
        <summary>Recensement</summary>
        <div className="resident-filters">
          <label>Nom ou espèce <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          <label>Métier
            <select value={jobFilter} onChange={(event) => setJobFilter(event.target.value)}>
              <option value="">Tous</option>
              <option value="none">Sans métier</option>
              {jobsOpen.map(([id, item]) => <option key={id} value={id}>{item.label}</option>)}
            </select>
          </label>
          <label className="check"><input type="checkbox" checked={favoritesOnly} onChange={(event) => setFavoritesOnly(event.target.checked)} />Favoris</label>
        </div>
        {matches.length ? matches.map((resident) => <Resident key={resident.id} {...{ resident, state, jobsOpen, act }} />)
          : <p className="resident-empty">Aucun habitant ne correspond à la recherche.</p>}
      </details>
      {state.buildings.market > 0 && (
        <details className="village-group">
          <summary>Fête des rives</summary>
          <div className="resident-details">
            <p>{remaining > 0 ? `La fête se termine dans ${remaining} j.` : "La fête remonte le moral des habitants pendant 20 jours."}</p>
            <button type="button" disabled={remaining > 0 || !canPay(state, festival)} onClick={() => act("festival")}>
              Organiser · {festivalCost}
            </button>
          </div>
        </details>
      )}
    </div>
  );
}
