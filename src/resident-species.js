export const residentSpecies = Object.freeze({
  cat: { fr: ["Chat", "Chats"], en: ["Cat", "Cats"], icon: "kittens", gait: "Marche souple", speed: 1 },
  dog: { fr: ["Chien", "Chiens"], en: ["Dog", "Dogs"], icon: "residentDog", gait: "Trot", speed: 1.16 },
  rabbit: { fr: ["Lapin", "Lapins"], en: ["Rabbit", "Rabbits"], icon: "residentRabbit", gait: "Bonds", speed: 1.06 },
  raptor: { fr: ["Vélociraptor", "Vélociraptors"], en: ["Velociraptor", "Velociraptors"], icon: "residentRaptor", gait: "Course bipède", speed: 1.12 },
  drake: { fr: ["Dragon bleu", "Dragons bleus"], en: ["Blue dragon", "Blue dragons"], icon: "residentDrake", gait: "Vol battu", speed: 1.08 },
});

const storageKey = "agllm.resident-species";

export function loadResidentSpecies() {
  try {
    const species = localStorage.getItem(storageKey);
    if (Object.hasOwn(residentSpecies, species)) return species;
  } catch {
    // Storage may be disabled in the browser.
  }
  return "cat";
}

export function saveResidentSpecies(species) {
  try {
    localStorage.setItem(storageKey, species);
  } catch {
    // The choice still applies for the current session.
  }
}

// Match resident nouns in the French display and the engine's English fallback.
const residentWords = /\b(?<fixed>herbes?\s+à\s+chats?|Kittens (?:Game|Scientist))\b|\b(?<space>astrochatons?)\b|\b(?<plural>chatons|chats|kittens|cats|félins|felines)\b|\b(?:chaton|chat|kitten|cat|félin|feline)\b/giu;

export function residentText(text, species) {
  const names = residentSpecies[species] ?? residentSpecies.cat;
  const display = text
    .replace(/À deux,? chat va mieux\./gi, "À deux, la vie va mieux.")
    .replace(/en chatonnais\b/gi, `dans la langue des ${names.fr[1].toLowerCase()}`)
    .replace(/\bde la félinité\b/gi, `des ${names.fr[1].toLowerCase()}`)
    .replace(/\bflotte féline\b/gi, "flotte du village")
    .replace(/\bnon félines\b/gi, "d’autres espèces")
    .replace(/\bnon-feline liveforms\b/gi, "life forms from other species")
    .replace(/\bfeline mind\b/gi, `the mind of a ${names.en[0].toLowerCase()}`)
    .replace(/\bkittenhood\b/gi, `life as a ${names.en[0].toLowerCase()}`);
  return display.replace(residentWords, (word, ...matches) => {
    const { fixed, space, plural } = matches.at(-1);
    if (fixed) return word;
    const locale = /^(?:cat|kitten|feline)/i.test(word) ? "en" : "fr";
    const noun = names[locale][plural || /s$/i.test(space ?? "") ? 1 : 0];
    if (space) return `${noun.toLocaleLowerCase("fr")} de l’espace`;
    return word[0] === word[0].toLowerCase() ? noun.toLocaleLowerCase(locale) : noun;
  });
}
