const descriptions = {
  catnip: "Nourrit les habitants et peut être raffinée en bois.",
  wood: "Sert à construire les premiers bâtiments et à fabriquer des poutres.",
  minerals: "Servent à bâtir et à fabriquer des dalles.",
  coal: "Entre dans la fabrication de l’acier.",
  iron: "Métal utilisé pour les plaques, l’acier et de nombreuses constructions.",
  titanium: "Métal utilisé dans les alliages et les équipements avancés.",
  gold: "Sert aux échanges, à divers bâtiments et à certaines améliorations.",
  oil: "Sert à fabriquer du kérosène et du plastique.",
  uranium: "Combustible des réacteurs et matière première du thorium.",
  unobtainium: "Métal extrait dans l’espace, utilisé pour des projets avancés.",
  antimatter: "Ressource produite dans l’espace pour des constructions de fin de partie.",
  manpower: "Réserve de travail utilisée notamment pour la chasse et les expéditions.",
  science: "Permet de financer les recherches.",
  culture: "Sert à développer le village et à produire des écrits.",
  faith: "S’accumule avant d’être convertie en adoration.",
  kittens: "Population du village disponible pour les différents emplois.",
  zebras: "Habitants qui rejoignent le village dans certaines conditions.",
  starchart: "Cartes du ciel utilisées pour les missions spatiales.",
  temporalFlux: "Réserve d’énergie utilisée pour accélérer la simulation.",
  gflops: "Puissance de calcul accumulée par les centres de données.",
  hashrates: "Capacité de calcul consacrée au minage.",
  furs: "Ressource de luxe obtenue à la chasse et utilisée pour fabriquer du parchemin.",
  ivory: "Ressource de luxe obtenue notamment à la chasse et utilisée dans certains échanges.",
  spice: "Ressource de luxe obtenue notamment par le commerce.",
  unicorns: "Créatures élevées au village ou offertes en sacrifice.",
  alicorn: "Créature rare qui peut être sacrifiée pour obtenir des cristaux temporels.",
  necrocorn: "Créature issue de la corruption des alicornes.",
  tears: "Larmes obtenues par les sacrifices et utilisées pour des constructions religieuses.",
  karma: "Bonus durable qui contribue au bonheur des habitants.",
  paragon: "Ressource de progression entre les parties, utile pour la production et le stockage.",
  burnedParagon: "Parangon converti pour obtenir des bonus durables.",
  timeCrystal: "Permet de briser le temps et de financer des améliorations temporelles.",
  sorrow: "Ressource religieuse obtenue à partir des larmes.",
  relic: "Ressource rare utilisée pour certaines améliorations et certains échanges.",
  void: "Ressource temporelle utilisée pour des constructions et des améliorations avancées.",
  elderBox: "Cadeau saisonnier à ouvrir ou à conserver.",
  wrappingPaper: "Papier cadeau associé aux présents saisonniers.",
  blackcoin: "Monnaie spéculative échangée contre des reliques.",
  bloodstone: "Pierre rare utilisée dans certaines améliorations avancées.",
  tMythril: "Matériau rare utilisé dans la progression avancée.",
  beam: "Pièce de construction fabriquée à partir de bois.",
  slab: "Pièce de construction taillée dans les minéraux.",
  plate: "Pièce métallique fabriquée à partir de fer.",
  steel: "Métal obtenu à partir de fer et de charbon.",
  concrate: "Matériau de construction utilisé pour les ouvrages avancés.",
  gear: "Pièce mécanique utilisée dans les machines.",
  alloy: "Métal composite utilisé dans les constructions avancées.",
  eludium: "Alliage avancé utilisé dans les projets spatiaux et temporels.",
  scaffold: "Structure de soutien utilisée pour construire.",
  ship: "Navire qui facilite certains échanges commerciaux.",
  tanker: "Réservoir qui augmente la capacité de stockage du pétrole.",
  kerosene: "Carburant issu du pétrole utilisé pour les missions spatiales.",
  plastic: "Matériau issu du pétrole utilisé dans les équipements avancés.",
  microchip: "Composant électronique destiné aux équipements avancés.",
  parchment: "Support d’écriture fabriqué à partir de fourrures.",
  manuscript: "Écrit produit avec du parchemin et de la culture.",
  compedium: "Recueil de connaissances fabriqué à partir de manuscrits.",
  blueprint: "Plan technique utilisé dans les recherches et constructions avancées.",
  thorium: "Combustible fabriqué à partir d’uranium.",
  megalith: "Grand bloc de construction utilisé notamment pour les ziggourats.",
  worship: "Adoration accumulée en convertissant la foi.",
  epiphany: "Progression spirituelle obtenue par la conversion de l’adoration.",
  necrocornDeficit: "Quantité de nécrocornes encore nécessaire pour atteindre l’objectif indiqué.",
};

const rowSelector = ".res-row[class*='resource_']";
const compact = new Intl.NumberFormat("fr-FR", { notation: "compact", maximumFractionDigits: 1 });

function resourceKey(row) {
  return [...row.classList].find((item) => item.startsWith("resource_")).slice(9);
}

