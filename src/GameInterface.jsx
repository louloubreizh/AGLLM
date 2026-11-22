import React, { useEffect, useState } from "react";
import { Widget } from "./Widget.jsx";
import { BuildingInformation } from "./BuildingInformation.jsx";
import { buildingIconStyles, iconVariables, resourceIconStyles } from "./Icon.jsx";
import { buildingUpgrades } from "./building-icons.js";
import { addBuildingActions } from "./camp-buttons.js";
import { updateGameMenu } from "./game-menu.js";
import { installGameControls } from "./game-controls.js";
import { installGameTooltips } from "./game-tooltips.js";
import { installSceneInput } from "./scene-input.js";
import palette from "./palette.css?raw";
import interfaceStyles from "./interface.css?raw";
import menuStyles from "./game-menu.css?raw";
import campStyles from "./camp.css?raw";

const columns = [["midColumn", "Jeu", "camp"], ["leftColumn", "Ressources", "resources"], ["rightColumn", "Journal", "journal"]];

export function GameInterface({ frame, panel, visible, camera, onInspect, onSaveFeedback }) {
  const [styledDocument, setStyledDocument] = useState(null);
  const [buildingInformation, setBuildingInformation] = useState(null);

  function styleFrame(event) {
    const game = event.currentTarget.contentDocument;
    if (!game?.getElementById("gamePageContainer")) {
      setStyledDocument(null);
      return;
    }
    game.documentElement.classList.add("kgllm-interface");
    game.documentElement.dataset.panel = panel;
    if (!game.getElementById("kgllm-styles")) {
      const author = game.querySelector("#topBar .copyright");
      if (author) {
        game.getElementById("creditsDiv")?.append(author);
      }
      game.getElementById("gamePageContainer").append(game.getElementById("headerLinks"));
      for (const [id] of columns) {
        const slot = game.createElement("div");
        slot.className = "widget-slot";
        game.getElementById(id).prepend(slot);
      }
      const style = game.createElement("style");
      style.id = "kgllm-styles";
      style.textContent = [palette, iconVariables, interfaceStyles, menuStyles, campStyles, resourceIconStyles, buildingIconStyles].join("\n");
      game.head.append(style);
    }
    setStyledDocument(game);
  }

  useEffect(() => {
    if (styledDocument) {
      styledDocument.documentElement.dataset.panel = panel;
      const id = { play: "midColumn", resources: "leftColumn", journal: "rightColumn" }[panel];
      styledDocument.querySelector(".widget-raised")?.classList.remove("widget-raised");
      styledDocument.getElementById(id)?.classList.add("widget-raised");
    }
  }, [styledDocument, panel]);

  useEffect(() => {
    if (!styledDocument) return;
    const removeControls = installGameControls(styledDocument);
    const removeTooltips = installGameTooltips(styledDocument);
    const removeSceneInput = installSceneInput(styledDocument, camera);
    return () => {
      removeControls();
      removeTooltips();
      removeSceneInput();
    };
  }, [styledDocument, camera]);

  useEffect(() => {
    if (!styledDocument) return;
    const view = styledDocument.defaultView;
    const dojo = view.dojo;
    const callbacks = { inspect: onInspect, information: setBuildingInformation };
    function styleGameMenu(game) {
      if (!game) return;
      updateGameMenu(styledDocument, game);
      if (game.ui.activeTabId !== "Bonfire") return;
      for (const [index, button] of game.bldTab.children.entries()) {
        const node = button.domNode;
        if (!node?.isConnected) continue;
        if (node.style.order !== String(index)) node.style.order = String(index);
        const name = button.opts?.building;
        if (!name) {
          const action = ["gather", "refine"][index];
          if (action && node.dataset.campAction !== action) node.dataset.campAction = action;
          continue;
        }
        const icon = button.model?.metadata?.stage > 0 ? buildingUpgrades[name] ?? name : name;
        if (node.dataset.buildingIcon !== icon) {
          node.dataset.buildingIcon = icon;
        }
        addBuildingActions(styledDocument, game, button, callbacks);
      }
    }
    styleGameMenu(view.gamePage);
    const subscription = dojo.subscribe("ui/update", styleGameMenu);
    return () => dojo.unsubscribe(subscription);
  }, [styledDocument, onInspect]);

  useEffect(() => {
    if (!styledDocument) return;
    const notices = ["saveTooltip", "autosaveTooltip"].map((id) => styledDocument.getElementById(id));
    const observer = new MutationObserver(() => {
      const active = notices.find((notice) => Number(notice.style.opacity) > 0.1);
      onSaveFeedback(active?.textContent || "");
    });
    for (const notice of notices) {
      observer.observe(notice, { attributes: true, attributeFilter: ["style"] });
    }
    return () => observer.disconnect();
  }, [styledDocument, onSaveFeedback]);

  return <>
    <iframe
      ref={frame}
      className="game-frame"
      src="/jeu/"
      title="Kittens Game"
      onLoad={styleFrame}
      hidden={!visible || !styledDocument}
    />
    {styledDocument && columns.map(([id, label, icon]) => (
      <Widget key={id} element={styledDocument.getElementById(id)} label={label} icon={icon} />
    ))}
    {buildingInformation && (
      <BuildingInformation building={buildingInformation} onClose={() => setBuildingInformation(null)} />
    )}
  </>;
}
