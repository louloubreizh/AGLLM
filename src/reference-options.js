export function installReferenceOptions(document) {
  const view = document.defaultView;
  const get = (id) => document.getElementById(id);
  const options = get("optionsDiv");
  const importing = get("importDiv");
  const exporting = get("exportDiv");
  const app = get("appDiv");

  function element(tag, className, ...content) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    node.append(...content);
    return node;
  }

  function button(text, action, className = "") {
    const node = element("button", className, text);
    node.type = "button";
    node.addEventListener("click", action);
    return node;
  }

  function header(title) {
    return element("header", "options-header", element("h2", "", title));
  }

  function section(title, ...content) {
    return element("section", "options-card", element("h3", "", title), ...content);
  }

  function actions(...content) {
    return element("div", "options-actions", ...content);
  }

  function closeButton(nativeClose, hideNative = true) {
    const close = button("×", () => nativeClose.click(), "options-close");
    close.setAttribute("aria-label", "Fermer");
    if (hideNative) nativeClose.hidden = true;
    return close;
  }

  function mountModal(content, heading, nativeClose) {
    const modal = element("dialog", "reference-options-modal");
    const title = heading.querySelector("h2");
    title.id = `${content.id}-title`;
    modal.setAttribute("aria-labelledby", title.id);
    content.classList.add("reference-options-content");
    content.prepend(heading);
    document.body.append(modal);
    modal.append(content);
    nativeClose.addEventListener("click", (event) => event.preventDefault());
    function sync() {
      const visible = content.style.display !== "none";
      if (visible && !modal.open) modal.showModal();
      if (!visible && modal.open) modal.close();
    }
    new MutationObserver(sync).observe(content, { attributes: true, attributeFilter: ["style"] });
    modal.addEventListener("cancel", (event) => {
      event.preventDefault();
      nativeClose.click();
    });
    modal.addEventListener("click", (event) => {
      if (event.target === modal) nativeClose.click();
    });
    return modal;
  }

  function field(label, control, ...related) {
    return element("div", "options-field", get(label), get(control), ...related);
  }

  function help(label, description) {
    const trigger = element("summary", "", "?");
    trigger.setAttribute("aria-label", `Aide · ${label}`);
    const descriptionNode = element("p", "options-help-text");
    const disclosure = element("details", "options-help", trigger, descriptionNode);
    disclosure.addEventListener("toggle", () => {
      if (!disclosure.open) return;
      const template = document.createElement("template");
      template.innerHTML = description().replace(/<br\s*\/?>/gi, " ");
      descriptionNode.textContent = template.content.textContent;
    });
    return disclosure;
  }

  function styleSwitches(container) {
    let focusedOption;
    container.addEventListener("focusin", (event) => {
      focusedOption = event.target.matches("input[type=checkbox]") ? event.target : null;
    });
    function group() {
      for (const input of container.querySelectorAll(":scope > input[type=checkbox]")) {
        const label = input.nextElementSibling;
        const hint = label.nextElementSibling;
        const separator = hint?.matches("span") ? hint.nextElementSibling : hint;
        const row = element("div", "options-switch-row");
        input.before(row);
        row.append(label, input);
        if (hint?.matches("span")) {
          const name = input.id.slice(0, -1);
          row.append(help(label.textContent.trim(), () => view.gamePage.settings.getSetting(name).tooltip));
          hint.remove();
        }
        separator?.remove();
      }
      if (focusedOption && !focusedOption.isConnected && document.activeElement === document.body) {
        focusedOption = get(focusedOption.id);
        focusedOption?.focus({ preventScroll: true });
      }
    }
    group();
    new MutationObserver(group).observe(container, { childList: true });
    return container;
  }

  const links = document.querySelector("#topBar > .links-block");
  const nativeOptionsLink = get("options-link");
  nativeOptionsLink.hidden = true;
  nativeOptionsLink.addEventListener("click", (event) => event.preventDefault());
  const engineLinks = actions(...links.children);
  const engine = element("details", "options-disclosure", element("summary", "", "Menu du moteur"), engineLinks);
  const normal = styleSwitches(get("booleanOptionsNormal"));
  const extra = styleSwitches(get("booleanOptionsExtra"));
  normal.classList.add("options-switches");
  extra.classList.add("options-switches");
  const preferences = element("div", "options-preferences",
    field("optionLanguage", "languageSelector", get("languageApplyLink")),
    field("optionNotation", "notationSelector"),
    field("optionScheme", "schemeToggle", get("schemeTip"),
      help("Thème", () => view.$I("ui.option.scheme.tip"))));
  const extras = element("details", "options-disclosure",
    element("summary", "", "Réglages avancés"),
    extra,
    field("optionBatchSize", "batchSize"),
    actions(get("addTranslationLink"), get("schemeRelock")));
  const nativeOptionsClose = options.querySelector(".close");
  const optionsHeader = header("Options");
  optionsHeader.append(closeButton(nativeOptionsClose));
  options.replaceChildren(nativeOptionsClose,
    section("Affichage", preferences),
    section("Sauvegardes", actions(get("exportButton"), get("importButton"))),
    section("Préférences de jeu", normal),
    extras,
    engine);
  const optionsModal = mountModal(options, optionsHeader, nativeOptionsClose);
  optionsModal.classList.add("options-main-modal");

  const importText = get("importData");
  const importSubmit = get("doImportButton");
  const importCancel = get("cancelButton");
  const importWarning = get("importWarning");
  importWarning.className = "options-warning";
  const file = element("input", "options-file");
  file.type = "file";
  file.accept = ".txt,text/plain";
  const feedback = element("p", "options-feedback");
  feedback.setAttribute("role", "status");
  const importLabel = get("importFromText");
  importLabel.className = "options-field-heading";
  importText.setAttribute("aria-labelledby", importLabel.id);
  importing.replaceChildren(importWarning,
    element("label", "options-field", "Fichier de sauvegarde AGLLM", file),
    importLabel, importText, feedback, actions(importCancel, importSubmit));
  importSubmit.className = "options-primary";
  const importHeader = header("Importer une sauvegarde");
  importHeader.append(closeButton(importCancel, false));
  mountModal(importing, importHeader, importCancel);

  function validatedSave(text, fromFile = false) {
    const content = text.replace(/\s/g, "");
    const data = JSON.parse(view.gamePage.decompressLZData(content));
    const recognizable = Array.isArray(data?.resources) && Array.isArray(data?.buildings) && data.calendar;
    if (!data || typeof data !== "object" || Array.isArray(data) || (fromFile && !recognizable)) {
      throw new Error("Format de sauvegarde non reconnu.");
    }
    return content;
  }

  get("importButton").addEventListener("click", () => { feedback.textContent = ""; });
  importText.addEventListener("input", () => { feedback.textContent = ""; });
  file.addEventListener("change", async () => {
    const picked = file.files[0];
    if (!picked) return;
    try {
      importText.value = validatedSave(await picked.text(), true);
      feedback.textContent = "Fichier chargé. Confirmez l’import pour remplacer la partie.";
    } catch {
      importText.value = "";
      feedback.textContent = "Ce fichier n’est pas une sauvegarde AGLLM lisible.";
    } finally {
      file.value = "";
    }
  });

  const exportText = get("exportData");
  exportText.readOnly = true;
  exportText.setAttribute("aria-labelledby", "exportToText");
  const copyFeedback = element("p", "options-feedback");
  copyFeedback.setAttribute("role", "status");
  const copy = button("Copier le texte", async () => {
    try {
      await view.navigator.clipboard.writeText(exportText.value);
      copyFeedback.textContent = "Texte copié.";
    } catch {
      exportText.focus();
      exportText.select();
      copyFeedback.textContent = "Texte sélectionné. Utilisez Ctrl+C ou la commande Copier.";
    }
  });
  get("exportButton").addEventListener("click", () => { copyFeedback.textContent = ""; });
  const exportClose = get("closeButton");
  const exportHeader = header("Exporter la sauvegarde");
  exportHeader.append(closeButton(exportClose, false));
  const exportTo = get("exportTo");
  const exportToText = get("exportToText");
  exportTo.className = exportToText.className = "options-field-heading";
  exporting.replaceChildren(exportTo, actions(get("exportToSimpleFile"), get("exportToFullFile"), get("download-link")),
    exportToText, exportText, copyFeedback, actions(copy, exportClose));
  mountModal(exporting, exportHeader, exportClose);

  const appClose = app.querySelector(".close");
  const appHeader = header("Application");
  appHeader.append(closeButton(appClose));
  app.replaceChildren(appClose, get("appText"), actions(get("appAndroid"), get("appIOS")));
  mountModal(app, appHeader, appClose);

  const confirmation = element("dialog", "reference-options-modal options-confirmation");
  const confirmHeading = header("Confirmer");
  const confirmTitle = confirmHeading.querySelector("h2");
  confirmTitle.id = "options-confirm-title";
  const confirmMessage = element("p", "options-confirm-message");
  confirmMessage.id = "options-confirm-message";
  confirmation.setAttribute("aria-labelledby", confirmTitle.id);
  confirmation.setAttribute("aria-describedby", confirmMessage.id);
  let choice;
  const cancel = button("Annuler", () => choice(false));
  cancel.autofocus = true;
  const accept = button("Confirmer", () => choice(true), "options-primary");
  confirmation.append(element("div", "reference-options-content", confirmHeading, confirmMessage, actions(cancel, accept)));
  document.body.append(confirmation);
  confirmation.addEventListener("cancel", (event) => {
    event.preventDefault();
    choice(false);
  });

  function confirmThroughOptions(action, fallbackTitle) {
    const ui = view.gamePage.ui;
    const original = ui.confirm;
    ui.confirm = (title, message, onAccept, onCancel) => {
      confirmTitle.textContent = title || fallbackTitle;
      confirmMessage.textContent = message;
      choice = (accepted) => {
        confirmation.close();
        const next = accepted ? onAccept : onCancel;
        if (next) confirmThroughOptions(() => next.call(view), fallbackTitle);
      };
      confirmation.showModal();
    };
    try {
      action();
    } finally {
      ui.confirm = original;
    }
  }

  importSubmit.onclick = () => {
    const game = view.gamePage;
    if (game.isReadOnly()) return;
    let content;
    try {
      content = validatedSave(importText.value);
    } catch {
      feedback.textContent = "Saisissez une sauvegarde AGLLM lisible.";
      return;
    }
    confirmThroughOptions(() => game.ui.confirm("", view.$I("save.import.confirmation.msg"), () => {
      importSubmit.disabled = true;
      game.saveImportText(content, (error) => {
        importSubmit.disabled = false;
        if (error) {
          feedback.textContent = "La sauvegarde n’a pas pu être importée.";
        } else {
          importing.style.display = "none";
          options.style.display = "none";
        }
      });
    }), "Remplacer la partie");
  };
  for (const [id, action, title] of [["reset-link", "reset", "Réinitialiser la partie"], ["wipe-link", "wipe", "Effacer la partie"]]) {
    get(id).onclick = (event) => {
      event.preventDefault();
      confirmThroughOptions(() => view.gamePage[action](), title);
    };
  }

  document.getElementById("gamePageContainer").append(get("headerLinks"));
  get("footerLinks").remove();
}
