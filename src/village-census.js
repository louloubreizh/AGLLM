import { createGovernment, createResidentActions, createResidentDetails } from "./village-resident-details.js";
import { control, element, setText, textFromMarkup, villageIcon, villageLocale } from "./village-ui.js";

const pageSize = 10;
const preferences = new WeakMap();
const mounted = new WeakSet();
const labels = {
  fr: {
    name: "Habitant", job: "Métier", trait: "Trait", age: "Âge", rank: "Rang", experience: "XP", details: "Fiche", actions: "Actions",
    search: "Rechercher par nom", sort: "Tri", byName: "Nom (A–Z)", byAge: "Âge décroissant", byExp: "Rang et expérience",
    reset: "Effacer les filtres", first: "Première page", last: "Dernière page", skills: "Compétences", nextRank: "Prochain rang",
    favorite: "Ajouter aux favoris", unfavorite: "Retirer des favoris", marked: "Favori", directory: "Habitants du village", openProfile: "Voir la fiche",
  },
  en: {
    name: "Resident", job: "Job", trait: "Trait", age: "Age", rank: "Rank", experience: "XP", details: "Profile", actions: "Actions",
    search: "Search by name", sort: "Sort", byName: "Name (A–Z)", byAge: "Oldest first", byExp: "Rank and experience",
    reset: "Clear filters", first: "First page", last: "Last page", skills: "Skills", nextRank: "Next rank",
    favorite: "Add to favorites", unfavorite: "Remove from favorites", marked: "Favorite", directory: "Village residents", openProfile: "View profile",
  },
};

function field(document, input, text, key) {
  const group = element(document, "div", "village-census-field");
  const label = element(document, "label", "");
  label.append(villageIcon(document, { search: "zoomIn", job: "tools", trait: "star", sort: "queue" }[key]), text);
  input.id = `agllm-census-${key}`;
  label.htmlFor = input.id;
  group.append(label, input);
  return group;
}

function syncSelect(select, options, value) {
  const signature = JSON.stringify(options);
  if (select.dataset.options !== signature) {
    select.replaceChildren(...options.map(([id, label]) => new select.ownerDocument.defaultView.Option(label, id)));
    select.dataset.options = signature;
  }
  if (select.value !== value) select.value = value;
  select.toggleAttribute("data-filtered", Boolean(value) && value !== "exp");
}

function createRow(document, game, kitten, context, details, refresh) {
  const { copy, translate } = context;
  const row = document.createElement("tr");
  const identity = element(document, "th", "village-resident-identity");
  identity.scope = "row";
  const person = element(document, "div", "village-resident-person");
  const avatar = element(document, "span", "village-resident-avatar");
  avatar.setAttribute("aria-hidden", "true");
  const name = details.openButton(kitten, copy.details, "village-resident-name");
  const flags = element(document, "span", "village-resident-flags");
  const favorite = villageIcon(document, "star");
  favorite.title = favorite.alt = copy.marked;
  const leader = villageIcon(document, "village");
  leader.title = leader.alt = translate("village.census.lbl.leader");
  flags.append(leader, favorite);
  person.append(avatar, name, flags);
  identity.append(person);

  const jobCell = element(document, "td", "village-resident-job");
  const job = element(document, "span", "village-resident-job-label");
  const compactTrait = element(document, "span", "village-resident-trait-label village-resident-trait-compact");
  jobCell.append(job, compactTrait);
  const trait = element(document, "td", "village-resident-trait");
  const traitLabel = element(document, "span", "village-resident-trait-label");
  trait.append(traitLabel);
  const actions = element(document, "td", "village-resident-menu");
  const toolbar = createResidentActions(document, game, context, () => kitten, refresh);
  actions.append(toolbar.actions);
  row.append(identity, jobCell, trait, actions);

  return { row, kitten, update() {
    const data = context.read(kitten);
    [[name, data.name], [job, data.job], [traitLabel, data.trait], [compactTrait, data.trait]]
      .forEach(([node, value]) => setText(node, value));
    const isLeader = context.village.leader === kitten;
    row.toggleAttribute("data-leader", isLeader);
    leader.hidden = !isLeader;
    favorite.hidden = !kitten.favorite;
    job.toggleAttribute("data-jobless", !kitten.job);
    const color = context.obscured ? kitten.fakeColor : kitten.color;
    const shade = (color && kitten.colors?.[color + 1]?.color) || "#74967e";
    if (avatar.style.getPropertyValue("--resident-color") !== shade) avatar.style.setProperty("--resident-color", shade);
    name.setAttribute("aria-label", `${copy.details} · ${data.name}`);
    toolbar.update(kitten, data.name);
    flags.hidden = !toolbar.actions.hidden;
  } };
}

