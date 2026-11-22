import { control, element, setText, villageIcon } from "./village-ui.js";
import { placeTooltip } from "./reference-tooltips.js";

export function createResidentActions(document, game, context, getResident, refresh) {
  const { copy, translate } = context;
  const { village } = game;
  const actions = element(document, "div", "village-resident-actions");
  const buttons = [
    ["star", copy.favorite, (kitten) => { kitten.favorite = !kitten.favorite; }],
    ["flag", translate("village.census.btn.leader"), (kitten) => {
      village.makeLeader(kitten);
      game.render();
      document.querySelector(".village-government .village-resident-open, .village-census-field input")?.focus({ preventScroll: true });
    }],
    ["upgrade", translate("village.census.btn.promote"), (kitten) => village.sim.promote(kitten)],
    ["unassign", translate("village.btn.unassign.job"), (kitten) => {
      village.unassignJob(kitten);
      village.updateResourceProduction();
    }],
  ].map(([icon, label, act]) => {
    const button = control(document, "village-control village-resident-icon-action");
    button.dataset.icon = icon;
    button.addEventListener("click", () => {
      const resident = getResident();
      if (game.isReadOnly() || !village.sim.kittens.includes(resident)) return;
      act(resident);
      if (actions.isConnected) refresh();
    });
    actions.append(button);
    return { button, label };
  });
  const [favorite, leader, promote, unassign] = buttons.map(({ button }) => button);

  return { actions, update(resident, name) {
    actions.hidden = !resident || game.isReadOnly();
    if (actions.hidden) return;
    const anarchy = game.challenges.isActive("anarchy");
    favorite.toggleAttribute("data-active", Boolean(resident.favorite));
    leader.toggleAttribute("data-active", village.leader === resident);
    leader.hidden = promote.hidden = anarchy;
    leader.disabled = village.leader === resident;
    promote.disabled = !village.sim.canPromote(resident);
    unassign.disabled = !resident.job;
    for (const { button, label } of buttons) {
      const action = button === favorite && resident.favorite ? copy.unfavorite : label;
      button.setAttribute("aria-label", `${action} · ${name}`);
      button.title = action;
    }
  } };
}

export function createResidentDetails(document, game, nativeCensus, context) {
  const { copy, number } = context;
  const { village } = game;
  const popover = element(document, "div", "village-popover village-resident-details");
  popover.popover = "auto";
  popover.setAttribute("role", "group");
  const hint = element(document, "div", "village-resident-hint", copy.openProfile);
  hint.popover = "manual";
  hint.id = "agllm-resident-hint";
  hint.setAttribute("role", "tooltip");
  const heading = element(document, "h3", "village-resident-details-name");
  const facts = element(document, "dl", "village-resident-facts");
  const fields = [copy.job, copy.trait, copy.age, copy.rank, copy.experience].map((label) => {
    const item = document.createElement("div");
    const value = document.createElement("dd");
    item.append(element(document, "dt", "", label), value);
    facts.append(item);
    return value;
  });
  const skillSection = element(document, "section", "village-resident-skills");
  const skills = document.createElement("ul");
  skillSection.append(element(document, "h4", "", copy.skills), skills);
  const promotionCost = element(document, "p", "village-resident-promotion-cost");
  popover.append(heading, facts, skillSection, promotionCost);

  let resident;
  let trigger;
  let previousSkills;
  let hintOwner;

  function hideHint() {
    if (!hintOwner) return;
    hint.hidePopover();
    hintOwner = null;
  }

  function showHint(button) {
    if (popover.matches(":popover-open") || hintOwner === button) return;
    hideHint();
    hint.showPopover({ source: button });
    hintOwner = button;
    const { innerWidth: width, innerHeight: height } = document.defaultView;
    const { x, y } = placeTooltip(button.getBoundingClientRect(), hint.getBoundingClientRect(), { width, height });
    hint.style.left = `${x}px`;
    hint.style.top = `${y}px`;
  }

  function close() {
    hideHint();
    if (popover.matches(":popover-open")) popover.hidePopover();
  }

  function update() {
    if (!resident) return;
    const { name, job, trait, age, rank, exp } = context.read(resident);
    setText(heading, name);
    popover.setAttribute("aria-label", `${copy.details} · ${name}`);
    [job, trait, age, rank, exp].forEach((value, i) => setText(fields[i], value));
    const markup = nativeCensus.getSkillInfo(resident);
    if (markup !== previousSkills) {
      const template = document.createElement("template");
      template.innerHTML = markup;
      skills.replaceChildren(...Array.from(template.content.querySelectorAll(".skill"), (skill) => {
        const item = element(document, "li", "", skill.textContent.trim());
        item.title = skill.title;
        return item;
      }));
      skillSection.hidden = !skills.childElementCount;
      previousSkills = markup;
    }

    const anarchy = game.challenges.isActive("anarchy");
    const requiredExp = number.format(Math.floor(village.getRankExp(resident.rank)));
    const requiredGold = number.format(25 * (resident.rank + 1));
    promotionCost.hidden = anarchy;
    setText(promotionCost, `${copy.nextRank} · ${requiredExp} XP · ${requiredGold} ${game.resPool.get("gold").title}`);
  }

  function openButton(kitten, label, className = "village-control") {
    const button = control(document, `${className} village-resident-open`, "", label);
    button.popoverTargetElement = popover;
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-describedby", hint.id);
    button.addEventListener("pointerenter", (event) => { if (event.pointerType !== "touch") showHint(button); });
    button.addEventListener("focus", () => { if (button.matches(":focus-visible")) showHint(button); });
    for (const type of ["pointerleave", "blur"]) {
      button.addEventListener(type, () => { if (hintOwner === button) hideHint(); });
    }
    button.addEventListener("keydown", (event) => { if (event.key === "Escape") hideHint(); });
    button.addEventListener("click", () => {
      hideHint();
      if (trigger !== button) {
        close();
        trigger?.setAttribute("aria-expanded", "false");
      }
      resident = typeof kitten === "function" ? kitten() : kitten;
      trigger = button;
      update();
    });
    return button;
  }

  popover.addEventListener("toggle", () => trigger?.setAttribute("aria-expanded", String(popover.matches(":popover-open"))));

  return {
    popover,
    hint,
    openButton,
    close,
    update() {
      if (hintOwner && !hintOwner.getClientRects().length) hideHint();
      if (!popover.matches(":popover-open")) return;
      if (trigger.getClientRects().length) update();
      else close();
    },
  };
}

