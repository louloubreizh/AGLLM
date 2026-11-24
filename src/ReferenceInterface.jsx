import React, { useEffect, useRef, useState } from "react";
import { BuildingInformation } from "./BuildingInformation.jsx";
import { decorateReferenceGame, referenceControlIcons, referenceResourceIcons, referenceTitleFont } from "./reference-presentation.js";
import { installReferenceControls } from "./reference-controls.js";
import { installReferenceOptions } from "./reference-options.js";
import { presentReferenceResidents } from "./reference-residents.js";
import { installSceneInput } from "./world3d/camera/scene-input.js";
import { keepReferenceTooltipsVisible } from "./reference-tooltips.js";
import { Widget } from "./Widget.jsx";
import palette from "./palette.css?raw";
import widgets from "./interface.css?raw";
import layout from "./reference-interface.css?raw";
import options from "./reference-options.css?raw";
import presentation from "./reference-presentation.css?raw";
import sceneInput from "./world3d/camera/scene-input.css?raw";
import accordions from "./reference-accordions.css?raw";
import purchases from "./reference-purchases.css?raw";
import camp from "./camp.css?raw";
import science from "./science.css?raw";
import workshop from "./workshop.css?raw";
import trade from "./trade.css?raw";
import advancedTabs from "./advanced-tabs.css?raw";
import villageUI from "./village-ui.css?raw";
import villageJobs from "./village-jobs.css?raw";
import villageManagement from "./village-management.css?raw";
import villageCensus from "./village-census.css?raw";

const columns = [
  ["leftColumn", "resources", "Ressources", "resources"],
  ["midColumn", "play", "Jeu", "camp"],
  ["rightColumn", "journal", "Journal", "journal"],
];

export function ReferenceInterface({ frame, panel, species, worldEnabled, cameraView, onInspect, onInspectResident, onSelect, onHover, onExit, onDocument, onNotice }) {
  const [styled, setStyled] = useState(null);
  const [building, setBuilding] = useState(null);
  const residentPresentation = useRef(null);

  function styleFrame(event) {
    setBuilding(null);
    const document = event.currentTarget.contentDocument;
    const container = document?.getElementById("game");
    const elements = columns.map(([id]) => document?.getElementById(id));
    if (!container || elements.some((element) => !element)) {
      setStyled(null);
      onDocument(false);
      return;
    }
    if (!document.getElementById("agllm-reference-layout")) {
      document.documentElement.classList.add("reference-game");
      container.classList.add("game-panels");
      const style = document.createElement("style");
      style.id = "agllm-reference-layout";
      style.textContent = [palette, widgets, layout, presentation, sceneInput, accordions, purchases, camp, science, workshop, trade,
        advancedTabs, villageUI, villageJobs,
        villageManagement, villageCensus, options, referenceControlIcons, referenceResourceIcons, referenceTitleFont].join("\n");
      document.head.append(style);
      for (const [index, [, key, label]] of columns.entries()) {
        const slot = document.createElement("header");
        slot.className = "widget-slot";
        const element = elements[index];
        const content = document.createElement("div");
        content.className = "widget-content";
        content.append(...element.childNodes);
        element.append(slot, content);
        element.classList.add("game-widget", `game-widget-${key}`);
        element.dataset.widget = key;
        element.setAttribute("role", "region");
        element.setAttribute("aria-label", label);
      }
      installReferenceOptions(document);
    }
    container.dataset.panel = panel;
    document.documentElement.toggleAttribute("data-ui-only", !worldEnabled);
    setStyled({ document, container, elements });
    onDocument(true);
  }

  useEffect(() => {
    if (styled) styled.container.dataset.panel = panel;
  }, [styled, panel]);

  useEffect(() => {
    styled?.document.documentElement.toggleAttribute("data-ui-only", !worldEnabled);
  }, [styled, worldEnabled]);

  useEffect(() => {
    if (!styled) return;
    const presentation = presentReferenceResidents(styled.document);
    residentPresentation.current = presentation;
    return () => presentation.dispose();
  }, [styled]);

  useEffect(() => {
    if (styled) residentPresentation.current.update(species);
  }, [styled, species]);

  useEffect(() => {
    if (!styled) return;
    const { document } = styled;
    const view = document.defaultView;
    const removeControls = installReferenceControls(document);
    const removeSceneInput = installSceneInput(document, cameraView, onSelect, onHover, onExit);
    const update = (game) => decorateReferenceGame(document, game, onInspect, setBuilding, {
      inspect: onInspectResident,
      journey: (id) => cameraView.current?.residentJourney(id),
    });
    update(view.gamePage);
    const subscription = view.dojo?.subscribe("ui/update", update);
    const removeTooltipPlacement = keepReferenceTooltipsVisible(document);
    const notices = ["saveTooltip", "autosaveTooltip"].map((id) => document.getElementById(id));
    const observer = new MutationObserver(() => {
      onNotice(notices.find((notice) => Number(notice.style.opacity) > 0.1)?.textContent ?? "");
    });
    for (const notice of notices) observer.observe(notice, { attributes: true, attributeFilter: ["style"] });
    return () => {
      if (subscription) view.dojo?.unsubscribe(subscription);
      observer.disconnect();
      removeTooltipPlacement();
      removeControls();
      removeSceneInput();
    };
  }, [styled, cameraView, onInspect, onInspectResident, onSelect, onHover, onExit, onNotice]);

  return (
    <>
      <iframe ref={frame} className="reference-frame" src={`${import.meta.env.BASE_URL}motorAGLLM/`} title="Moteur AGLLM"
        data-styled={styled ? "" : undefined} onLoad={styleFrame} />
      {styled && columns.map(([id, , label, icon], index) => (
        <Widget key={id} element={styled.elements[index]} label={label} icon={icon} />
      ))}
      {building && <BuildingInformation building={building} species={species} onClose={() => setBuilding(null)} />}
    </>
  );
}
