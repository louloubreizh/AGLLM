import React, { useEffect, useState } from "react";
import { NavbarPopover } from "./NavbarPopover.jsx";

const number = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 });
const compact = new Intl.NumberFormat("fr-FR", { notation: "compact", maximumFractionDigits: 1 });
const signed = new Intl.NumberFormat("fr-FR", { signDisplay: "exceptZero", maximumFractionDigits: 2 });

function format(value, unit, formatter = number) {
  return Number.isFinite(value) ? `${formatter.format(value)} ${unit}` : "—";
}

function Statistics({ rows }) {
  return <dl className="navbar-statistics">{rows.map(([name, value]) => (
    <div key={name}><dt>{name}</dt><dd>{value}</dd></div>
  ))}</dl>;
}

function Metric({ title, icon, value, unit, warning, description, forecast, rows, controls }) {
  return (
    <NavbarPopover {...controls} title={title} icon={icon} warning={warning} value={format(value, unit, compact)}>
      {() => <>
        <p className="metric-current">{format(value, unit)}</p>
        <p className="popover-description">{description}</p>
        <p className="metric-forecast"><strong>Prévision</strong> {forecast}</p>
        <Statistics rows={rows} />
      </>}
    </NavbarPopover>
  );
}

export function VillageIndicators({ metrics, controls }) {
  const { happiness, energy, pollution } = metrics;
  const balance = energy.production - energy.consumption;
  const winter = energy.winterProduction - energy.consumption;
  return (
    <div className="village-indicators" role="group" aria-label="Indicateurs du village">
      <Metric controls={controls} title="Bonheur" icon="heart" value={happiness.value} unit="%"
        description="Le bonheur influe sur la production des habitants."
        forecast={happiness.festivalDays > 0
          ? `${format(happiness.afterFestival, "%")} à la fin du festival dans ${format(happiness.festivalDays, "j")}, si les autres facteurs restent stables.`
          : `${format(happiness.value, "%")} si les conditions du village restent stables.`}
        rows={[
          ["Bâtiments", format(happiness.buildings, "pts", signed)],
          ["Environnement", format(happiness.environment, "pts", signed)],
          ["Population", format(happiness.population, "pts", signed)],
          ["Karma", format(happiness.karma, "pts", signed)],
          ["Festival", format(happiness.festival, "pts", signed)],
        ]} />
      <Metric controls={controls} title="Électricité" icon="energy" value={balance} unit="W" warning={balance < 0}
        description="Le solde est la différence entre la production électrique et la consommation du village."
        forecast={`Solde hivernal de ${format(winter, "W", signed)} à consommation constante.`}
        rows={[
          ["Production", format(energy.production, "W")],
          ["Consommation", format(energy.consumption, "W")],
          ["Production en hiver", format(energy.winterProduction, "W")],
        ]} />
      {!pollution.hidden && <Metric controls={controls} title="Pollution" icon="cloud" value={pollution.value} unit="ppm"
        description="Les émissions s’accumulent dans l’environnement. La pollution peut affecter le village et ses habitants."
        forecast={Number.isFinite(pollution.tomorrow)
          ? `${format(pollution.tomorrow, "ppm")} dans un jour de jeu si les émissions restent constantes.`
          : "Projection indisponible pour la concentration actuelle."}
        rows={[
          ["Niveau du moteur", number.format(pollution.level)],
          ["Évolution actuelle", format(pollution.dailyChange, "ppm/j", signed)],
          ["À l’équilibre", pollution.equilibrium === Infinity ? "Sans seuil" : format(pollution.equilibrium, "ppm")],
        ]} />}
    </div>
  );
}

function Information({ snapshot, stateLabel, saveFeedback }) {
  const [fps, setFps] = useState(null);
  useEffect(() => {
    let frames = 0;
    let start;
    let animation;
    function measure(time) {
      start ??= time;
      frames += 1;
      if (time - start >= 800) {
        setFps(Math.round((frames * 1000) / (time - start)));
        start = time;
        frames = 0;
      }
      animation = requestAnimationFrame(measure);
    }
    animation = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(animation);
  }, []);

  return <Statistics rows={[
    ["État", stateLabel],
    ...(snapshot?.calendarText ? [["Calendrier", snapshot.calendarText]] : []),
    ["FPS", fps ?? "—"],
    ...(snapshot ? [["Chagrin", format(snapshot.sorrow, "%")]] : []),
    ...(saveFeedback ? [["Sauvegarde", saveFeedback]] : []),
  ]} />;
}

export function GameInformation({ controls, ...information }) {
  return <NavbarPopover {...controls} icon="info" title="Infos">
    {() => <Information {...information} />}
  </NavbarPopover>;
}