export function createGovernment(document, game, context, details, refresh) {
  const { copy, translate, number } = context;
  const card = element(document, "section", "village-government");
  const identity = element(document, "div", "village-government-identity");
  identity.append(villageIcon(document, "star"));
  const words = document.createElement("div");
  words.append(element(document, "h3", "", translate("village.census.lbl.leader")));
  const name = element(document, "p", "village-government-name");
  const stats = element(document, "p", "village-government-stats");
  const bonus = element(document, "p", "village-government-bonus");
  words.append(name, stats, bonus);
  identity.append(words);
  const more = details.openButton(() => game.village.leader, copy.details);
  more.append(villageIcon(document, "info"));
  const toolbar = createResidentActions(document, game, context, () => game.village.leader, refresh);
  const controls = element(document, "div", "village-government-controls");
  controls.append(toolbar.actions, more);
  card.append(identity, controls);

  return { card, update() {
    card.hidden = game.challenges.isActive("anarchy");
    if (card.hidden) return;
    const { leader } = game.village;
    more.hidden = !leader;
    stats.hidden = !leader;
    bonus.hidden = !leader || !leader.rank;
    if (!leader) {
      toolbar.update(null);
      setText(name, translate("village.census.lbl.noLeader"));
      return;
    }
    const data = context.read(leader);
    toolbar.update(leader, data.name);
    setText(name, data.name);
    more.setAttribute("aria-label", `${copy.details} · ${data.name}`);
    const nextRank = game.village.getRankExp(leader.rank);
    const progress = nextRank > leader.exp ? ` (${number.format(Math.floor(100 * leader.exp / nextRank))} %)` : "";
    setText(stats, `${data.trait} · ${copy.rank} ${data.rank} · ${data.exp} XP${progress}`);
    if (data.trait !== "???" && leader.trait.name !== "none") stats.title = translate(`village.bonus.desc.${leader.trait.name}`);
    else stats.removeAttribute("title");
    if (!bonus.hidden) {
      const effect = `${translate("village.job.bonus")} ×${game.village.getLeaderBonus(leader.rank).toFixed(1)}`;
      setText(bonus, leader.job ? `${effect} · ${data.job}` : effect);
    }
  } };
}