export function updateResourceAmounts(sidebar, game) {
  if (!game) return;
  const resources = new Map([...game.resPool.resources, ...game.resPool.getPseudoResources()].map((entry) => [entry.name, entry]));
  let engineerConsumption;
  for (const row of sidebar.querySelectorAll(rowSelector)) {
    const resource = resources.get(resourceKey(row));
    if (!resource) continue;
    const amount = row.querySelector(".resAmount, .resource-value");
    const capacity = row.querySelector(".maxRes");
    const production = row.querySelector(".resPerTick");
    const compactCapacity = resource.maxValue ? `/ ${compact.format(resource.maxValue)}` : "";
    if (amount) amount.dataset.compact = compact.format(resource.value);
    if (capacity) capacity.dataset.compact = compactCapacity;
    if (production) production.dataset.compact = production.textContent.replace(/([.,]\d)\d+/u, "$1");
    if (row.classList.contains("craft")) {
      if (amount && resource.maxValue) {
        amount.dataset.capacity = `/ ${game.getDisplayValueExt(resource.maxValue)}`;
        amount.dataset.compact += ` ${compactCapacity}`;
      } else if (amount) {
        delete amount.dataset.capacity;
      }
      engineerConsumption ??= game.workshop.getConsumptionEngineers();
      const rate = game.getResourcePerTick(resource.name, false) + game.getResourcePerTickConvertion(resource.name)
        + game.workshop.getEffectEngineer(resource.name, true) + (engineerConsumption[resource.name] || 0);
      const perSecond = game.opts.usePerSecondValues;
      const value = perSecond ? rate * game.getTicksPerSecondUI() : rate;
      const suffix = perSecond ? `/${sidebar.ownerDocument.defaultView.$I("unit.s")}` : "";
      row.dataset.production = game.calendar.day < 0 ? "???" : `${game.getDisplayValueExt(value, true, false)}${suffix}`;
      row.dataset.compactProduction = game.calendar.day < 0 ? "???" : `${value > 0 ? "+" : ""}${compact.format(value)}${suffix}`;
    }
  }
}

export function installResourceDescriptions(sidebar) {
  const document = sidebar.ownerDocument;
  const view = document.defaultView;
  const parentDocument = view.parent.document;
  const tooltip = document.createElement("div");
  const title = document.createElement("strong");
  const description = document.createElement("span");
  const stock = document.createElement("p");
  const production = document.createElement("div");
  production.className = "resource-production";
  tooltip.id = "agllm-resource-description";
  tooltip.className = "reference-resource-description";
  tooltip.popover = "manual";
  tooltip.setAttribute("role", "tooltip");
  tooltip.append(title, description, stock, production);
  document.body.append(tooltip);
  let active;
  let label;

  function hide() {
    label?.removeAttribute("aria-describedby");
    label = null;
    active = null;
    if (tooltip.matches(":popover-open")) tooltip.hidePopover();
  }

  function show(event) {
    const row = event.target.closest(rowSelector);
    if (!row || row === active) return;
    const name = row.querySelector(".resource-name");
    if (!name) return;
    hide();
    active = row;
    label = name;
    const key = resourceKey(row);
    title.textContent = name.textContent.trim();
    description.textContent = descriptions[key] ?? "Ressource suivie par le village. Le stock et ses variations sont indiqués sur cette ligne.";
    const amountCell = row.querySelector(".resAmount, .resource-value");
    const amount = amountCell?.textContent.trim();
    const capacity = row.querySelector(".maxRes")?.textContent.trim().replace(/^\//, " / ")
      ?? (amountCell?.dataset.capacity ? ` ${amountCell.dataset.capacity}` : "");
    stock.textContent = amount ? `Stock ${amount}${capacity ?? ""}` : "";
    const game = view.gamePage;
    const resource = [...game.resPool.resources, ...game.resPool.getPseudoResources()].find(({ name }) => name === key);
    const variation = row.querySelector(".resPerTick")?.textContent.trim() || row.dataset.production;
    const { workshop } = game;
    const hasProduction = resource && (game.getResourcePerTick(key, false) || game.getResourcePerTickConvertion(key)
      || workshop.getEffectEngineer(key) || game.getResourcePerDay(key) || game.getResourceOnYearProduction(key)
      || key === "antimatter" || (key === "kittens" && resource.value < resource.maxValue)
      || workshop.getConsumptionEngineers()[key]);
    production.innerHTML = hasProduction && variation !== "???" ? game.getDetailedResMap(resource) : "";
    if (variation) {
      const rate = document.createElement("strong");
      rate.textContent = `Production nette ${variation}`;
      production.prepend(rate);
    }
    label.setAttribute("aria-describedby", tooltip.id);
    tooltip.showPopover();
    const rect = row.getBoundingClientRect();
    const bounds = tooltip.getBoundingClientRect();
    tooltip.style.left = `${Math.max(8, Math.min(rect.left, view.innerWidth - bounds.width - 8))}px`;
    tooltip.style.top = `${rect.bottom + bounds.height + 14 <= view.innerHeight
      ? rect.bottom + 6 : Math.max(8, rect.top - bounds.height - 6)}px`;
  }

  function leave(event) {
    if (active && !active.contains(event.relatedTarget)) hide();
  }

  function escape(event) {
    if (event.key === "Escape") hide();
  }

  function skipNativeProduction(event) {
    if (event.target.closest(".resPerTick, .resource-value")) event.stopPropagation();
  }

  const events = [
    ["pointerover", show], ["pointerout", leave], ["focusin", show], ["focusout", leave],
    ["scroll", hide], ["mouseover", skipNativeProduction],
  ];
  for (const [type, listener] of events) sidebar.addEventListener(type, listener, true);
  document.addEventListener("keydown", escape, true);
  parentDocument.addEventListener("keydown", escape, true);
  view.addEventListener("resize", hide);
  return () => {
    hide();
    tooltip.remove();
    for (const [type, listener] of events) sidebar.removeEventListener(type, listener, true);
    document.removeEventListener("keydown", escape, true);
    parentDocument.removeEventListener("keydown", escape, true);
    view.removeEventListener("resize", hide);
  };
}
