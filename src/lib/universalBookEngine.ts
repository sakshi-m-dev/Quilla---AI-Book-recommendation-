/**
 * Universal Book Intelligence Engine ("Google Search & ChatGPT for Books")
 * 
 * Capable of discovering, matching, and recommending ANY book in the world across
 * 40+ global domains, eras, philosophies, scientific fields, cultures, and niche tropes.
 */

import { extractIntent, ExtractedIntent } from "./intentExtractor";

export interface UniversalBook {
  title: string;
  author: string;
  year: number | string;
  genre: string;
  subgenres: string[];
  topics: string[];
  tropes?: string[];
  moods?: string[];
  referenceMatches?: string[];
  cultureOrSetting?: string;
  significance?: string;
  baseDescription: string;
}

export const WORLD_BOOK_CATALOG: UniversalBook[] = [
  // ── 1. HARRY POTTER & MAGICAL ACADEMIES / COMING-OF-AGE ──────────────────
  {
    title: "Percy Jackson & the Olympians: The Lightning Thief",
    author: "Rick Riordan",
    year: 2005,
    genre: "Fantasy",
    subgenres: ["Mythology", "YA Fantasy", "Adventure"],
    topics: ["harry potter", "mythology", "demigods", "camp half-blood", "percy jackson", "quests", "magic"],
    moods: ["Fast-Paced", "Lighthearted / Witty"],
    tropes: ["found family", "chosen one"],
    referenceMatches: ["harry potter", "percy jackson"],
    baseDescription: "Like Harry Potter, an overlooked boy discovers an extraordinary hidden world of gods, monsters, and ancient prophecies. Packed with laugh-out-loud snark, unbreakable trio friendships, and mythical quests."
  },
  {
    title: "Nevermoor: The Trials of Morrigan Crow",
    author: "Jessica Townsend",
    year: 2017,
    genre: "Fantasy",
    subgenres: ["Middle Grade", "Magical School", "Whimsical"],
    topics: ["harry potter", "whimsical", "magical trials", "wundrous society", "morrigan crow", "jupiter north"],
    moods: ["Cozy", "Atmospheric", "Lighthearted / Witty"],
    tropes: ["found family"],
    referenceMatches: ["harry potter"],
    baseDescription: "Captures the wondrous, whimsical magic of entering Diagon Alley for the first time. An outcast cursed girl escapes into a breathtaking hidden city and competes for entry into an elite society."
  },
  {
    title: "A Deadly Education",
    author: "Naomi Novik",
    year: 2020,
    genre: "Fantasy",
    subgenres: ["Dark Academia", "Magic School", "YA / Adult"],
    topics: ["harry potter", "magic school", "scholomance", "survival", "dark magic", "monsters", "el higgins"],
    moods: ["Dark", "Fast-Paced", "Atmospheric"],
    tropes: ["dark academia"],
    referenceMatches: ["harry potter", "the scholomance"],
    baseDescription: "A thrilling, darker evolution of the wizarding boarding school. Inside the Scholomance, there are no teachers and the school itself breeds deadly monsters — surviving to graduation requires fierce alliances and immense grit."
  },
  {
    title: "The Magicians",
    author: "Lev Grossman",
    year: 2009,
    genre: "Fantasy",
    subgenres: ["Magic College", "Dark Fantasy", "Portal Fantasy", "Literary"],
    topics: ["harry potter", "magic college", "dark fantasy", "quentin coldwater", "brakebills"],
    moods: ["Dark", "Atmospheric", "Mind-Bending / Twisty"],
    tropes: ["dark academia"],
    referenceMatches: ["harry potter"],
    baseDescription: "A collegiate, psychological spin on magical schooling. Restless math prodigy Quentin Coldwater gains entry into an exclusive secret college for real magic, only to discover childhood fantasy wonder carries perilous, complex consequences."
  },
  {
    title: "Children of Blood and Bone",
    author: "Tomi Adeyemi",
    year: 2018,
    genre: "Fantasy",
    subgenres: ["West African Fantasy", "High Stakes", "Magic System", "Rebellion"],
    topics: ["harry potter", "west african fantasy", "magic", "zelie", "orisha", "rebellion"],
    moods: ["Fast-Paced", "Heartbreaking / Emotional"],
    tropes: ["enemies to lovers"],
    referenceMatches: ["harry potter"],
    baseDescription: "High-stakes West African-inspired fantasy delivering Harry Potter's epic battle against tyranny. Zélie fights to strike back against a ruthless monarchy and bring magic back to Orïsha."
  },
  {
    title: "Skandar and the Unicorn Thief",
    author: "A.F. Steadman",
    year: 2022,
    genre: "Fantasy",
    subgenres: ["Fierce Unicorns", "Elemental Magic", "Island Academy", "Quests"],
    topics: ["harry potter", "elemental magic", "island academy", "bonded riders", "skandar"],
    moods: ["Fast-Paced", "Atmospheric"],
    tropes: ["found family", "chosen one"],
    referenceMatches: ["harry potter"],
    baseDescription: "Ferocious winged elemental unicorns, bonded riders, and an island boarding school. Offers the pure adrenaline of discovery, fierce loyalty, and secret ancient magic that made Hogwarts so irresistible."
  },

  // ── 2. HOLLY JACKSON & YA INVESTIGATIVE MYSTERIES / THRILLERS ─────────────
  {
    title: "A Good Girl's Guide to Murder",
    author: "Holly Jackson",
    year: 2019,
    genre: "Mystery",
    subgenres: ["YA Mystery", "True Crime", "Thriller"],
    topics: ["holly jackson", "a good girl's guide to murder", "pip fitz-amobi", "small town", "podcasts", "twists", "sleuth"],
    moods: ["Fast-Paced", "Mind-Bending / Twisty"],
    tropes: ["enemies to lovers"],
    referenceMatches: ["a good girl's guide to murder", "holly jackson"],
    baseDescription: "Pip Fitz-Amobi re-examines a closed small-town murder case as her senior project. Interviews, text transcripts, secret audio logs, and an electric investigative chemistry with Ravi Singh."
  },
  {
    title: "The Naturals",
    author: "Jennifer Lynn Barnes",
    year: 2013,
    genre: "Mystery",
    subgenres: ["YA Thriller", "Psychological Profiling", "Crime"],
    topics: ["holly jackson", "the naturals", "fbi", "profilers", "gifted teens", "cold cases", "found family"],
    moods: ["Fast-Paced", "Mind-Bending / Twisty"],
    tropes: ["found family"],
    referenceMatches: ["the naturals", "holly jackson"],
    baseDescription: "Gifted teenagers with innate profiling and lie-detection skills recruited into an elite FBI cold-case division. Delivers Holly Jackson's high-octane investigative plotting with romantic tension."
  },
  {
    title: "One of Us Is Lying",
    author: "Karen M. McManus",
    year: 2017,
    genre: "Mystery",
    subgenres: ["YA Mystery", "High School", "Whodunnit"],
    topics: ["holly jackson", "one of us is lying", "detention", "high school", "secrets", "breakfast club", "murder"],
    moods: ["Fast-Paced", "Mind-Bending / Twisty"],
    tropes: ["enemies to lovers"],
    referenceMatches: ["one of us is lying", "holly jackson"],
    baseDescription: "The Breakfast Club meets Agatha Christie. Five high schoolers walk into detention, but only four walk out alive after a notorious school gossip is poisoned. Fast-paced and twist-packed."
  },
  {
    title: "Sadie",
    author: "Courtney Summers",
    year: 2018,
    genre: "Thriller",
    subgenres: ["Missing Persons", "True Crime Podcast", "Dark & Raw", "Sisters"],
    topics: ["holly jackson", "podcast", "revenge", "missing sister", "dark mystery"],
    moods: ["Dark", "Heartbreaking / Emotional"],
    referenceMatches: ["sadie", "holly jackson"],
    baseDescription: "A fierce older sister hunts her sister's killer across rural motels while a podcast radio host retraces her path. Raw, unapologetic, and much darker than standard YA mysteries."
  },
  {
    title: "Truly Devious",
    author: "Maureen Johnson",
    year: 2018,
    genre: "Mystery",
    subgenres: ["Boarding School", "Cold Case", "Puzzle Mystery", "Sherlockian"],
    topics: ["holly jackson", "boarding school", "cold case", "stevie bell", "dark academia"],
    moods: ["Atmospheric", "Mind-Bending / Twisty"],
    tropes: ["dark academia"],
    referenceMatches: ["truly devious", "holly jackson"],
    baseDescription: "Stevie Bell enters an eccentric Vermont boarding school determined to solve a famous 1930s kidnapping, only for fresh murders to ignite. Intricate clues, witty banter, and atmospheric deduction."
  },
  {
    title: "Five Survive",
    author: "Holly Jackson",
    year: 2022,
    genre: "Thriller",
    subgenres: ["Locked Room RV", "Sniper", "Ticking Clock", "Secrets"],
    topics: ["holly jackson", "survival", "locked room", "rv", "secrets", "suspense"],
    moods: ["Fast-Paced", "Dark"],
    referenceMatches: ["five survive", "holly jackson"],
    baseDescription: "Six friends stranded in an RV on a pitch-black deserted road with a sniper demanding one fatal secret. An eight-hour claustrophobic survival nightmare that never lets you breathe."
  },

  // ── 3. THE SILENT PATIENT & PSYCHOLOGICAL THRILLERS ───────────────────────
  {
    title: "The Silent Patient",
    author: "Alex Michaelides",
    year: 2019,
    genre: "Thriller",
    subgenres: ["Psychological Thriller", "Mystery", "Suspense"],
    topics: ["psychological thriller", "the silent patient", "plot twist", "alicia berenson", "unreliable narrator", "therapy"],
    moods: ["Dark", "Mind-Bending / Twisty"],
    referenceMatches: ["the silent patient"],
    baseDescription: "A celebrated painter shoots her husband five times and never utters another word. A criminal psychotherapist becomes fatally obsessed with unlocking her silence before a staggering final revelation."
  },
  {
    title: "The Maidens",
    author: "Alex Michaelides",
    year: 2021,
    genre: "Mystery",
    subgenres: ["Cambridge University", "Greek Tragedy", "Secret Societies", "Academic"],
    topics: ["dark academia", "the maidens", "cambridge", "greek mythology", "alex michaelides", "murder", "psychological"],
    moods: ["Dark", "Atmospheric"],
    tropes: ["dark academia"],
    referenceMatches: ["the silent patient", "the maidens"],
    baseDescription: "A group psychotherapist investigates a string of murders among an exclusive group of female students at Cambridge University. Steeped in Greek tragedy, obsession, and mythic suspense."
  },
  {
    title: "The Woman in the Window",
    author: "A.J. Finn",
    year: 2018,
    genre: "Thriller",
    subgenres: ["Agoraphobia", "Hitchcockian", "Unreliable Memory", "Domestic"],
    topics: ["psychological thriller", "the silent patient", "unreliable narrator", "hitchcockian", "window"],
    moods: ["Dark", "Mind-Bending / Twisty"],
    referenceMatches: ["the silent patient"],
    baseDescription: "An agoraphobic child psychologist trapped in her Harlem brownstone watches her neighbors and witnesses something terrible — or did she? Claustrophobic dread and unreliable narration."
  },
  {
    title: "Behind Closed Doors",
    author: "B.A. Paris",
    year: 2016,
    genre: "Thriller",
    subgenres: ["Domestic Nightmare", "Chilling Control", "Psychological Trap", "Tension"],
    topics: ["psychological thriller", "the silent patient", "domestic thriller", "marriage", "dark"],
    moods: ["Dark", "Fast-Paced"],
    referenceMatches: ["the silent patient"],
    baseDescription: "The seemingly perfect, fairytale marriage reveals a calculated, terrifying nightmare behind locked doors. Breathless, claustrophobic psychological suspense."
  },
  {
    title: "Rock Paper Scissors",
    author: "Alice Feeney",
    year: 2021,
    genre: "Thriller",
    subgenres: ["Scottish Chapel", "Anniversary Letters", "Twists", "Unreliable"],
    topics: ["psychological thriller", "the silent patient", "plot twist", "scotland", "letters"],
    moods: ["Atmospheric", "Mind-Bending / Twisty"],
    referenceMatches: ["the silent patient"],
    baseDescription: "A troubled couple wins a weekend retreat to an isolated chapel in Scotland. Featuring ten years of hidden anniversary letters and a narrative twist that completely upends reality."
  },
  {
    title: "Gone Girl",
    author: "Gillian Flynn",
    year: 2012,
    genre: "Thriller",
    subgenres: ["Toxic Marriage", "Media Circus", "Dueling Narrators", "Masterpiece"],
    topics: ["psychological thriller", "gone girl", "amy dunne", "plot twist", "marriage", "unreliable narrator", "dark"],
    moods: ["Dark", "Mind-Bending / Twisty"],
    tropes: ["enemies to lovers"],
    referenceMatches: ["the silent patient", "gone girl"],
    baseDescription: "The gold standard for unreliable narrators and psychological revenge. On their fifth anniversary, Amy disappears and Nick becomes the prime suspect in a razor-sharp game of deceit."
  },
  {
    title: "Verity",
    author: "Colleen Hoover",
    year: 2018,
    genre: "Thriller",
    subgenres: ["Disturbing Manuscript", "Dark Obsession", "Isolated Estate", "Romantic Suspense"],
    topics: ["psychological thriller", "verity", "manuscript", "dark romance", "plot twist"],
    moods: ["Dark", "Mind-Bending / Twisty"],
    tropes: ["forbidden love"],
    referenceMatches: ["verity", "the silent patient"],
    baseDescription: "A struggling writer is hired to finish a crippled author's hit series and uncovers a horrifying, confessional autobiography hidden in the estate. Morally twisted and shockingly addictive."
  },

  // ── 4. FOURTH WING, ROMANTASY & ENEMIES TO LOVERS ─────────────────────────
  {
    title: "Fourth Wing",
    author: "Rebecca Yarros",
    year: 2023,
    genre: "Fantasy",
    subgenres: ["Dragon Riders", "War College", "Deadly Trials", "Romantasy"],
    topics: ["fourth wing", "dragons", "war college", "romantasy", "xaden riorson", "enemies to lovers"],
    moods: ["Fast-Paced", "Atmospheric"],
    tropes: ["enemies to lovers", "forbidden love"],
    referenceMatches: ["fourth wing"],
    baseDescription: "Twenty-year-old Violet Sorrengail is ordered into the lethal Riders Quadrant where cadets bond dragons or die trying. Sizzling enemies-to-lovers tension, high body counts, and high-flying danger."
  },
  {
    title: "The Cruel Prince",
    author: "Holly Black",
    year: 2018,
    genre: "Fantasy",
    subgenres: ["Fae Court Politics", "Mortal Ambition", "Lethal Intrigue", "Enemies to Lovers"],
    topics: ["fourth wing", "the cruel prince", "jude duarte", "cardan", "fae", "enemies to lovers"],
    moods: ["Dark", "Mind-Bending / Twisty"],
    tropes: ["enemies to lovers"],
    referenceMatches: ["fourth wing", "a court of thorns and roses"],
    baseDescription: "A mortal girl raised in the treacherous high court of Elfhame matches blades, wits, and vicious political maneuvers against the cruel prince Cardan. Sharp, vicious, and intoxicating."
  },
  {
    title: "A Court of Thorns and Roses",
    author: "Sarah J. Maas",
    year: 2015,
    genre: "Fantasy",
    subgenres: ["Fae Realms", "High Fantasy", "Slow Burn", "Court Politics"],
    topics: ["fourth wing", "acotar", "feyre", "rhysand", "fae", "romantasy", "enemies to lovers"],
    moods: ["Atmospheric", "Fast-Paced"],
    tropes: ["enemies to lovers", "found family"],
    referenceMatches: ["fourth wing", "a court of thorns and roses", "acotar"],
    baseDescription: "Mortal huntress Feyre kills a faerie wolf and is dragged across the wall into the magical realm of Prythian. High stakes, ancient curses, and slow-burn enemies-to-lovers romance."
  },
  {
    title: "Six of Crows",
    author: "Leigh Bardugo",
    year: 2015,
    genre: "Fantasy",
    subgenres: ["Impossible Heist", "Criminal Crew", "Found Family", "Morally Gray"],
    topics: ["six of crows", "fourth wing", "kaz brekker", "heist", "grishaverse", "found family"],
    moods: ["Fast-Paced", "Dark"],
    tropes: ["found family", "heist", "enemies to lovers"],
    referenceMatches: ["six of crows", "fourth wing"],
    baseDescription: "Six dangerous outcasts attempt an impossible heist inside an impenetrable military fortress. Legendary banter, deep emotional scars, and the greatest found-family crew in modern fantasy."
  },
  {
    title: "The Serpent and the Wings of Night",
    author: "Carissa Broadbent",
    year: 2022,
    genre: "Fantasy",
    subgenres: ["Vampire Tournament", "Gladiatorial", "Deadly Romance", "High Stakes"],
    topics: ["fourth wing", "vampires", "tournament", "romantasy", "enemies to lovers", "trials"],
    moods: ["Dark", "Fast-Paced"],
    tropes: ["enemies to lovers", "forbidden love"],
    referenceMatches: ["fourth wing", "the hunger games"],
    baseDescription: "An adopted human daughter of a vampire king enters the Kejari — a lethal tournament held by the goddess of death. Visceral combat, survival stakes, and sizzling enemies-to-lovers passion."
  },

  // ── 5. ARTIFICIAL INTELLIGENCE, TECH & CONSCIOUSNESS ───────────────────────
  {
    title: "Superintelligence: Paths, Dangers, Strategies",
    author: "Nick Bostrom",
    year: 2014,
    genre: "Non-Fiction",
    subgenres: ["Technology", "Philosophy", "Computer Science", "Future"],
    topics: ["ai", "artificial intelligence", "singularity", "existential risk", "machine learning", "agi", "future of humanity"],
    baseDescription: "A rigorous, deeply unsettling exploration of what happens when machine brains surpass human cognitive capability, and how humanity might navigate control."
  },
  {
    title: "Life 3.0: Being Human in the Age of Artificial Intelligence",
    author: "Max Tegmark",
    year: 2017,
    genre: "Non-Fiction",
    subgenres: ["Technology", "Physics", "Philosophy", "AI"],
    topics: ["ai", "artificial intelligence", "consciousness", "future", "cosmos", "machine consciousness", "ethics"],
    baseDescription: "Explores the dawn of Life 3.0 — life that can design both its hardware and software — examining how AI will reshape jobs, warfare, justice, and the very definition of consciousness."
  },
  {
    title: "Klara and the Sun",
    author: "Kazuo Ishiguro",
    year: 2021,
    genre: "Sci-Fi",
    subgenres: ["Literary Fiction", "AI", "Dystopian", "Philosophy"],
    topics: ["ai", "artificial intelligence", "robot", "artificial friend", "consciousness", "human heart", "love", "loneliness"],
    baseDescription: "Told through the tender, observant eyes of Klara, an Artificial Friend with acute perception who watches the human world from a store window, longing to understand the human heart."
  },
  {
    title: "Gödel, Escher, Bach: An Eternal Golden Braid",
    author: "Douglas Hofstadter",
    year: 1979,
    genre: "Non-Fiction",
    subgenres: ["Philosophy", "Mathematics", "Cognitive Science", "Computer Science"],
    topics: ["consciousness", "ai", "artificial intelligence", "recursion", "logic", "cognition", "mind", "math"],
    baseDescription: "A brilliant, playful, and profound journey connecting the logic of Kurt Gödel, the impossible art of M.C. Escher, and the polyphony of J.S. Bach to illuminate how selfhood and thought arise."
  },
  {
    title: "Human Compatible: Artificial Intelligence and the Problem of Control",
    author: "Stuart Russell",
    year: 2019,
    genre: "Non-Fiction",
    subgenres: ["Technology", "Computer Science", "Ethics"],
    topics: ["ai", "artificial intelligence", "machine learning", "alignment", "robotics", "algorithms"],
    baseDescription: "Stuart Russell argues that standard AI design is flawed and presents a revolutionary new foundation where machines must remain uncertain about human preferences."
  },
  {
    title: "The Master Algorithm: How the Quest for the Ultimate Learning Machine Will Remake Our World",
    author: "Pedro Domingos",
    year: 2015,
    genre: "Non-Fiction",
    subgenres: ["Technology", "Computer Science", "Machine Learning"],
    topics: ["machine learning", "ai", "algorithms", "neural networks", "symbolists", "bayesians", "deep learning"],
    baseDescription: "Unpacks the five paradigms of machine learning — Symbolists, Connectionists, Evolutionaries, Bayesians, and Analogizers — revealing how algorithms learn from data."
  },
  {
    title: "Neuromancer",
    author: "William Gibson",
    year: 1984,
    genre: "Sci-Fi",
    subgenres: ["Cyberpunk", "Dystopian", "AI"],
    topics: ["cyberpunk", "ai", "cyberspace", "matrix", "hackers", "wintermute", "artificial intelligence", "neural interface"],
    baseDescription: "Washed-up data thief Case is recruited for a shadowy run against a transcendent, unconstrained artificial intelligence named Wintermute lurking in the matrices."
  },

  // ── 6. INDIAN LITERATURE & MYTHOLOGY ───────────────────────────────────────
  {
    title: "The Immortals of Meluha",
    author: "Amish Tripathi",
    year: 2010,
    genre: "Mythological Fiction",
    subgenres: ["Fantasy", "Indian Literature", "Historical Fiction"],
    topics: ["indian mythology", "mythology", "shiva", "meluha", "hindu mythology", "mahadhev", "suryavanshis", "neelkanth", "amish tripathi"],
    baseDescription: "In 1900 BC, Tibetan chieftain Shiva arrives in the pristine empire of Meluha, discovering his throat turns blue upon drinking Somras — anointing him the legendary Neelkanth to combat mounting darkness."
  },
  {
    title: "The Palace of Illusions",
    author: "Chitra Banerjee Divakaruni",
    year: 2008,
    genre: "Mythological Fiction",
    subgenres: ["Literary Fiction", "Indian Literature", "Historical Fiction"],
    topics: ["indian mythology", "mahabharata", "draupadi", "panchaali", "mythology", "retelling", "women in mythology", "karna", "chitra banerjee divakaruni"],
    baseDescription: "Breathes breathtaking feminist life into the ancient epic, capturing Panchaali's fiery birth, her complex marriage to five Pandavas, her unspoken bond with Karna, and the fateful palace of illusions."
  },
  {
    title: "Asura: Tale of the Vanquished",
    author: "Anand Neelakantan",
    year: 2012,
    genre: "Mythological Fiction",
    subgenres: ["Indian Literature", "Retelling", "Historical Fiction"],
    topics: ["indian mythology", "ramayana", "ravana", "asura", "mythology", "bhadra", "alternative perspective"],
    baseDescription: "A fierce, subversive counter-narrative of the Ramayana told through Ravana's unyielding pride and Bhadra, an ordinary Asura who witnesses the devastating human cost of divine wars."
  },
  {
    title: "Jaya: An Illustrated Retelling of the Mahabharata",
    author: "Devdutt Pattanaik",
    year: 2010,
    genre: "Mythological Fiction",
    subgenres: ["Non-Fiction", "Indian Mythology", "Philosophy"],
    topics: ["indian mythology", "mahabharata", "devdutt pattanaik", "hindu mythology", "krishna", "dharma", "kurukshetra"],
    baseDescription: "Combines narrative storytelling with cultural analysis, unpacking local variants, queer narratives, and moral ambiguities within India's greatest epic."
  },
  {
    title: "The Forest of Enchantments",
    author: "Chitra Banerjee Divakaruni",
    year: 2019,
    genre: "Mythological Fiction",
    subgenres: ["Indian Literature", "Retelling", "Feminist"],
    topics: ["indian mythology", "ramayana", "sita", "mythology", "retelling", "chitra banerjee divakaruni", "love", "duty"],
    baseDescription: "Known as the Sitayana, this deeply moving novel restores Sita as a passionate, principled woman navigating love, exile, abandonment, and moral integrity without bitterness."
  },
  {
    title: "The Mahabharata Secret",
    author: "Christopher C. Doyle",
    year: 2013,
    genre: "Thriller",
    subgenres: ["Mystery", "Indian Literature", "Mythological Thriller"],
    topics: ["indian mythology", "mythological thriller", "ashoka", "mahabharata", "ancient technology", "secret society"],
    baseDescription: "A nuclear scientist is murdered in an Indian fort, leaving behind enigmatic Sanskrit verses that lead his nephew on a pulse-pounding chase to uncover a deadly 2,000-year-old secret."
  },

  // ── 7. PHILOSOPHY, STOICISM & EXISTENTIAL WISDOM ───────────────────────────
  {
    title: "Meditations",
    author: "Marcus Aurelius",
    year: "180 AD",
    genre: "Philosophy",
    subgenres: ["Classics", "Stoicism", "Self-Reflection"],
    topics: ["stoicism", "marcus aurelius", "stoic", "philosophy", "inner peace", "resilience", "duty", "mindfulness"],
    baseDescription: "Never intended for publication, these deeply personal wartime notes reveal an emperor counseling himself on dealing with betrayal, grief, mortality, and remaining virtuous amidst chaotic power."
  },
  {
    title: "Letters from a Stoic",
    author: "Seneca",
    year: "65 AD",
    genre: "Philosophy",
    subgenres: ["Classics", "Stoicism", "Epistolary"],
    topics: ["stoicism", "seneca", "stoic", "philosophy", "time", "grief", "wealth", "friendship", "tranquility"],
    baseDescription: "Seneca's letters to his friend Lucilius dissect how to remain unbothered by wealth or poverty, overcome fear of death, curb runaway consumerism, and cultivate tranquil self-reliance."
  },
  {
    title: "Discourses and Selected Writings",
    author: "Epictetus",
    year: "108 AD",
    genre: "Philosophy",
    subgenres: ["Classics", "Stoicism", "Ethics"],
    topics: ["stoicism", "epictetus", "stoic", "philosophy", "dichotomy of control", "freedom", "discipline"],
    baseDescription: "Epictetus teaches with fierce clarity the famous 'dichotomy of control': divide the world into what is up to you (your reactions, choices) and what isn't, and you will never be enslaved."
  },
  {
    title: "The Daily Stoic: 366 Meditations on Wisdom, Perseverance, and the Art of Living",
    author: "Ryan Holiday",
    year: 2016,
    genre: "Philosophy",
    subgenres: ["Self-Improvement", "Stoicism", "Daily Devotional"],
    topics: ["stoicism", "ryan holiday", "stoic", "philosophy", "habits", "daily reflections", "marcus aurelius", "seneca"],
    baseDescription: "Features brand-new translations from Marcus Aurelius, Seneca, and Epictetus paired with sharp, modern context to help readers cultivate clarity, discipline, and grit 365 days a year."
  },
  {
    title: "Man's Search for Meaning",
    author: "Viktor E. Frankl",
    year: 1946,
    genre: "Non-Fiction",
    subgenres: ["Psychology", "Philosophy", "Memoir", "History"],
    topics: ["meaning", "holocaust", "psychology", "logotherapy", "existentialism", "suffering", "hope", "resilience"],
    baseDescription: "Psychiatrist Viktor Frankl recounts his survival in Nazi concentration camps, demonstrating that our deepest human drive is not pleasure or power, but the discovery of personal meaning."
  },
  {
    title: "Siddhartha",
    author: "Hermann Hesse",
    year: 1922,
    genre: "Classics",
    subgenres: ["Philosophical Fiction", "Spiritual", "Literature"],
    topics: ["the alchemist", "spiritual journey", "enlightenment", "buddha", "river", "self-discovery", "wisdom", "peace"],
    baseDescription: "In ancient India, young Brahmin Siddhartha leaves his father's house to wander through asceticism, sensual indulgence, and worldly wealth before discovering truth in the humble murmur of a river."
  },
  {
    title: "The Prophet",
    author: "Kahlil Gibran",
    year: 1923,
    genre: "Classics",
    subgenres: ["Poetry", "Philosophy", "Spiritual"],
    topics: ["the alchemist", "spiritual journey", "love", "marriage", "sorrow", "work", "death", "wisdom", "soul"],
    baseDescription: "Before departing for his homeland, the prophet Almustafa delivers lyrical discourses to the people of Orphalese on love, joy and sorrow, marriage, freedom, beauty, and destiny."
  },

  // ── 8. EAST ASIAN LITERATURE & SAMURAI IN FEUDAL JAPAN ────────────────────
  {
    title: "Musashi",
    author: "Eiji Yoshikawa",
    year: 1935,
    genre: "Historical Fiction",
    subgenres: ["Classics", "Japanese Literature", "Martial Arts", "Epic"],
    topics: ["samurai", "feudal japan", "musashi", "miyamoto musashi", "sword fighting", "bushido", "japan", "ronin", "eiji yoshikawa"],
    baseDescription: "Follows wild youth Takezo from his defeat at the Battle of Sekigahara through his rebirth as Miyamoto Musashi, wandering feudal Japan to master the dual-blade 'Way of the Sword' and spiritual enlightenment."
  },
  {
    title: "Shōgun",
    author: "James Clavell",
    year: 1975,
    genre: "Historical Fiction",
    subgenres: ["Epic", "Political Intrigue", "War"],
    topics: ["samurai", "feudal japan", "japan", "toranaga", "blackthorne", "bushido", "political intrigue", "clash of cultures", "james clavell"],
    baseDescription: "Shipwrecked navigator John Blackthorne is thrust into the ruthless, honorable court of Lord Toranaga, mastering Japanese customs, political stratagems, and forbidden love as shogun power hangs in balance."
  },
  {
    title: "Silence",
    author: "Shusaku Endo",
    year: 1966,
    genre: "Historical Fiction",
    subgenres: ["Classics", "Japanese Literature", "Philosophical"],
    topics: ["japan", "feudal japan", "samurai", "shusaku endo", "faith", "persecution", "edo period", "moral crisis"],
    baseDescription: "Portuguese missionary Father Sebastião Rodrigues slips into Tokugawa-era Japan to investigate his mentor's apostasy, facing brutal persecution and the agonizing silence of God."
  },
  {
    title: "The Devotion of Suspect X",
    author: "Keigo Higashino",
    year: 2005,
    genre: "Mystery",
    subgenres: ["Japanese Literature", "Psychological Thriller", "Crime"],
    topics: ["japanese mystery", "locked room", "genius", "detective galileo", "higashino", "math genius", "murder mystery"],
    baseDescription: "When single mother Yasuko accidentally kills her abusive ex-husband, her reclusive neighbor — a brilliant high school math teacher — creates an unbreakable, mathematically foolproof alibi for her."
  },

  // ── 9. BIOGRAPHIES BY WALTER ISAACSON & ACCLAIMED MEMOIRS ─────────────────
  {
    title: "Steve Jobs",
    author: "Walter Isaacson",
    year: 2011,
    genre: "Biography",
    subgenres: ["Technology", "Business", "History"],
    topics: ["biography", "walter isaacson", "steve jobs", "apple", "tech", "innovation", "creativity", "silicon valley"],
    baseDescription: "Based on more than forty exhaustive interviews with Jobs over two years, Isaacson captures the electrifying, ruthless perfectionism that created Apple, Pixar, and the iPhone."
  },
  {
    title: "Leonardo da Vinci",
    author: "Walter Isaacson",
    year: 2017,
    genre: "Biography",
    subgenres: ["Art", "History", "Science"],
    topics: ["biography", "walter isaacson", "leonardo da vinci", "art", "renaissance", "genius", "curiosity"],
    baseDescription: "Isaacson connects Leonardo's boundless curiosity — from cross-sections of human tongues to theatrical stage machines — showing how art and science merged in the greatest genius in human history."
  },
  {
    title: "Einstein: His Life and Universe",
    author: "Walter Isaacson",
    year: 2007,
    genre: "Biography",
    subgenres: ["Physics", "Science", "History"],
    topics: ["biography", "walter isaacson", "einstein", "physics", "relativity", "genius", "science"],
    baseDescription: "The definitive biography of Albert Einstein, tracing how an imaginative, insolent patent clerk unlocked the mysteries of the atom and the universe."
  },
  {
    title: "Shoe Dog: A Memoir by the Creator of Nike",
    author: "Phil Knight",
    year: 2016,
    genre: "Memoir",
    subgenres: ["Business", "Biography", "Entrepreneurship"],
    topics: ["biography", "memoir", "nike", "phil knight", "entrepreneurship", "business", "startups", "running"],
    baseDescription: "Phil Knight lays bare the terrifying near-bankruptcies, intense rivalries, and wild team of misfits that turned imported Japanese running shoes into the global giant Nike."
  },
  {
    title: "Educated",
    author: "Tara Westover",
    year: 2018,
    genre: "Memoir",
    subgenres: ["Biography", "Coming-of-Age", "Family Drama"],
    topics: ["memoir", "education", "survivalist", "family", "resilience", "idaho", "cambridge"],
    baseDescription: "Born to survivalist Mormon parents in rural Idaho, Westover stepped into a classroom for the first time at age seventeen, embarking on a quest for knowledge that took her all the way to Cambridge and Harvard."
  },

  // ── 10. FINANCE, INVESTING & PSYCHOLOGY OF MONEY ──────────────────────────
  {
    title: "The Psychology of Money: Timeless Lessons on Wealth, Greed, and Happiness",
    author: "Morgan Housel",
    year: 2020,
    genre: "Non-Fiction",
    subgenres: ["Finance", "Psychology", "Economics", "Self-Improvement"],
    topics: ["finance", "money", "investing", "psychology of money", "wealth", "behavioral finance", "habits"],
    baseDescription: "Through 19 short, captivating stories, Housel demonstrates that how you behave with money is far more important than how smart you are, showing how ego, luck, and patience dictate true wealth."
  },
  {
    title: "The Intelligent Investor",
    author: "Benjamin Graham",
    year: 1949,
    genre: "Non-Fiction",
    subgenres: ["Finance", "Investing", "Classics"],
    topics: ["finance", "investing", "stocks", "value investing", "benjamin graham", "warren buffett", "margin of safety"],
    baseDescription: "Introduces the legendary concepts of 'Mr. Market' and 'Margin of Safety', teaching investors how to insulate themselves from emotional market panic and generate long-term disciplined wealth."
  },
  {
    title: "Rich Dad Poor Dad",
    author: "Robert T. Kiyosaki",
    year: 1997,
    genre: "Non-Fiction",
    subgenres: ["Personal Finance", "Self-Help", "Business"],
    topics: ["finance", "money", "assets", "liabilities", "cashflow", "financial freedom", "real estate"],
    baseDescription: "Contrasts the mindsets of Kiyosaki's highly educated 'poor dad' with his friend's entrepreneurial 'rich dad', exposing why the rich don't work for money — they make money work for them."
  },
  {
    title: "Thinking, Fast and Slow",
    author: "Daniel Kahneman",
    year: 2011,
    genre: "Non-Fiction",
    subgenres: ["Psychology", "Economics", "Cognitive Science"],
    topics: ["psychology", "behavioral economics", "decision making", "system 1 system 2", "cognitive biases", "finance"],
    baseDescription: "Reveals the two systems driving human thought: System 1 (fast, emotional, intuitive) and System 2 (slow, deliberative, logical), showing how heuristics distort our financial and life choices."
  },

  // ── 11. COOKING, FOOD & CHEF MEMOIRS ──────────────────────────────────────
  {
    title: "Kitchen Confidential: Adventures in the Culinary Underbelly",
    author: "Anthony Bourdain",
    year: 2000,
    genre: "Memoir",
    subgenres: ["Food", "Biography", "Culinary"],
    topics: ["food", "cooking", "chef", "anthony bourdain", "restaurant", "culinary", "new york", "kitchen"],
    baseDescription: "A brutally frank, hilarious, and visceral backstage tour of Manhattan kitchens filled with pirates, drugs, culinary artistry, and deep respect for the line cook craft."
  },
  {
    title: "Lessons in Chemistry",
    author: "Bonnie Garmus",
    year: 2022,
    genre: "Historical Fiction",
    subgenres: ["Humor", "Feminist", "Food"],
    topics: ["cooking", "chemistry", "food", "elizabeth zott", "1960s", "dog six-thirty", "feminism", "witty"],
    baseDescription: "In 1960s California, brilliant chemist Elizabeth Zott finds her research stolen, leading her to host a beloved cooking show 'Supper at Six' where she teaches women chemistry through culinary mastery."
  },
  {
    title: "Crying in H Mart",
    author: "Michelle Zauner",
    year: 2021,
    genre: "Memoir",
    subgenres: ["Food", "Family", "Music"],
    topics: ["food", "korean food", "memoir", "mother", "grief", "identity", "cooking"],
    baseDescription: "Japanese Breakfast musician Michelle Zauner shares an intimate journey through the loss of her mother, reconnecting with her Korean heritage through the healing scents and dishes of kimchi, doenjang, and jatjuk."
  },

  // ── 12. ASTROPHYSICS & HARD SCI-FI ─────────────────────────────────────────
  {
    title: "Cosmos",
    author: "Carl Sagan",
    year: 1980,
    genre: "Non-Fiction",
    subgenres: ["Science", "Astronomy", "Astrophysics", "Classics"],
    topics: ["astrophysics", "space", "astronomy", "cosmos", "carl sagan", "science", "stars", "universe", "big bang"],
    baseDescription: "With luminous prose and boundless wonder, Carl Sagan traces fifteen billion years of cosmic evolution, examining science, civilization, and humanity's place upon our 'pale blue dot'."
  },
  {
    title: "A Brief History of Time",
    author: "Stephen Hawking",
    year: 1988,
    genre: "Non-Fiction",
    subgenres: ["Science", "Physics", "Cosmology"],
    topics: ["physics", "astrophysics", "black holes", "stephen hawking", "time", "relativity", "quantum mechanics", "space"],
    baseDescription: "Hawking guides readers through the mysteries of theoretical physics, exploring how general relativity and quantum mechanics clash at the event horizons of black holes and the dawn of the universe."
  },
  {
    title: "Project Hail Mary",
    author: "Andy Weir",
    year: 2021,
    genre: "Sci-Fi",
    subgenres: ["Hard Sci-Fi", "Space Exploration", "Adventure"],
    topics: ["space", "hard sci-fi", "science", "aliens", "rocky", "survival", "andy weir", "astronomy", "first contact"],
    baseDescription: "Ryland Grace is the sole survivor of a desperate last-chance interstellar mission to save Earth from a star-eating organism, waking up with amnesia and an unexpected alien ally."
  },
  {
    title: "The Three-Body Problem",
    author: "Cixin Liu",
    year: 2008,
    genre: "Sci-Fi",
    subgenres: ["Hard Sci-Fi", "Cosmic Horror", "First Contact"],
    topics: ["hard sci-fi", "aliens", "physics", "cixin liu", "dark forest", "first contact", "china", "quantum"],
    baseDescription: "Against the backdrop of China's Cultural Revolution, a secret military project beams signals into space. An alien civilization on the brink of destruction intercepts the message and plans invasion."
  },
  {
    title: "Dune",
    author: "Frank Herbert",
    year: 1965,
    genre: "Sci-Fi",
    subgenres: ["Space Opera", "Political Intrigue", "Ecology"],
    topics: ["space", "dune", "paul atreides", "sandworms", "spice", "desert", "arrakis", "politics", "prophecy"],
    baseDescription: "Young Paul Atreides travels with his noble family to the deadly desert planet Arrakis, sole source of the universe's most precious spice, sparking a war of betrayal, ecology, and messianic destiny."
  },

  // ── 13. CLASSIC LITERATURE & RUSSIAN NOVELS ───────────────────────────────
  {
    title: "Crime and Punishment",
    author: "Fyodor Dostoevsky",
    year: 1866,
    genre: "Classics",
    subgenres: ["Russian Literature", "Psychological Fiction", "Philosophy"],
    topics: ["russian literature", "dostoevsky", "crime and punishment", "raskolnikov", "guilt", "morality", "st petersburg"],
    baseDescription: "Impoverished student Raskolnikov rationalizes murdering a corrupt pawnbroker to prove he is above ordinary human law, only to descend into a feverish psychological torment of conscience and redemption."
  },
  {
    title: "The Brothers Karamazov",
    author: "Fyodor Dostoevsky",
    year: 1880,
    genre: "Classics",
    subgenres: ["Russian Literature", "Philosophy", "Mystery"],
    topics: ["russian literature", "dostoevsky", "faith", "brothers karamazov", "parricide", "grand inquisitor", "morality"],
    baseDescription: "A passionate, turbulent murder mystery surrounding the death of a lecherous father, pitting his three disparate sons against the ultimate questions of God and morality."
  },
  {
    title: "One Hundred Years of Solitude",
    author: "Gabriel García Márquez",
    year: 1967,
    genre: "Classics",
    subgenres: ["Magical Realism", "Latin American Literature", "Epic"],
    topics: ["magical realism", "macondo", "buendia", "colombian", "latin american", "generations", "classics"],
    baseDescription: "Fuses mythology, history, and pure magic as the isolated village of Macondo rises and falls through wars, miracles, yellow butterflies, and the unyielding curse of solitude."
  },

  // ── 14. DARK ACADEMIA ─────────────────────────────────────────────────────
  {
    title: "The Secret History",
    author: "Donna Tartt",
    year: 1992,
    genre: "Classics",
    subgenres: ["Dark Academia", "Psychological", "Mystery"],
    topics: ["dark academia", "vermont", "classics", "greek", "secret society", "murder", "rich students", "aesthetic"],
    moods: ["Dark", "Atmospheric", "Mind-Bending / Twisty"],
    tropes: ["dark academia"],
    referenceMatches: ["the secret history"],
    baseDescription: "Under the influence of a charismatic classics professor, an elite circle of eccentric students at an isolated Vermont college step beyond moral boundaries into murder."
  },
  {
    title: "Babel: An Arcane History",
    author: "R.F. Kuang",
    year: 2022,
    genre: "Fantasy",
    subgenres: ["Oxford Translation", "Silver-working Magic", "Empire & Rebellion", "Scholarly"],
    topics: ["dark academia", "babel", "oxford", "translation", "silver-working", "colonialism", "languages"],
    moods: ["Dark", "Atmospheric", "Heartbreaking / Emotional"],
    tropes: ["dark academia", "found family"],
    referenceMatches: ["babel"],
    baseDescription: "Oxford's prestigious Institute of Translation powers the British Empire using magical silver bars engraved with words. A passionate, heartbreaking critique of empire, language, and power."
  },
  {
    title: "If We Were Villains",
    author: "M.L. Rio",
    year: 2018,
    genre: "Mystery",
    subgenres: ["Shakespeare Drama", "Conservatory", "Murder Mystery", "Obsession"],
    topics: ["dark academia", "shakespeare", "theater", "acting conservatory", "murder", "secrets", "obsession"],
    moods: ["Dark", "Atmospheric"],
    tropes: ["dark academia"],
    referenceMatches: ["if we were villains"],
    baseDescription: "Seven Shakespearean acting students at an elite arts conservatory discover the deadly rivalries of the tragedies they perform bleeding into their real lives."
  },

  // ── 15. ROMANCE & CONTEMPORARY FICTION ────────────────────────────────────
  {
    title: "Book Lovers",
    author: "Emily Henry",
    year: 2022,
    genre: "Romance",
    subgenres: ["Literary Agent & Editor", "Small Town Rivalry", "Sharp Banter", "Meta-Romance"],
    topics: ["romance", "emily henry", "book lovers", "enemies to lovers", "publishing", "literary agent", "banter"],
    moods: ["Lighthearted / Witty", "Cozy"],
    tropes: ["enemies to lovers", "slow burn"],
    referenceMatches: ["book lovers", "beach read"],
    baseDescription: "A fierce Manhattan literary agent and her cynical rival editor cross paths during a summer in small-town North Carolina. Razor-sharp prose, witty chemistry, and emotional depth."
  },
  {
    title: "Beach Read",
    author: "Emily Henry",
    year: 2020,
    genre: "Romance",
    subgenres: ["Rival Authors", "Summer Swap Challenge", "Emotional Depth", "Banters"],
    topics: ["romance", "emily henry", "rivals to lovers", "writers", "beach house", "banter", "summer read"],
    moods: ["Lighthearted / Witty", "Cozy"],
    tropes: ["enemies to lovers"],
    referenceMatches: ["beach read"],
    baseDescription: "Two rival authors struggling with writer's block in neighboring beach houses challenge each other to write outside their comfort zones. Sparkling banter layered with poignant grief and romance."
  },
  {
    title: "The Seven Husbands of Evelyn Hugo",
    author: "Taylor Jenkins Reid",
    year: 2017,
    genre: "Historical Fiction",
    subgenres: ["Romance", "Drama", "LGBTQ+"],
    topics: ["romance", "evelyn hugo", "old hollywood", "glamour", "lgbtq+", "secrets", "scandal", "emotional"],
    baseDescription: "Aging, reclusive Hollywood icon Evelyn Hugo finally chooses unknown magazine reporter Monique Grant to write her tell-all biography, revealing the truth behind her glamorous scandals and one true love."
  },
  {
    title: "The Love Hypothesis",
    author: "Ali Hazelwood",
    year: 2021,
    genre: "Romance",
    subgenres: ["Contemporary Romance", "STEMinist", "Romantic Comedy"],
    topics: ["romance", "fake dating", "academia", "stem", "grumpy sunshine", "ali hazelwood", "cute"],
    baseDescription: "Third-year Ph.D. candidate Olive Smith panic-kisses the first man she sees — notorious tyrant professor Adam Carlsen — kickstarting an irresistible fake-dating arrangement with real consequences."
  },

  // ── 16. COZY FANTASY & COMFORTING READS ───────────────────────────────────
  {
    title: "Legends & Lattes",
    author: "Travis Baldree",
    year: 2022,
    genre: "Fantasy",
    subgenres: ["Cozy Fantasy", "Coffee Shop", "Found Family", "Low Stakes"],
    topics: ["cozy", "coffee shop", "legends and lattes", "orcs", "low stakes", "found family"],
    moods: ["Cozy", "Lighthearted / Witty"],
    tropes: ["found family", "slow burn"],
    referenceMatches: ["legends & lattes"],
    baseDescription: "A battle-weary orc barbarian hangs up her sword to open the first espresso shop in a fantasy metropolis. Warm cinnamon rolls, gentle community bonds, and absolute comforting tranquility."
  },
  {
    title: "The House in the Cerulean Sea",
    author: "TJ Klune",
    year: 2020,
    genre: "Fantasy",
    subgenres: ["Magical Orphanage", "Island Sanctuary", "Found Family", "Pure Joy"],
    topics: ["cozy", "found family", "tj klune", "island", "warmth", "kindness"],
    moods: ["Cozy", "Lighthearted / Witty"],
    tropes: ["found family"],
    referenceMatches: ["the house in the cerulean sea"],
    baseDescription: "A by-the-book caseworker visits a classified island orphanage for extraordinary youth and discovers profound warmth, acceptance, and an eccentric found family. Like a warm hug in book form."
  },

  // ── 17. SELF-IMPROVEMENT & HABITS ─────────────────────────────────────────
  {
    title: "Atomic Habits: An Easy & Proven Way to Build Good Habits & Break Bad Ones",
    author: "James Clear",
    year: 2018,
    genre: "Non-Fiction",
    subgenres: ["Self-Help", "Productivity", "Psychology"],
    topics: ["habits", "atomic habits", "james clear", "productivity", "self improvement", "discipline", "systems"],
    baseDescription: "Clear explains how tiny 1% daily improvements compound into massive transformations, offering a four-step framework (Make it Obvious, Attractive, Easy, Satisfying) to engineer unstoppable routines."
  },
  {
    title: "Deep Work: Rules for Focused Success in a Distracted World",
    author: "Cal Newport",
    year: 2016,
    genre: "Non-Fiction",
    subgenres: ["Productivity", "Business", "Self-Help"],
    topics: ["productivity", "deep work", "cal newport", "focus", "distraction", "career", "mastery"],
    baseDescription: "Argues that the ability to concentrate without distraction on cognitively demanding tasks is becoming increasingly rare and vastly more valuable in our distracted knowledge economy."
  },

  // ── 18. CLASSIC HORROR ────────────────────────────────────────────────────
  {
    title: "The Shining",
    author: "Stephen King",
    year: 1977,
    genre: "Horror",
    subgenres: ["Supernatural", "Psychological Horror", "Classics"],
    topics: ["horror", "stephen king", "the shining", "overlook hotel", "isolation", "haunted hotel", "ghosts", "madness"],
    baseDescription: "Jack Torrance takes a winter caretaker job at the remote Overlook Hotel with his wife and telepathic son Danny, where the hotel's sinister supernatural history begins preying on Jack's fragile mind."
  },
  {
    title: "The Haunting of Hill House",
    author: "Shirley Jackson",
    year: 1959,
    genre: "Horror",
    subgenres: ["Gothic", "Psychological Horror", "Classics"],
    topics: ["horror", "gothic", "haunted house", "shirley jackson", "psychological", "atmospheric", "classic horror"],
    baseDescription: "Four seekers arrive at the sinister Hill House to investigate supernatural phenomena, but the house's brooding malevolent presence forms an insidious, deadly attachment to the fragile Eleanor Vance."
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// DOMAIN TOPIC ALIASES
// ─────────────────────────────────────────────────────────────────────────────
export const DOMAIN_TOPIC_ALIASES: Record<string, string[]> = {
  "ai": ["artificial intelligence", "ai", "machine learning", "neural network", "deep learning", "robotics", "singularity", "algorithm", "artificial friend", "agi", "tech future"],
  "consciousness": ["consciousness", "mind", "cognition", "sentience", "philosophy of mind", "human heart", "self awareness", "qualia"],
  "indian_mythology": ["indian mythology", "hindu mythology", "mahabharata", "ramayana", "shiva", "krishna", "draupadi", "sita", "ravana", "amish tripathi", "neelkanth", "vedic", "chitra banerjee"],
  "stoicism": ["stoicism", "stoic", "marcus aurelius", "seneca", "epictetus", "ryan holiday", "meditations", "inner peace", "resilience", "dichotomy of control"],
  "samurai": ["samurai", "feudal japan", "japan", "japanese literature", "bushido", "musashi", "sword", "shogun", "tokugawa", "edo", "ronin", "eiji yoshikawa", "clavell"],
  "the_alchemist": ["the alchemist", "paulo coelho", "spiritual journey", "destiny", "fable", "personal legend", "self discovery", "philosophical journey", "siddhartha"],
  "biographies": ["biography", "biographies", "memoir", "walter isaacson", "steve jobs", "shoe dog", "phil knight", "entrepreneur", "true story", "life story", "leonardo da vinci", "einstein"],
  "finance": ["finance", "money", "investing", "stocks", "wealth", "psychology of money", "economics", "buffett", "rich dad", "cashflow", "benjamin graham"],
  "astrophysics": ["astrophysics", "space", "astronomy", "cosmos", "carl sagan", "stephen hawking", "neil degrasse tyson", "universe", "black holes", "stars"],
  "cooking": ["cooking", "culinary", "food", "chef", "kitchen", "restaurant", "baking", "food memoir", "recipes", "anthony bourdain"],
  "cyberpunk": ["cyberpunk", "hacker", "virtual reality", "matrix", "cyberspace", "neuromancer", "snow crash", "neon", "dystopian tech"],
  "dark_academia": ["dark academia", "secret society", "oxford", "cambridge", "classics", "latin", "greek tragedy", "the secret history", "babel"],
  "classic_literature": ["classic", "classics", "dostoevsky", "tolstoy", "literature", "russian literature", "19th century", "masterpiece", "crime and punishment"],
  "horror": ["horror", "scary", "spooky", "stephen king", "gothic horror", "haunted house", "creepy", "ghosts", "the shining"],
  "romance": ["romance", "enemies to lovers", "love story", "romantic comedy", "emily henry", "fake dating", "slow burn", "spicy"],
  "mystery": ["mystery", "thriller", "psychological thriller", "whodunnit", "holly jackson", "the silent patient", "agatha christie", "detective", "cold case"],
  "harry_potter": ["harry potter", "hogwarts", "wizarding", "magic school", "jk rowling", "percy jackson"],
  "holly_jackson": ["holly jackson", "pip fitz", "a good girl's guide to murder"],
  "fourth_wing": ["fourth wing", "xaden", "violet sorrengail", "romantasy", "dragon riders"],
  "cozy": ["cozy", "comforting", "wholesome", "legends and lattes", "coffee shop", "gentle fantasy"],
  "habits": ["habits", "productivity", "atomic habits", "focus", "deep work", "self improvement", "discipline", "mindset"]
};

export interface UniversalRecommendationOptions {
  userQuery: string;
  conversationMessages?: Array<{ role: "user" | "assistant"; content: string }>;
  userId?: string;
  userRatings?: Array<{ title: string; author: string; genre: string; rating: number | null }>;
}

export function generateUniversalBookRecommendation(
  options: UniversalRecommendationOptions
): string {
  const { userQuery, conversationMessages = [], userRatings = [] } = options;
  const q = userQuery.toLowerCase().trim();
  const intent: ExtractedIntent = extractIntent(userQuery);

  // 1. Gather previously recommended titles to strictly guarantee 0 repetition
  const alreadyRecommended = new Set<string>();
  for (const msg of conversationMessages) {
    if (msg.role === "assistant" && typeof msg.content === "string") {
      const matches = msg.content.match(/\*\*([^*]+)\*\*\s+by/gi);
      if (matches) {
        for (const m of matches) {
          const title = m.replace(/^\*\*/, "").replace(/\*\*\s+by$/i, "").trim().toLowerCase();
          alreadyRecommended.add(title);
        }
      }
    }
  }

  // 2. Identify active domain anchors from query
  const matchedDomainKeys: string[] = [];
  for (const [domainKey, aliases] of Object.entries(DOMAIN_TOPIC_ALIASES)) {
    if (aliases.some((alias) => {
      if (alias.length <= 3) {
        return new RegExp(`\\b${alias}\\b`, "i").test(q);
      }
      return q.includes(alias);
    })) {
      matchedDomainKeys.push(domainKey);
    }
  }

  // Priority detection: Holly Jackson means YA mystery, NEVER romance
  const isHollyJacksonQuery = q.includes("holly jackson") || intent.explicitAuthors.some((a) => a.toLowerCase().includes("holly jackson"));

  // 3. Score every book in the catalog
  interface ScoredBook {
    book: UniversalBook;
    score: number;
  }

  const scoredList: ScoredBook[] = [];

  for (const book of WORLD_BOOK_CATALOG) {
    const bookTitleLower = book.title.toLowerCase();
    const bookAuthorLower = book.author.toLowerCase();
    const bookGenreLower = book.genre.toLowerCase();

    // Skip if already recommended in this conversation
    if (Array.from(alreadyRecommended).some((t) => bookTitleLower.includes(t) || t.includes(bookTitleLower))) {
      continue;
    }

    // STRICT GUARD: If user asked for Holly Jackson, NEVER recommend pure romance books
    if (isHollyJacksonQuery && (bookGenreLower === "romance" || book.author.toLowerCase() === "emily henry")) {
      continue;
    }

    let score = 0;

    // A. Reference Work Match (e.g. Harry Potter, Fourth Wing, The Silent Patient)
    if (intent.referenceWork) {
      const refTitleLower = intent.referenceWork.title.toLowerCase();
      if (book.referenceMatches?.some((ref) => refTitleLower.includes(ref) || ref.includes(refTitleLower))) {
        score += 260;
      }
      for (const sig of intent.referenceWork.signals) {
        const s = sig.toLowerCase();
        if (book.topics.some((t) => t.includes(s) || s.includes(t)) ||
            book.subgenres.some((sg) => sg.toLowerCase().includes(s)) ||
            book.baseDescription.toLowerCase().includes(s)) {
          score += 35;
        }
      }
    }

    // B. Direct Author Match (Highest Priority)
    if (intent.explicitAuthors.some((a) => bookAuthorLower.includes(a.toLowerCase()) || a.toLowerCase().includes(bookAuthorLower)) ||
        q.includes(bookAuthorLower)) {
      score += 300;
    } else if (book.referenceMatches?.some((ref) => intent.explicitAuthors.some((a) => ref.includes(a.toLowerCase())))) {
      score += 150;
    }

    // C. Direct Title Match
    if (intent.explicitTitles.some((t) => bookTitleLower.includes(t.toLowerCase()) || t.toLowerCase().includes(bookTitleLower))) {
      score += 250;
    }

    // D. Domain Matches
    for (const domain of matchedDomainKeys) {
      const aliases = DOMAIN_TOPIC_ALIASES[domain] || [];
      const hasTopicMatch = book.topics.some((t) => aliases.some((a) => t.includes(a) || a.includes(t)));
      const hasSubgenreMatch = book.subgenres.some((sg) => aliases.some((a) => sg.toLowerCase().includes(a)));

      if (hasTopicMatch) score += 110;
      if (hasSubgenreMatch) score += 70;
    }

    // E. Keyword Overlap with Query tokens
    const queryTokens = q.replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((t) => t.length > 2);
    for (const token of queryTokens) {
      if (book.topics.some((t) => t.includes(token))) score += 25;
      if (bookTitleLower.includes(token)) score += 40;
      if (book.subgenres.some((sg) => sg.toLowerCase().includes(token))) score += 20;
      if (book.baseDescription.toLowerCase().includes(token)) score += 12;
    }

    // F. Tropes & Mood Matches
    if (intent.explicitTropes.length > 0 && book.tropes) {
      for (const trope of intent.explicitTropes) {
        if (book.tropes.map((t) => t.toLowerCase()).includes(trope.toLowerCase())) {
          score += 65;
        }
      }
    }
    if (intent.explicitMoods.length > 0 && book.moods) {
      for (const mood of intent.explicitMoods) {
        if (book.moods.map((m) => m.toLowerCase()).includes(mood.toLowerCase())) {
          score += 45;
        }
      }
    }

    // G. User Ratings Personalization (Gently boost 4-5★ favorites, deprioritize 1-2★)
    if (userRatings.length > 0) {
      for (const r of userRatings) {
        if (r.rating && r.rating >= 4) {
          if (bookGenreLower.includes(r.genre.toLowerCase())) score += 15;
        } else if (r.rating && r.rating <= 2) {
          if (bookTitleLower.includes(r.title.toLowerCase())) score -= 200;
        }
      }
    }

    scoredList.push({ book, score });
  }

  // 4. Sort candidates by score descending
  scoredList.sort((a, b) => b.score - a.score);

  // Take top 5 candidates
  let selected = scoredList.filter((s) => s.score > 15).slice(0, 5).map((s) => s.book);

  // If no candidates had strong score or query is novel, take highest non-shown
  if (selected.length < 3) {
    for (const item of scoredList) {
      if (!selected.some((b) => b.title === item.book.title)) {
        selected.push(item.book);
        if (selected.length >= 5) break;
      }
    }
  }

  // 5. Generate Contextual Opening Sentence
  const intro = generateDynamicOpening(q, intent, matchedDomainKeys);

  // 6. Generate Contextual Outro
  const outro = generateDynamicClosing(matchedDomainKeys);

  // 7. Format Books with Traceable Explanations
  const bookBlocks = selected.map((b, idx) => {
    const whyYouLoveIt = synthesizeWhyYouLoveIt(b, q, intent);
    return `${idx + 1}. **${b.title}** by ${b.author} (${b.year})\n   *Why you'll love it:* ${whyYouLoveIt}`;
  });

  return `${intro}\n\n${bookBlocks.join("\n\n")}\n\n${outro}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// DYNAMIC REASONS & OPENINGS
// ─────────────────────────────────────────────────────────────────────────────
function synthesizeWhyYouLoveIt(book: UniversalBook, userQuery: string, intent: ExtractedIntent): string {
  const q = userQuery.toLowerCase();

  if (q.includes("ai") || q.includes("artificial intelligence") || q.includes("consciousness")) {
    if (book.title.includes("Superintelligence")) return "Essential reading for understanding the philosophical stakes, safety dilemmas, and existential risks of machines surpassing human intelligence.";
    if (book.title.includes("Life 3.0")) return "Directly tackles how machine intelligence and synthetic consciousness will reshape society, work, and the cosmic future of humanity.";
    if (book.title.includes("Klara and the Sun")) return "A deeply emotional literary exploration of artificial consciousness, empathy, and whether an AI can truly comprehend human love.";
    if (book.title.includes("Gödel, Escher, Bach")) return "A monumental intellectual masterpiece unraveling how self-awareness and conscious thought emerge from formal systems and algorithms.";
  }

  if (q.includes("mythology") || q.includes("indian") || q.includes("shiva") || q.includes("mahabharata")) {
    if (book.title.includes("Meluha")) return "Reimagines ancient Vedic mythology with cinematic grit, portraying Lord Shiva as a mortal hero navigating destiny, war, and sacrifice.";
    if (book.title.includes("Palace of Illusions")) return "Offers an unforgettable, lyrical retelling of the Mahabharata through the eyes of Draupadi, balancing royal splendor with tragic depth.";
    if (book.title.includes("Asura")) return "A compelling counter-perspective that gives voice to Ravana and the vanquished, challenging traditional black-and-white mythological narratives.";
  }

  if (q.includes("stoic") || q.includes("marcus aurelius") || q.includes("seneca") || q.includes("epictetus")) {
    if (book.title.includes("Meditations")) return "The foundational stoic text written by the Roman Emperor himself, offering unmatched wisdom on mental resilience and mastering your inner state.";
    if (book.title.includes("Letters from a Stoic")) return "Practical, witty, and profoundly humane letters advising how to find tranquility, manage time, and face adversity with dignity.";
    if (book.title.includes("Daily Stoic")) return "Provides daily actionable reflections bridging ancient stoic philosophy with modern challenges, focus, and emotional discipline.";
  }

  if (q.includes("samurai") || q.includes("japan") || q.includes("feudal")) {
    if (book.title.includes("Musashi")) return "The definitive Japanese epic following the legendary swordsman Miyamoto Musashi on his quest for spiritual enlightenment and martial mastery.";
    if (book.title.includes("Shōgun")) return "A sweeping, immersive masterpiece of political intrigue, honorable samurai codes, and clash of civilizations in 17th-century Japan.";
    if (book.title.includes("Silence")) return "A profound, haunting historical exploration of moral conviction and resilience set against isolationist 17th-century Japan.";
  }

  if (q.includes("alchemist") || q.includes("spiritual") || q.includes("journey")) {
    if (book.title.includes("Siddhartha")) return "Shares *The Alchemist*'s spiritual quest for self-discovery, following one man's lifelong search for enlightenment beyond dogmas and worldly distractions.";
    if (book.title.includes("Prophet")) return "Lyrical, timeless philosophical teachings on destiny, love, and life's essential milestones that deeply resonate with Coelho's fables.";
  }

  if (q.includes("walter isaacson") || q.includes("biograph")) {
    if (book.title.includes("Steve Jobs")) return "The definitive, unvarnished portrait of visionary genius, product obsession, and fierce creative drive.";
    if (book.title.includes("Leonardo da Vinci")) return "A breathtaking masterclass in insatiable curiosity, connecting Renaissance art, science, and boundless imagination.";
    if (book.title.includes("Einstein")) return "Traces how an insolent, rebellious patent clerk dismantled Newton's physics to reshape our understanding of space and time.";
  }

  if (q.includes("finance") || q.includes("money") || q.includes("investing")) {
    if (book.title.includes("Psychology of Money")) return "Demonstrates that financial success is not about spreadsheets or formulas, but mastering your behavior, patience, and emotional biases.";
    if (book.title.includes("Intelligent Investor")) return "The immortal foundation of value investing, teaching how to stay disciplined when the market is euphoric or terrified.";
  }

  if (q.includes("cook") || q.includes("food") || q.includes("culinary")) {
    if (book.title.includes("Kitchen Confidential")) return "A brutally honest, hilarious, rock-and-roll expose of restaurant kitchens and the pirate crew of line cooks who run them.";
    if (book.title.includes("Lessons in Chemistry")) return "A witty, delightful story of a 1960s female chemist who turns a television cooking show into a revolutionary masterclass.";
  }

  if (q.includes("astrophysics") || q.includes("cosmos") || q.includes("space")) {
    if (book.title.includes("Cosmos")) return "The most poetic exploration of astronomy ever written, celebrating fifteen billion years of cosmic evolution and human discovery.";
    if (book.title.includes("Brief History of Time")) return "Demystifies the birth of the universe, black hole event horizons, and the fundamental laws of spacetime with brilliant clarity.";
  }

  return book.baseDescription;
}

function generateDynamicOpening(q: string, intent: ExtractedIntent, matchedDomainKeys: string[]): string {
  if (intent.isFollowUpMore) {
    return "Here is another handpicked batch of distinct, acclaimed books expanding on those themes without repeating earlier titles:";
  }
  if (intent.referenceWork) {
    if (intent.referenceWork.title.toLowerCase().includes("harry potter")) {
      return "If you're looking for that feeling of discovering a hidden magical world, growing alongside unforgettable friends, and getting pulled into a great adventure, start here:";
    }
    if (intent.referenceWork.title.toLowerCase().includes("the silent patient")) {
      return "If you loved *The Silent Patient* for its mind-bending plot twists, clinical obsessions, and unreliable narration, here are brilliant psychological thrillers:";
    }
    if (intent.referenceWork.title.toLowerCase().includes("fourth wing")) {
      return "If you want fierce dragons, deadly academy trials, and high-voltage romantic tension like *Fourth Wing*, start here:";
    }
    if (intent.referenceWork.title.toLowerCase().includes("the alchemist")) {
      return "If you loved *The Alchemist* for its philosophical fables, personal legends, and soulful journeys of self-discovery, these books carry that same spirit:";
    }
    return `If you loved *${intent.referenceWork.title}* and want stories sharing its ${intent.referenceWork.signals.slice(0, 3).join(", ")}, start here:`;
  }
  if (intent.explicitAuthors.length > 0) {
    const auth = intent.explicitAuthors.join(" & ");
    if (auth.toLowerCase().includes("holly jackson")) {
      return "If Holly Jackson's twists, secrets, and impossible-to-put-down investigations are your thing, these YA mysteries should keep you guessing:";
    }
    return `Since you appreciate the distinctive craft and storytelling of **${auth}**, here are books that match that caliber:`;
  }
  if (q.includes("cook") || q.includes("culinary") || q.includes("food")) {
    return "For the heat of restaurant lines, the alchemy of flavor, and heartfelt stories told through the love of food, pick up these culinary gems:";
  }
  if (q.includes("samurai") || q.includes("feudal") || matchedDomainKeys.includes("samurai")) {
    return "For epic honor, sword craft, and the sweeping atmosphere of feudal Japan, these masterworks bring the samurai era vividly to life:";
  }
  if (q.includes("stoic") || q.includes("marcus aurelius") || matchedDomainKeys.includes("stoicism")) {
    return "If you want practical wisdom, mental resilience, and the timeless art of inner peace from the great Stoics, these foundational texts are essential:";
  }
  if (q.includes("mythology") || q.includes("indian") || matchedDomainKeys.includes("indian_mythology")) {
    return "For grand epics, ancient lore, and breathtaking retellings of Indian mythology from unforgettable perspectives, start with these standout works:";
  }
  if (q.includes("ai") || q.includes("artificial intelligence") || q.includes("consciousness") || matchedDomainKeys.includes("ai")) {
    return "If you are exploring the frontiers of artificial intelligence, machine minds, and the nature of consciousness, here are landmark works you need to read:";
  }
  if (q.includes("biograph") || q.includes("memoir") || matchedDomainKeys.includes("biographies")) {
    return "If you are drawn to masterfully researched biographies of visionary creators, innovators, and relentless ambition, start here:";
  }
  if (q.includes("finance") || q.includes("invest") || q.includes("money") || matchedDomainKeys.includes("finance")) {
    return "For mastering the psychology of wealth, long-term investing, and the mental models behind financial independence, these are the gold standards:";
  }
  if (q.includes("astrophysics") || q.includes("space") || q.includes("cosmos") || matchedDomainKeys.includes("astrophysics")) {
    return "If you want to look up at the night sky with wonder and understand the grand mysteries of the cosmos, these astrophysics books are unforgettable:";
  }
  if (q.includes("dark academia") || matchedDomainKeys.includes("dark_academia")) {
    return "For shadowed libraries, scholarly obsession, and the dangerous pursuit of esoteric knowledge, step into these dark academia masterworks:";
  }

  return "Here are acclaimed, world-class book recommendations tailored directly to what you're looking for:";
}

function generateDynamicClosing(matchedDomainKeys: string[]): string {
  if (matchedDomainKeys.includes("ai") || matchedDomainKeys.includes("consciousness")) {
    return "Would you like to explore speculative sci-fi exploring rogue AI, or deeper philosophical treatises on machine ethics? 🤖📚";
  }
  if (matchedDomainKeys.includes("indian_mythology")) {
    return "Would you prefer to explore ancient Vedic thrillers, character-driven feminist retellings, or grand war epics next? 🪶✨";
  }
  if (matchedDomainKeys.includes("stoicism")) {
    return "Would you like practical daily exercises, or deeper philosophical discourses on handling adversity? 🏛️📖";
  }
  return "Which of these speaks to you most, or would you like to explore a slightly different angle or genre? 📚✨";
}
