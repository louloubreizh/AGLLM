import React, { useState } from "react";
import { BuildingInformation } from "./BuildingInformation.jsx";
import { buildingImage, Icon } from "./Icon.jsx";
import { VillagePanel } from "./VillagePanel.jsx";
import { Widget } from "./Widget.jsx";
import { tabArt } from "./tab-art.js";
import { buildings, gathering, irrigation, recipes, research, resources, trades, trails } from "./game/catalog.js";
import { buildingCost, calendar, canPay, canUseRecipe, capacity, dailyRates, hasResearch, hasRoom } from "./game/engine.js";
import "./interface.css";

const metric = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });
const signed = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2, signDisplay: "exceptZero" });
const seasonLabels = { spring: "Printemps", summer: "Été", autumn: "Automne", winter: "Hiver" };

const sections = [
  ["camp", "Campement", "camp"],
  ["village", "Village", "village"],
  ["research", "Recherche", "scienceTab", "archive"],
  ["workshop", "Atelier", "tools", "studio"],
  ["market", "Commerce", "trade", "market"],
  ["trails", "Expéditions", "world", "lodge"],
];

function describeStock(amounts) {
  return Object.entries(amounts).map(([id, amount]) => `${amount} ${resources[id].label.toLowerCase()}`).join(" · ");
}

function GameCard({ title, icon, description, children }) {
  return (
    <article className="game-card">
      <h3>{icon && <Icon name={icon} />}{title}</h3>
      {description && <p>{description}</p>}
      {children}
    </article>
  );
}

function Camp({ state, act, onInspect, onInformation }) {
  return (
    <>
      <div className="gathering-actions" aria-label="Collecte manuelle">
        {Object.entries(gathering).map(([id, amount]) => (
          <button key={id} type="button" disabled={state.stocks[id] >= capacity(state, id)} onClick={() => act("gather", id)}>
            <Icon name={resources[id].icon} />{resources[id].label} +{amount}
          </button>
        ))}
      </div>
      <div className="game-cards">
        {Object.entries(buildings).filter(([, item]) => hasResearch(state, item.requires)).map(([id, item]) => {
          const count = state.buildings[id];
          const cost = buildingCost(state, id);
          const offline = state.disabled.includes(id);
          return (
            <article className="game-card building-card" key={id}>
              <div className="building-card-header">
                <img src={buildingImage(id === "garden" && state.irrigated ? "hydroplant" : item.icon)} alt="" />
                <span aria-label={`${count} ${count === 1 ? "construit" : "construits"}`}>{count}</span>
                <div className="building-card-tools">
                  <button type="button" title="Observer dans le village" aria-label={`Observer ${item.label}`}
                    disabled={!count} onClick={() => onInspect(id, item.label)}><Icon name="eye" /></button>
                  <button type="button" title="Fiche du bâtiment" aria-label={`Fiche · ${item.label}`}
                    onClick={(event) => onInformation({ name: item.label, description: item.description, picture: buildingImage(item.icon), trigger: event.currentTarget })}>
                    <Icon name="info" />
                  </button>
                </div>
              </div>
              <h3>{item.label}</h3>
              <p>{item.description}</p>
              <p className="card-cost">{describeStock(cost)}</p>
              <button type="button" aria-label={`Construire · ${item.label}`}
                disabled={count >= (item.limit ?? 250) || !canPay(state, cost)} onClick={() => act("build", id)}>
                {count >= (item.limit ?? 250) ? "Limite atteinte" : "Construire"}
              </button>
              {item.switchable && count > 0 && (
                <button type="button" aria-pressed={!offline} onClick={() => act("switchBuilding", id)}>
                  {offline ? "Remettre en marche" : "Mettre à l’arrêt"}
                </button>
              )}
              {id === "garden" && count > 0 && hasResearch(state, "cultivation") && (
                <button type="button" disabled={state.irrigated || !canPay(state, irrigation)} onClick={() => act("irrigate")}>
                  {state.irrigated ? "Irrigation en service" : `Irriguer · ${describeStock(irrigation)}`}
                </button>
              )}
              {id === "beacon" && count > 0 && (
                <button type="button" disabled={state.inaugurated} onClick={() => act("inaugurate")}>
                  {state.inaugurated ? "Phare inauguré" : "Inaugurer le phare"}
                </button>
              )}
            </article>
          );
        })}
      </div>
    </>
  );
}

function Research({ state, act }) {
  return (
    <div className="game-cards">
      {Object.entries(research).map(([id, item]) => {
        const complete = hasResearch(state, id);
        const missing = (item.after ?? []).filter((entry) => !hasResearch(state, entry));
        return <GameCard key={id} title={item.label} description={item.description} icon="scienceTab">
          {missing.length > 0 && <p>Requiert {missing.map((entry) => research[entry].label).join(", ")}.</p>}
          <p className="card-cost">{describeStock(item.cost)}</p>
          <button type="button" aria-label={`Étudier · ${item.label}`} disabled={complete || missing.length > 0 || !canPay(state, item.cost)}
            onClick={() => act("research", id)}>{complete ? "Étudié" : "Étudier"}</button>
        </GameCard>;
      })}
    </div>
  );
}

