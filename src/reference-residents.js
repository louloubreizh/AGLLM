import { iconImage } from "./Icon.jsx";
import { residentSpecies, residentText } from "./resident-species.js";

const attributes = ["title", "aria-label", "alt", "placeholder"];
const excluded = "script, style, textarea, .village-resident-name, .village-resident-details-name, .village-government-name";

export function presentReferenceResidents(document) {
  let species = "cat";
  const originals = new WeakMap();
  const { NodeFilter, MutationObserver } = document.defaultView;

  function replace(node, attribute) {
    const element = node.nodeType === 1 ? node : node.parentElement;
    if (!element || element.closest(excluded)) return;
    const value = attribute ? node.getAttribute(attribute) : node.nodeValue;
    if (!value) return;
    const saved = originals.get(node) ?? {};
    const previous = saved[attribute];
    const original = previous?.presented === value ? previous.original : value;
    const presented = residentText(original, species);
    if (original !== presented || previous) {
      saved[attribute] = { original, presented };
      originals.set(node, saved);
    }
    if (value === presented) return;
    if (attribute) node.setAttribute(attribute, presented);
    else node.nodeValue = presented;
  }

  function scan(root) {
    const visit = (node) => {
      if (node.nodeType === 3) replace(node);
      if (node.nodeType === 1) for (const attribute of attributes) replace(node, attribute);
    };
    visit(root);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => node.nodeType === 1 && node.matches(excluded) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
    });
    while (walker.nextNode()) visit(walker.currentNode);
  }

  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === "childList") {
        for (const node of record.addedNodes) scan(node);
      } else {
        replace(record.target, record.attributeName ?? undefined);
      }
    }
    observer.takeRecords();
  });
  observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: attributes });

  return {
    update(nextSpecies) {
      species = nextSpecies;
      const icon = iconImage(residentSpecies[species].icon);
      document.documentElement.style.setProperty("--resident-icon", `url("${icon}")`);
      scan(document.body);
      observer.takeRecords();
    },
    dispose: () => observer.disconnect(),
  };
}
