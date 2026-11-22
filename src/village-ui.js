import { iconImage } from "./Icon.jsx";

export function element(document, tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

export function control(document, className, text, label) {
  const node = element(document, "button", className, text);
  node.type = "button";
  if (label) node.setAttribute("aria-label", label);
  return node;
}

export function villageIcon(document, name) {
  const icon = element(document, "img", "village-icon");
  icon.src = iconImage(name);
  icon.alt = "";
  icon.draggable = false;
  return icon;
}

export function setText(node, text) {
  if (node.textContent !== text) node.textContent = text;
}

export function villageLocale(document) {
  return document.defaultView.i18nLang?.getLanguage() || "en";
}

export function textFromMarkup(document, markup) {
  const template = document.createElement("template");
  template.innerHTML = markup ?? "";
  for (const br of template.content.querySelectorAll("br")) br.replaceWith("\n");
  return template.content.textContent.trim();
}