function Exchanges({ state, act, workshop }) {
  const catalog = workshop ? recipes : trades;
  const available = Object.entries(catalog).filter(([id]) => !workshop || canUseRecipe(state, id));
  return (
    <>
      {workshop && hasResearch(state, "automation") && (
        <label className="automation-setting">
          Fabrication automatique tous les cinq jours
          <select value={state.automation ?? ""} onChange={(event) => act("automate", event.target.value || null)}>
            <option value="">Désactivée</option>
            {available.map(([id, item]) => <option key={id} value={id}>{item.label}</option>)}
          </select>
        </label>
      )}
      <div className="game-cards">
        {available.map(([id, item]) => (
          <GameCard key={id} title={item.label} icon={workshop ? "tools" : "trade"}>
            <p className="card-cost">Coût · {describeStock(item.cost)}</p>
            <p>Reçu · {describeStock(item.output)}</p>
            <button type="button" aria-label={item.label}
              disabled={!canPay(state, item.cost) || !hasRoom(state, item.output, item.cost)}
              onClick={() => act(workshop ? "craft" : "trade", id)}>{workshop ? "Fabriquer" : "Échanger"}</button>
          </GameCard>
        ))}
      </div>
    </>
  );
}

function Expeditions({ state, act }) {
  return (
    <>
      {state.expedition && <p className="expedition-status">Retour de l’expédition « {trails[state.expedition.id].label} » dans {state.expedition.returns - state.day} j.</p>}
      <div className="game-cards">
        {Object.entries(trails).filter(([, item]) => hasResearch(state, item.requires)).map(([id, item]) => (
          <GameCard key={id} title={item.label} icon="world" description={`${item.duration} jours · ${describeStock(item.output)} au retour`}>
            <p className="card-cost">{describeStock(item.cost)}</p>
            {state.journeys.includes(id) && <p>Itinéraire parcouru</p>}
            <button type="button" aria-label={`Partir · ${item.label}`} disabled={Boolean(state.expedition) || !canPay(state, item.cost)}
              onClick={() => act("depart", id)}>Partir</button>
          </GameCard>
        ))}
      </div>
    </>
  );
}

function Resources({ state }) {
  const rates = dailyRates(state);
  return (
    <dl className="resource-list">
      {Object.entries(resources).filter(([id]) => Object.hasOwn(gathering, id) || state.stocks[id] > 0 || rates[id] !== 0)
        .map(([id, item]) => (
          <div key={id} className={rates[id] < 0 ? "resource-shortage" : ""}>
            <dt><Icon name={item.icon} />{item.label}</dt>
            <dd><span data-stock={id}>{metric.format(state.stocks[id])}</span> / {capacity(state, id)}
              {Math.abs(rates[id]) >= 0.005 && <small>{signed.format(rates[id])} / j</small>}
            </dd>
          </div>
        ))}
    </dl>
  );
}

function Journal({ events }) {
  return <ol className="journal-list">{events.map(({ day, text }, index) => {
    const date = calendar(day);
    return <li key={events.length - index + day}>
      <small>An {date.year} · {seasonLabels[date.season]}, j. {date.day}</small>
      <p>{text}</p>
    </li>;
  })}</ol>;
}

function GameWidget({ id, label, icon, children }) {
  const [element, setElement] = useState(null);
  return (
    <section ref={setElement} className={`game-widget game-widget-${id}`} aria-label={label} data-widget={id}>
      <div className="widget-slot" />
      {element && <Widget element={element} label={label} icon={icon} />}
      <div className="widget-content">{children}</div>
    </section>
  );
}

export function GameInterface({ state, act, panel, visible, onInspect }) {
  const [section, setSection] = useState("camp");
  const [information, setInformation] = useState(null);
  const available = sections.filter(([, , , requirement]) => !requirement || state.buildings[requirement]);
  const active = available.some(([id]) => id === section) ? section : "camp";
  return (
    <div className="game-panels" data-panel={panel} hidden={!visible}>
      <GameWidget id="resources" label="Ressources" icon="resources"><Resources state={state} /></GameWidget>
      <GameWidget id="play" label="Jeu" icon="camp">
        <nav className="game-sections" aria-label="Sections du jeu">
          {available.map(([id, label, icon]) => (
            <button key={id} type="button" onClick={() => setSection(id)} aria-pressed={id === active}>
              <Icon name={icon} />{label}
            </button>
          ))}
        </nav>
        <img className="section-art" src={tabArt[active]} alt="" />
        {active === "camp" && <Camp state={state} act={act} onInspect={onInspect} onInformation={setInformation} />}
        {active === "village" && <VillagePanel state={state} act={act} />}
        {active === "research" && <Research state={state} act={act} />}
        {active === "workshop" && <Exchanges state={state} act={act} workshop />}
        {active === "market" && <Exchanges state={state} act={act} />}
        {active === "trails" && <Expeditions state={state} act={act} />}
      </GameWidget>
      <GameWidget id="journal" label="Journal" icon="journal"><Journal events={state.journal} /></GameWidget>
      {information && <BuildingInformation building={information} onClose={() => setInformation(null)} />}
    </div>
  );
}
