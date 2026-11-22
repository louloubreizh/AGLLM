export const seasons = ["spring", "summer", "autumn", "winter"];
export const daysPerSeason = 30;
export const dayDuration = 1000;

export const resources = {
  food: { label: "Vivres", icon: "food", capacity: 100, description: "Nourrissent les habitants et ravitaillent les expéditions." },
  timber: { label: "Bois", icon: "wood", capacity: 90, description: "Sert aux premières constructions et à la fabrication de planches." },
  clay: { label: "Argile", icon: "clay", capacity: 80, description: "Récoltée à la main ou par les potiers, elle sert à bâtir et à irriguer les jardins." },
  notes: { label: "Science", icon: "science", capacity: 90, description: "Produite à la maison des cartes, elle permet de financer les recherches." },
  boards: { label: "Planches", icon: "beam", capacity: 60, description: "Fabriquées à l’atelier à partir de bois, elles servent aux constructions." },
  stone: { label: "Pierre", icon: "slab", capacity: 80, description: "Extraite à la carrière, elle sert à construire et à produire du fer." },
  metal: { label: "Fer", icon: "iron", capacity: 60, description: "Produit au four ou à l’atelier, il sert notamment à construire les éoliennes et les filatures." },
  cloth: { label: "Toile", icon: "cloth", capacity: 60, description: "Sert aux expéditions et à la construction du phare des migrations." },
  coins: { label: "Jetons", icon: "token", capacity: 100, description: "Reçus en échangeant au marché, ils servent aux achats, aux fêtes et aux promotions." },
  relics: { label: "Vestiges", icon: "relic", capacity: 30, description: "Rapportés d’expédition, ils servent à étudier la navigation et à bâtir le phare." },
};

export const gathering = { food: 6, timber: 5, clay: 4 };

export const buildings = {
  garden: {
    label: "Jardin nourricier", icon: "field", model: "crop", cost: { timber: 12 },
    description: "Produit des vivres à un rythme qui varie selon la saison.",
  },
  shelter: {
    label: "Abri du sous-bois", icon: "hut", cost: { timber: 18, clay: 6 },
    description: "Offre deux places aux nouveaux habitants.",
  },
  storehouse: {
    label: "Réserve commune", icon: "barn", cost: { timber: 24, clay: 14 },
    description: "Ajoute 60 places à chaque stock.",
  },
  archive: {
    label: "Maison des cartes", icon: "library", model: "hall", cost: { timber: 20, clay: 10 },
    description: "Produit de la science et permet d’affecter des cartographes.",
  },
  studio: {
    label: "Atelier du sentier", icon: "workshop", cost: { timber: 34, clay: 18 }, requires: "craft",
    craftBonusPerExtra: 10, craftBonusMax: 50,
    description: "Ouvre les recettes. Chaque atelier supplémentaire augmente les quantités fabriquées de 10 %, jusqu’à +50 %.",
  },
  pit: {
    label: "Carrière de schiste", icon: "quarry", model: "industry", cost: { boards: 12, timber: 22 }, requires: "masonry",
    description: "Fournit de la pierre et ouvre le métier de carrier.",
  },
  lodge: {
    label: "Maison des voyageurs", icon: "logHouse", cost: { boards: 18, stone: 22 }, requires: "routes",
    description: "Accueille quatre habitants et ouvre les départs en expédition.",
  },
  market: {
    label: "Halle des rives", icon: "tradepost", model: "hall", cost: { boards: 16, stone: 16 }, requires: "routes",
    description: "Permet les échanges avec les villages voisins et la tenue de fêtes.",
  },
  foundry: {
    label: "Four des falaises", icon: "smelter", model: "industry", cost: { stone: 25, clay: 22 }, requires: "kilns",
    description: "Transforme la pierre en fer et rejette de la fumée. Le four peut être mis à l’arrêt.",
    switchable: true,
  },
  windmill: {
    label: "Éolienne des crêtes", icon: "magneto", model: "industry", cost: { boards: 25, metal: 16 }, requires: "power",
    description: "Alimente les bâtiments raccordés. Produit davantage en hiver.",
  },
  mill: {
    label: "Filature du vallon", icon: "factory", model: "industry", cost: { boards: 20, metal: 18 }, requires: "power",
    description: "Utilise deux unités d’énergie pour filer du bois en toile. Ouvre le métier de tisserand.",
    switchable: true,
  },
  wetland: {
    label: "Roselière filtrante", icon: "pasture", model: "crop", cost: { clay: 30, stone: 20 }, requires: "river",
    description: "Réduit la pollution du village à chaque jour.",
  },
  hall: {
    label: "Pavillon des assemblées", icon: "amphitheatre", model: "hall", cost: { boards: 24, stone: 30, cloth: 12 }, requires: "council",
    description: "Augmente le moral et permet de nommer un responsable du village.",
  },
  beacon: {
    label: "Phare des migrations", icon: "observatory", model: "hall", cost: { metal: 35, cloth: 25, relics: 8 }, requires: "navigation",
    description: "Guide les voyageurs pendant la nuit. Le village peut inaugurer le phare dès sa construction.",
    limit: 1,
  },
};