function createCensus(document, game, panel, nativeCensus, residentView) {
  const language = villageLocale(document);
  const copy = labels[language] ?? labels.en;
  const translate = document.defaultView.$I;
  const number = new Intl.NumberFormat(language);
  const compare = new Intl.Collator(language, { sensitivity: "base", numeric: true }).compare;
  const { village } = game;
  const jobless = translate("village.census.filter.unemployed");
  const state = preferences.get(document) ?? { search: "", job: "", trait: "", sort: "exp", page: 0 };
  preferences.set(document, state);

  const context = { copy, number, translate, village, obscured: false, read, residentView, language };
  const details = createResidentDetails(document, game, nativeCensus, context);
  const government = createGovernment(document, game, context, details, refresh);
  const toolbar = element(document, "div", "village-census-toolbar");
  toolbar.addEventListener("keyup", (event) => event.stopPropagation());
  const search = document.createElement("input");
  search.type = "search";
  search.value = state.search;
  const jobFilter = document.createElement("select");
  const traitFilter = document.createElement("select");
  const sorter = document.createElement("select");
  for (const [input, text, key] of [
    [search, copy.search, "search"], [jobFilter, copy.job, "job"],
    [traitFilter, copy.trait, "trait"], [sorter, copy.sort, "sort"],
  ]) {
    toolbar.append(field(document, input, text, key));
    input.addEventListener(key === "search" ? "input" : "change", () => {
      state[key] = input.value;
      state.page = 0;
      refresh();
    });
  }

  const frame = element(document, "div", "village-census-table-frame");
  const table = element(document, "table", "village-census-table");
  table.createCaption().textContent = copy.directory;
  const headers = table.createTHead().insertRow();
  for (const [key, label] of [["identity", copy.name], ["job", copy.job], ["trait", copy.trait], ["menu", copy.actions]]) {
    const header = element(document, "th", `village-resident-${key}`, label);
    if (key === "job") header.append(element(document, "span", "village-resident-trait-compact", ` / ${copy.trait}`));
    header.scope = "col";
    headers.append(header);
  }
  const body = table.createTBody();
  const empty = element(document, "div", "village-census-empty");
  const emptyMessage = document.createElement("p");
  const reset = control(document, "village-control", copy.reset);
  reset.addEventListener("click", () => {
    Object.assign(state, { search: "", job: "", trait: "", page: 0 });
    search.value = "";
    refresh();
    (search.disabled ? jobFilter : search).focus({ preventScroll: true });
  });
  empty.append(emptyMessage, reset);
  frame.append(table, empty);

  const footer = element(document, "div", "village-census-footer");
  const count = element(document, "output", "village-census-count");
  const page = element(document, "output", "village-census-page");
  const first = control(document, "village-control", "«", copy.first);
  const previous = control(document, "village-control", "‹", translate("village.btn.previous"));
  const next = control(document, "village-control", "›", translate("village.btn.next"));
  const last = control(document, "village-control", "»", copy.last);
  const pager = element(document, "div", "village-census-pager");
  pager.append(first, previous, page, next, last);
  footer.append(count, pager);

  let rows = [];
  let pageCount = 0;
  let nextIndexAt = 0;
  for (const [button, target] of [[first, () => 0], [previous, () => state.page - 1], [next, () => state.page + 1], [last, () => pageCount - 1]]) {
    button.addEventListener("click", () => {
      state.page = target();
      refresh();
    });
  }
  panel.contentDiv.replaceChildren(government.card, toolbar, frame, footer, details.popover, details.hint);

  function read(kitten) {
    return {
      name: context.obscured ? textFromMarkup(document, village.getStyledName(kitten)) : `${kitten.name} ${kitten.surname}`,
      job: (kitten.job && village.getJob(kitten.job)?.title) || jobless,
      trait: context.obscured ? "???" : kitten.trait.title,
      age: context.obscured ? "???" : number.format(kitten.age),
      rank: number.format(kitten.rank),
      exp: game.getDisplayValueExt(kitten.exp),
    };
  }

  function normalize(text) {
    return text.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase(language).trim();
  }

  function reindex() {
    const kittens = village.sim.kittens;
    const obscured = context.obscured;
    const jobs = [["", translate("village.census.filter.all")], ["unemployed", jobless], ...village.jobs.filter((job) => job.unlocked).map((job) => [job.name, job.title])];
    const traits = [["", translate("village.trait.filter.all")], ...village.traits.map((trait) => [trait.name, trait.title])];
    if (!jobs.some(([id]) => id === state.job)) state.job = "";
    if (!traits.some(([id]) => id === state.trait)) state.trait = "";
    const sortOptions = nativeCensus.sortOptions.map(({ name, title }) => [name, name === "exp" ? copy.byExp : title]);
    if (!obscured) sortOptions.push(["name", copy.byName], ["age", copy.byAge]);
    const sort = sortOptions.some(([id]) => id === state.sort) ? state.sort : "exp";
    syncSelect(jobFilter, jobs, state.job);
    syncSelect(traitFilter, traits, obscured ? "" : state.trait);
    syncSelect(sorter, sortOptions, sort);
    search.disabled = traitFilter.disabled = obscured || !kittens.length;
    jobFilter.disabled = sorter.disabled = !kittens.length;
    if (search.value !== (obscured ? "" : state.search)) search.value = obscured ? "" : state.search;

    const query = obscured ? "" : normalize(state.search);
    const trait = obscured ? "" : state.trait;
    const matches = kittens.filter((kitten) => nativeCensus._applyJobFilter(kitten, state.job)
      && nativeCensus._applyTraitFilter(kitten, trait)
      && (!query || normalize(`${kitten.name} ${kitten.surname}`).includes(query)));
    const sortBy = {
      favorite: (a, b) => Number(Boolean(b.favorite)) - Number(Boolean(a.favorite)),
      name: (a, b) => compare(`${a.name} ${a.surname}`, `${b.name} ${b.surname}`),
      age: (a, b) => b.age - a.age,
      color: (a, b) => (a.color || Infinity) - (b.color || Infinity),
      variety: (a, b) => (a.variety || Infinity) - (b.variety || Infinity),
    }[sort];
    matches.sort((a, b) => sortBy?.(a, b) || b.rank - a.rank || b.exp - a.exp);

    pageCount = Math.ceil(matches.length / pageSize);
    state.page = Math.max(0, Math.min(state.page, pageCount - 1));
    const offset = state.page * pageSize;
    const current = matches.slice(offset, offset + pageSize);
    if (rows.length !== current.length || !rows.every(({ kitten }, i) => kitten === current[i])) {
      const before = new Map(rows.map((row) => [row.kitten, row]));
      const focused = body.contains(document.activeElement) ? document.activeElement : null;
      rows = current.map((kitten) => before.get(kitten) ?? createRow(document, game, kitten, context, details, refresh));
      const keep = new Set(rows.map(({ row }) => row));
      for (const row of Array.from(body.rows)) if (!keep.has(row)) row.remove();
      rows.forEach(({ row }, i) => {
        if (body.rows[i] !== row) body.insertBefore(row, body.rows[i] ?? null);
      });
      if (focused && focused !== document.activeElement) (focused.isConnected ? focused : search).focus({ preventScroll: true });
    }
    table.hidden = !current.length;
    empty.hidden = Boolean(current.length);
    if (!empty.hidden) {
      setText(emptyMessage, translate(kittens.length ? "village.census.no.kittens.filtered" : "village.census.no.kittens"));
      reset.hidden = !query && !state.job && !trait;
    }
    footer.hidden = !current.length;
    const firstResult = number.format(offset + 1);
    const range = current.length > 1 ? `${firstResult}–${number.format(offset + current.length)}` : firstResult;
    setText(count, `${range} / ${number.format(matches.length)}`);
    setText(page, translate("village.census.page", [state.page + 1, pageCount]));
    pager.hidden = pageCount < 2;
    first.disabled = previous.disabled = state.page === 0;
    next.disabled = last.disabled = state.page + 1 >= pageCount;
  }

  function update() {
    if (panel.collapsed || !panel.visible) {
      details.close();
      return;
    }
    const now = document.defaultView.performance.now();
    const obscured = Boolean(game.religion.getPact?.("fractured")?.val && game.getFeatureFlag("MAUSOLEUM_PACTS"));
    if (now >= nextIndexAt || obscured !== context.obscured) {
      context.obscured = obscured;
      reindex();
      nextIndexAt = now + 1000;
    }
    government.update();
    for (const row of rows) row.update();
    details.update();
  }

  function refresh() {
    nextIndexAt = 0;
    update();
  }

  panel.toggle.addEventListener("click", refresh);
  panel.toggle.addEventListener("keyup", (event) => { if (event.key === "Enter") refresh(); });
  return { render: refresh, update };
}

export function updateVillageCensus(document, game, residentView) {
  const panel = game.villageTab.censusPanel;
  if (!panel?.visible || !panel.panelDiv?.isConnected || mounted.has(panel)) return;
  panel.panelDiv.classList.add("village-section", "village-census");
  // Use the native panel's render and update lifecycle for the new census view.
  panel.census = createCensus(document, game, panel, panel.census, residentView);
  mounted.add(panel);
  panel.census.render();
}