export const research = {
  cultivation: { label: "Semences vivaces", cost: { notes: 12 }, description: "Débloque les jardins irrigués." },
  craft: { label: "Assemblages", cost: { notes: 16, timber: 10 }, description: "Débloque l’atelier et le travail du bois." },
  masonry: { label: "Lecture des strates", after: ["craft"], cost: { notes: 28, clay: 16 }, description: "Débloque la carrière et la taille de pierre." },
  routes: { label: "Cartes des chemins", after: ["masonry"], cost: { notes: 36, boards: 8 }, description: "Ouvre le commerce et les expéditions." },
  kilns: { label: "Cuisson des minerais", after: ["masonry"], cost: { notes: 40, stone: 22 }, description: "Débloque le four et la métallurgie." },
  power: { label: "Voiles et engrenages", after: ["kilns"], cost: { notes: 58, metal: 12 }, description: "Débloque l’énergie éolienne et la filature." },
  automation: { label: "Cadences d’atelier", after: ["power"], cost: { notes: 75, metal: 20 }, description: "Fabrique la recette choisie tous les cinq jours si les matériaux et la place de stockage suffisent." },
  river: { label: "Restauration des berges", after: ["kilns"], cost: { notes: 52, clay: 24 }, description: "Débloque la roselière qui capte la pollution." },
  council: { label: "Veillées du village", after: ["routes"], cost: { notes: 55, coins: 15 }, description: "Débloque le pavillon des assemblées." },
  navigation: { label: "Navigation nocturne", after: ["power", "river", "council"], cost: { notes: 85, relics: 4 }, description: "Débloque le grand phare et la dernière expédition." },
};

export const jobs = {
  forager: { label: "Cueilleur", resource: "food", rate: 0.95, picture: "farmer" },
  forester: { label: "Forestier", resource: "timber", rate: 0.9, picture: "woodcutter" },
  potter: { label: "Potier", resource: "clay", rate: 0.65, picture: "geologist" },
  mapper: { label: "Cartographe", resource: "notes", rate: 0.75, building: "archive", picture: "scholar" },
  mason: { label: "Carrier", resource: "stone", rate: 0.6, building: "pit", picture: "miner" },
  weaver: { label: "Tisserand", resource: "cloth", rate: 0.44, building: "mill", picture: "engineer" },
};

export const recipes = {
  boards: { label: "Scier des planches", cost: { timber: 9 }, output: { boards: 3 } },
  stone: { label: "Tailler la pierre", requires: "masonry", cost: { clay: 9, timber: 3 }, output: { stone: 3 } },
  metal: { label: "Couler le fer", requires: "kilns", cost: { stone: 8, timber: 6 }, output: { metal: 3 } },
  cloth: { label: "Tisser une toile", requires: "power", cost: { timber: 10, metal: 2 }, output: { cloth: 3 } },
};

export const trades = {
  provisions: { label: "Approvisionner le marché", cost: { food: 22 }, output: { coins: 8 } },
  builders: { label: "Fournir les charpentiers", cost: { boards: 6 }, output: { coins: 10 } },
  caravan: { label: "Acheter du schiste", cost: { coins: 8 }, output: { stone: 12 } },
  supplies: { label: "Acheter des outils", cost: { coins: 12 }, output: { metal: 6 } },
};

export const trails = {
  banks: { label: "Les berges du nord", cost: { food: 18 }, output: { relics: 2, coins: 9 }, duration: 12 },
  ridge: { label: "La crête des vents", requires: "power", cost: { food: 35, cloth: 5 }, output: { relics: 5, notes: 18 }, duration: 20 },
  islands: { label: "L’archipel des brumes", requires: "navigation", cost: { food: 55, cloth: 10 }, output: { relics: 9, coins: 30 }, duration: 30 },
};

export const irrigation = { timber: 38, clay: 30 };
export const festival = { food: 25, coins: 8 };
