/**
 * Quilla Intent & Preference Extraction Engine (Client / Shared)
 * 
 * Accurately extracts structured signals from user messages:
 * - Reference book works & similarities (e.g. "Harry Potter", "The Silent Patient", "Fourth Wing")
 * - Semantic dimensions & signals (magic, wizarding academy, coming-of-age, friendship, world-building)
 * - Explicit Author preferences (e.g. "Holly Jackson", "Emily Henry", "Alex Michaelides")
 * - Explicit Tropes & Themes (e.g. "enemies to lovers", "found family", "dark academia", "heist")
 * - Explicit Genres (ONLY when specifically stated, never assumed from sentiment words like "love")
 * - Explicit Moods (e.g. "heartbreaking", "cozy", "darker")
 * - Modifiers (e.g. "like Fourth Wing but darker", "more romantic")
 * - Priority hierarchy: Explicit Current Request > Mentioned Author/Book > History/Ratings > Inferred
 */

export type IntentType =
  | "author_preference"
  | "book_similarity"
  | "genre_preference"
  | "mood_preference"
  | "trope_preference"
  | "theme_preference"
  | "hybrid"
  | "vague_discovery";

export interface ReferenceWorkSignals {
  title: string;
  author?: string;
  signals: string[];
}

export interface ExtractedIntent {
  intentTypes: IntentType[];
  primaryIntent: IntentType;
  explicitAuthors: string[];
  explicitTitles: string[];
  explicitGenres: string[];
  explicitMoods: string[];
  explicitTropes: string[];
  modifiers: string[];
  referenceWork?: ReferenceWorkSignals;
  isFollowUpMore: boolean;
  isVague: boolean;
  rawQuery: string;
  summary: string;
}

// Known authors reference list for high-accuracy recognition
export const KNOWN_AUTHORS = [
  "J.K. Rowling",
  "Holly Jackson",
  "Emily Henry",
  "Alex Michaelides",
  "Taylor Jenkins Reid",
  "Colleen Hoover",
  "Brandon Sanderson",
  "Agatha Christie",
  "Stephen King",
  "Gillian Flynn",
  "Matt Haig",
  "Madeline Miller",
  "Patrick Rothfuss",
  "Frank Herbert",
  "Andy Weir",
  "Cixin Liu",
  "William Gibson",
  "Blake Crouch",
  "Ursula K. Le Guin",
  "Joe Abercrombie",
  "Susanna Clarke",
  "Stieg Larsson",
  "Richard Osman",
  "Tana French",
  "Sally Thorne",
  "Diana Gabaldon",
  "Shirley Jackson",
  "Silvia Moreno-Garcia",
  "Mark Z. Danielewski",
  "Nick Cutter",
  "James Clear",
  "Yuval Noah Harari",
  "Daniel Kahneman",
  "Bill Bryson",
  "Tara Westover",
  "Viktor E. Frankl",
  "Fyodor Dostoevsky",
  "Harper Lee",
  "Gabriel García Márquez",
  "George Eliot",
  "Mikhail Bulgakov",
  "Amor Towles",
  "Kazuo Ishiguro",
  "Anthony Doerr",
  "Gabrielle Zevin",
  "Karen M. McManus",
  "Maureen Johnson",
  "Jennifer Lynn Barnes",
  "Courtney Summers",
  "Kara Thomas",
  "Alice Feeney",
  "Lucy Foley",
  "B.A. Paris",
  "Abby Jimenez",
  "Ali Hazelwood",
  "Carley Fortune",
  "TJ Klune",
  "Travis Baldree",
  "Toshikazu Kawaguchi",
  "Sarah J. Maas",
  "Rebecca Yarros",
  "Leigh Bardugo",
  "V.E. Schwab",
  "Rick Riordan",
  "Neil Gaiman",
  "John Green",
  "Suzanne Collins",
  "Veronica Roth",
  "Pierce Brown",
  "Haruki Murakami",
  "Donna Tartt",
  "Fredrik Backman",
  "Lucy Score",
  "Elle Kennedy",
  "Ana Huang",
  "Ali Smith",
  "Tessa Bailey",
  "Freida McFadden",
  "Riley Sager",
  "Shari Lapena",
  "Lisa Jewell",
  "Ruth Ware",
  "Jessica Townsend",
  "Naomi Novik",
  "Lev Grossman",
  "Tomi Adeyemi",
  "B.B. Alston",
  "A.F. Steadman",
  "Rainbow Rowell",
  "Becky Chambers",
  "Amish Tripathi",
  "Chitra Banerjee Divakaruni",
  "Anand Neelakantan",
  "Devdutt Pattanaik",
  "Marcus Aurelius",
  "Seneca",
  "Epictetus",
  "Ryan Holiday",
  "Eiji Yoshikawa",
  "James Clavell",
  "Shusaku Endo",
  "Paulo Coelho",
  "Hermann Hesse",
  "Kahlil Gibran",
  "Walter Isaacson",
  "Phil Knight",
  "Nick Bostrom",
  "Max Tegmark",
  "Douglas Hofstadter",
  "Stuart Russell",
  "Morgan Housel",
  "Benjamin Graham",
  "Carl Sagan",
  "Stephen Hawking",
  "Neil deGrasse Tyson",
  "Anthony Bourdain",
  "Bonnie Garmus",
  "Michelle Zauner",
  "Leo Tolstoy",
  "Alexandre Dumas",
];

// Reference work dimensional signals for deep semantic mapping
export const KNOWN_REFERENCE_SIGNALS: Record<string, ReferenceWorkSignals> = {
  "harry potter": {
    title: "Harry Potter",
    author: "J.K. Rowling",
    signals: [
      "fantasy",
      "magic & spellcasting",
      "wizarding academy / school setting",
      "coming-of-age journey",
      "trio friendship & fierce loyalty",
      "whimsical yet dangerous world-building",
      "hidden magical society alongside mundane world",
      "dark lord mystery & creeping peril",
      "youthful optimism growing into high-stakes heroism"
    ]
  },
  "the silent patient": {
    title: "The Silent Patient",
    author: "Alex Michaelides",
    signals: [
      "psychological thriller",
      "unreliable narrator & psychological deception",
      "clinical obsession & criminal psychotherapy",
      "shocking mind-bending plot twist",
      "silent enigmatic protagonist",
      "Greek tragedy undertones",
      "deep guilt, trauma, and repressed truth"
    ]
  },
  "fourth wing": {
    title: "Fourth Wing",
    author: "Rebecca Yarros",
    signals: [
      "romantasy",
      "dragon riders & deadly war college",
      "enemies to lovers romantic tension",
      "high stakes, brutal trials, and life-or-death survival",
      "underdog protagonist with hidden strength",
      "forbidden attraction & fierce squad loyalty"
    ]
  },
  "percy jackson": {
    title: "Percy Jackson",
    author: "Rick Riordan",
    signals: [
      "mythology & modern demigods",
      "heroic mythological quests",
      "fast-paced snarky humor and banter",
      "unbreakable friendships",
      "magical sanctuary / training camp",
      "coming-of-age empowerment"
    ]
  },
  "six of crows": {
    title: "Six of Crows",
    author: "Leigh Bardugo",
    signals: [
      "impossible heist & criminal underworld",
      "found family of broken misfits",
      "morally gray anti-heroes with tragic pasts",
      "clever multi-layered planning & twists",
      "gritty atmospheric fantasy setting"
    ]
  },
  "the hunger games": {
    title: "The Hunger Games",
    author: "Suzanne Collins",
    signals: [
      "dystopian survival arena",
      "rebellion against tyrannical regime",
      "moral complexity & trauma of survival",
      "fierce protective instinct for loved ones",
      "unrelenting high-tension pacing"
    ]
  },
  "a court of thorns and roses": {
    title: "A Court of Thorns and Roses",
    author: "Sarah J. Maas",
    signals: [
      "fae courts & high fantasy politics",
      "enemies to lovers slow burn",
      "steamy romantic tension",
      "mortal trapped in dangerous magical realm",
      "found family & ancient curses"
    ]
  },
  "acotar": {
    title: "A Court of Thorns and Roses",
    author: "Sarah J. Maas",
    signals: [
      "fae courts & high fantasy politics",
      "enemies to lovers slow burn",
      "steamy romantic tension",
      "mortal trapped in dangerous magical realm",
      "found family & ancient curses"
    ]
  },
  "dune": {
    title: "Dune",
    author: "Frank Herbert",
    signals: [
      "sprawling space opera epic",
      "desert planet ecology & spice economics",
      "intergalactic political intrigue & dynasties",
      "prophecy, messiah burden, and destiny",
      "philosophical and hard sci-fi depth"
    ]
  },
  "the name of the wind": {
    title: "The Name of the Wind",
    author: "Patrick Rothfuss",
    signals: [
      "lyrical epic fantasy prose",
      "arcane university education",
      "legendary protagonist recounting his true history",
      "systematic sympathy magic",
      "mysterious mythic adversaries (the Chandrian)"
    ]
  },
  "verity": {
    title: "Verity",
    author: "Colleen Hoover",
    signals: [
      "dark psychological thriller",
      "disturbing unfinished manuscript",
      "twisted domestic secrets",
      "unreliable narrator",
      "forbidden romantic tension in an isolated home"
    ]
  },
  "a good girl's guide to murder": {
    title: "A Good Girl's Guide to Murder",
    author: "Holly Jackson",
    signals: [
      "fast-paced YA mystery & true-crime investigation",
      "school project uncovering dark small-town secrets",
      "multimedia format: interviews, transcripts, diary notes",
      "delightful investigative duo dynamic with Ravi Singh",
      "shocking twists and high personal stakes"
    ]
  },
  "beach read": {
    title: "Beach Read",
    author: "Emily Henry",
    signals: [
      "contemporary romance with emotional depth",
      "rival authors swapping genre challenges",
      "sparkling witty banter and chemistry",
      "navigating creative block, grief, and vulnerability"
    ]
  },
  "legends & lattes": {
    title: "Legends & Lattes",
    author: "Travis Baldree",
    signals: [
      "cozy fantasy with low stakes",
      "retired orc warrior opening a coffee shop",
      "found family, warm pastries, and gentle community",
      "soothing, wholesome comfort reading"
    ]
  },
  "the house in the cerulean sea": {
    title: "The House in the Cerulean Sea",
    author: "TJ Klune",
    signals: [
      "cozy fantasy with deep warmth",
      "magical orphanage on an isolated island",
      "found family & celebrating uniqueness",
      "wholesome humor and gentle romance"
    ]
  },
  "the alchemist": {
    title: "The Alchemist",
    author: "Paulo Coelho",
    signals: [
      "spiritual quest & personal legend",
      "philosophical fable",
      "destiny and omens",
      "searching for life's treasure & self-discovery",
      "poetic and transformative journey"
    ]
  },
  "meditations": {
    title: "Meditations",
    author: "Marcus Aurelius",
    signals: [
      "stoic philosophy & mental fortress",
      "resilience in the face of chaos",
      "duty, mortality, and inner tranquility",
      "emperor's private self-counsel"
    ]
  },
  "musashi": {
    title: "Musashi",
    author: "Eiji Yoshikawa",
    signals: [
      "samurai epic & feudal Japan",
      "way of the sword (Bushido)",
      "mastery, honor, and spiritual discipline",
      "legendary duelists and wandering ronin"
    ]
  },
  "shogun": {
    title: "Shōgun",
    author: "James Clavell",
    signals: [
      "feudal Japan & samurai honor",
      "political intrigue and clash of empires",
      "tactical warfare and shogun power"
    ]
  },
  "the immortals of meluha": {
    title: "The Immortals of Meluha",
    author: "Amish Tripathi",
    signals: [
      "Indian mythology reimagined",
      "Lord Shiva as a mortal hero",
      "Vedic history and ancient destiny",
      "epic battles and Somras legend"
    ]
  },
  "the palace of illusions": {
    title: "The Palace of Illusions",
    author: "Chitra Banerjee Divakaruni",
    signals: [
      "Mahabharata retelling from Draupadi's eyes",
      "epic Indian mythology",
      "tragic destiny, royal pride, and sacred palace",
      "powerful feminist perspective"
    ]
  },
  "superintelligence": {
    title: "Superintelligence",
    author: "Nick Bostrom",
    signals: [
      "artificial intelligence & existential risk",
      "singularity and machine minds",
      "ai alignment and future of humanity",
      "rigorous philosophy of technology"
    ]
  },
  "the psychology of money": {
    title: "The Psychology of Money",
    author: "Morgan Housel",
    signals: [
      "behavioral finance and wealth mindset",
      "patience, compounding, and emotional control",
      "practical wisdom on financial freedom"
    ]
  },
  "cosmos": {
    title: "Cosmos",
    author: "Carl Sagan",
    signals: [
      "poetic astrophysics and astronomy",
      "fifteen billion years of cosmic evolution",
      "wonder, stars, and human exploration"
    ]
  }
};

// Known famous book titles for instant similarity detection
export const KNOWN_TITLES = [
  "Harry Potter",
  "Harry Potter and the Sorcerer's Stone",
  "Percy Jackson",
  "The Lightning Thief",
  "Nevermoor",
  "Nevermoor: The Trials of Morrigan Crow",
  "The Scholomance",
  "A Deadly Education",
  "The Magicians",
  "Children of Blood and Bone",
  "Amari and the Night Brothers",
  "Skandar and the Unicorn Thief",
  "Carry On",
  "The Silent Patient",
  "A Good Girl's Guide to Murder",
  "Good Girl, Bad Blood",
  "As Good As Dead",
  "Five Survive",
  "The Reappearance of Rachel Price",
  "Beach Read",
  "Book Lovers",
  "Happy Place",
  "People We Meet on Vacation",
  "Funny Story",
  "Fourth Wing",
  "Iron Flame",
  "A Court of Thorns and Roses",
  "A Court of Mist and Fury",
  "Six of Crows",
  "Crooked Kingdom",
  "Shadow and Bone",
  "The Hunger Games",
  "Catching Fire",
  "Mockingjay",
  "Divergent",
  "The Maze Runner",
  "The Cruel Prince",
  "Shatter Me",
  "Red Rising",
  "Dune",
  "Project Hail Mary",
  "The Three-Body Problem",
  "Neuromancer",
  "Recursion",
  "Dark Matter",
  "The Left Hand of Darkness",
  "The Name of the Wind",
  "The Wise Man's Fear",
  "The Way of Kings",
  "Words of Radiance",
  "Circe",
  "The Song of Achilles",
  "The Blade Itself",
  "A Wizard of Earthsea",
  "Jonathan Strange & Mr Norrell",
  "The Girl with the Dragon Tattoo",
  "And Then There Were None",
  "Gone Girl",
  "The Thursday Murder Club",
  "In the Woods",
  "The Seven Husbands of Evelyn Hugo",
  "Daisy Jones & The Six",
  "Pride and Prejudice",
  "It Ends with Us",
  "Verity",
  "The Hating Game",
  "Outlander",
  "The Haunting of Hill House",
  "It",
  "Mexican Gothic",
  "House of Leaves",
  "The Troop",
  "Piranesi",
  "Atomic Habits",
  "Sapiens",
  "Thinking, Fast and Slow",
  "Educated",
  "Man's Search for Meaning",
  "Crime and Punishment",
  "To Kill a Mockingbird",
  "One Hundred Years of Solitude",
  "The Midnight Library",
  "A Gentleman in Moscow",
  "Klara and the Sun",
  "All the Light We Cannot See",
  "Tomorrow, and Tomorrow, and Tomorrow",
  "One of Us Is Lying",
  "Truly Devious",
  "The Naturals",
  "The Maidens",
  "The Woman in the Window",
  "Behind Closed Doors",
  "Rock Paper Scissors",
  "The Guest List",
  "The Paris Apartment",
  "The Housemaid",
  "The House in the Cerulean Sea",
  "Legends & Lattes",
  "Before the Coffee Gets Cold",
  "The Secret History",
  "A Man Called Ove",
  "Anxious People",
  "The Maid",
  "Finlay Donovan Is Killing It",
  "Sadie",
  "The Cheerleaders"
];

/**
 * Extract intent and structured signals from user input
 */
export function extractIntent(query: string): ExtractedIntent {
  const q = query.trim();
  const lower = q.toLowerCase();

  const explicitAuthors: string[] = [];
  const explicitTitles: string[] = [];
  const explicitGenres: string[] = [];
  const explicitMoods: string[] = [];
  const explicitTropes: string[] = [];
  const modifiers: string[] = [];

  // Check if this is a follow-up request asking for "more"
  const isFollowUpMore = /\b(?:more\s+books?|give\s+me\s+more|another\s+(?:set|batch|list)|more\s+like|continue|next\s+books?)\b/i.test(lower);

  // 1. Detect Explicit Authors
  // A. Check against known authors dictionary
  for (const author of KNOWN_AUTHORS) {
    const authorLower = author.toLowerCase();
    const regex = new RegExp(`\\b${escapeRegExp(authorLower)}\\b`, "i");
    if (regex.test(lower)) {
      if (!explicitAuthors.includes(author)) {
        explicitAuthors.push(author);
      }
    }
  }

  // B. Pattern matching for authors: "by [Name]", "written by [Name]"
  const authorPatterns = [
    /(?:books?\s+by|novels?\s+by|works\s+of|written\s+by)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/g,
    /(?:author|writer)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/g,
  ];

  for (const pattern of authorPatterns) {
    let match;
    while ((match = pattern.exec(q)) !== null) {
      const candidate = match[1]?.trim();
      if (
        candidate &&
        candidate.split(/\s+/).length >= 2 &&
        !isExcludedAuthorCandidate(candidate) &&
        !explicitAuthors.some((a) => a.toLowerCase() === candidate.toLowerCase())
      ) {
        explicitAuthors.push(candidate);
      }
    }
  }

  // 2. Detect Explicit Book Titles & Reference Works
  // A. Check against known titles dictionary
  for (const title of KNOWN_TITLES) {
    const titleLower = title.toLowerCase();
    const regex = new RegExp(`\\b${escapeRegExp(titleLower)}\\b`, "i");
    if (regex.test(lower)) {
      if (!explicitTitles.includes(title)) {
        explicitTitles.push(title);
      }
    }
  }

  // B. Natural language similarity phrases:
  // "recommend me books similar to Harry Potter"
  // "books like Fourth Wing"
  // "something like The Silent Patient"
  // "give me more books like Harry Potter"
  const similarityPatterns = [
    /(?:books?\s+(?:similar\s+to|like|reminiscent\s+of|in\s+the\s+vein\s+of)|something\s+like|more\s+books?\s+like|recommend(?:\s+me)?\s+books?\s+like|recommend(?:\s+me)?\s+(?:something\s+)?similar\s+to|novels?\s+like|stories\s+like|if\s+i\s+(?:loved?|enjoyed?))\s+([A-Za-z0-9\s':\-]+?)(?:\s+(?:but|with|and|that|for|or|\.|\?|,|$)|$)/gi,
  ];

  for (const pattern of similarityPatterns) {
    let match;
    while ((match = pattern.exec(q)) !== null) {
      const raw = match[1]?.trim();
      if (!raw) continue;
      const clean = raw.replace(/^["“']|["”']$/g, "").trim();

      // Check if it's already an author or genre
      const isKnownAuthor = KNOWN_AUTHORS.some((a) => a.toLowerCase() === clean.toLowerCase());
      const isGenreWord = /^(?:fantasy|sci-fi|mystery|thriller|romance|horror|fiction|non-fiction|cozy|classics)$/i.test(clean);

      if (isKnownAuthor && !explicitAuthors.includes(clean)) {
        explicitAuthors.push(clean);
      } else if (!isKnownAuthor && !isGenreWord && clean.length >= 3) {
        if (!explicitTitles.some((t) => t.toLowerCase() === clean.toLowerCase())) {
          explicitTitles.push(clean);
        }
      }
    }
  }

  // C. Pattern matching for quoted books: "The Silent Patient", 'Harry Potter'
  const quoteMatches = q.match(/["“]([^"”]+)["”]|'([^']+)'/g);
  if (quoteMatches) {
    for (const quoted of quoteMatches) {
      const clean = quoted.replace(/^["“']|["”']$/g, "").trim();
      if (clean.length > 2 && !explicitTitles.includes(clean) && !explicitAuthors.includes(clean)) {
        explicitTitles.push(clean);
      }
    }
  }

  // 3. Detect Explicit Genres
  // CRITICAL: ONLY recognize genres when user requests them as a category.
  // Never treat sentiment words like "love" (e.g. "I love Holly Jackson") as a request for romance!
  if (/\b(?:fantasy|high\s+fantasy|epic\s+fantasy|urban\s+fantasy|magical\s+realism)\b/i.test(lower)) {
    explicitGenres.push("Fantasy");
  }
  if (/\b(?:sci-fi|science\s+fiction|space\s+opera|cyberpunk|dystopian?)\b/i.test(lower)) {
    explicitGenres.push("Sci-Fi");
  }
  if (/\b(?:mystery|whodunit|detective|investigation|crime\s+fiction|procedural)\b/i.test(lower)) {
    explicitGenres.push("Mystery");
  }
  if (/\b(?:thriller|psychological\s+thriller|suspense|domestic\s+thriller)\b/i.test(lower)) {
    explicitGenres.push("Thriller");
  }
  if (/\b(?:romance|romantic|love\s+story|rom-com)\b/i.test(lower)) {
    explicitGenres.push("Romance");
  }
  if (/\b(?:horror|spooky|gothic\s+horror|haunted)\b/i.test(lower)) {
    explicitGenres.push("Horror");
  }
  if (/\b(?:non-fiction|nonfiction|history|biography|memoir|self-help|psychology)\b/i.test(lower)) {
    explicitGenres.push("Non-Fiction");
  }
  if (/\b(?:classics?|literary\s+fiction|literature)\b/i.test(lower)) {
    explicitGenres.push("Classics");
  }
  if (/\b(?:ya|young\s+adult)\b/i.test(lower)) {
    explicitGenres.push("Young Adult");
  }

  // 4. Detect Explicit Moods
  if (/\b(?:cozy|heartwarming|wholesome|comforting|gentle)\b/i.test(lower)) {
    explicitMoods.push("Cozy");
  }
  if (/\b(?:dark|darker|gritty|moody|bleak|chilling)\b/i.test(lower)) {
    explicitMoods.push("Dark");
  }
  if (/\b(?:atmospheric|haunting|eerie|immersive)\b/i.test(lower)) {
    explicitMoods.push("Atmospheric");
  }
  if (/\b(?:fast-paced|page-turner|unputdownable|gripping|intense|high-stakes)\b/i.test(lower)) {
    explicitMoods.push("Fast-Paced");
  }
  if (/\b(?:emotional|heartbreaking|tearjerker|moving|poignant|sad)\b/i.test(lower)) {
    explicitMoods.push("Heartbreaking / Emotional");
  }
  if (/\b(?:mind-bending|twisty|unreliable\s+narrator|clever|intellectual)\b/i.test(lower)) {
    explicitMoods.push("Mind-Bending / Twisty");
  }
  if (/\b(?:lighthearted|funny|humorous|witty|fun)\b/i.test(lower)) {
    explicitMoods.push("Lighthearted / Witty");
  }

  // 5. Detect Explicit Tropes & Themes
  if (/\b(?:enemies\s+to\s+lovers|enemy\s+to\s+lover)\b/i.test(lower)) {
    explicitTropes.push("enemies to lovers");
  }
  if (/\b(?:found\s+family)\b/i.test(lower)) {
    explicitTropes.push("found family");
  }
  if (/\b(?:dark\s+academia)\b/i.test(lower)) {
    explicitTropes.push("dark academia");
  }
  if (/\b(?:fake\s+dating|fake\s+relationship)\b/i.test(lower)) {
    explicitTropes.push("fake dating");
  }
  if (/\b(?:heist|caper|criminal\s+crew)\b/i.test(lower)) {
    explicitTropes.push("heist");
  }
  if (/\b(?:forbidden\s+love|forbidden\s+romance)\b/i.test(lower)) {
    explicitTropes.push("forbidden love");
  }
  if (/\b(?:slow\s+burn)\b/i.test(lower)) {
    explicitTropes.push("slow burn");
  }
  if (/\b(?:chosen\s+one)\b/i.test(lower)) {
    explicitTropes.push("chosen one");
  }

  // 6. Detect Modifiers & Combinations
  if (/\b(?:more\s+romantic|something\s+romantic|with\s+romance|romantic\s+subplot|more\s+romance)\b/i.test(lower)) {
    modifiers.push("more romantic / with romance");
  }
  if (/\b(?:darker|more\s+dark|heavier)\b/i.test(lower)) {
    modifiers.push("darker");
  }
  if (/\b(?:cozier|more\s+cozy|lighter)\b/i.test(lower)) {
    modifiers.push("cozier / lighter");
  }
  if (/\b(?:faster|faster\s+paced|more\s+action)\b/i.test(lower)) {
    modifiers.push("faster-paced");
  }

  // 7. Resolve Reference Work Signals
  let referenceWork: ReferenceWorkSignals | undefined;
  for (const title of explicitTitles) {
    const norm = title.toLowerCase().replace(/['’]/g, "").trim();
    for (const [key, ref] of Object.entries(KNOWN_REFERENCE_SIGNALS)) {
      if (norm.includes(key) || key.includes(norm)) {
        referenceWork = ref;
        break;
      }
    }
    if (referenceWork) break;
  }

  if (!referenceWork && explicitTitles.length > 0) {
    referenceWork = {
      title: explicitTitles[0],
      signals: [
        ...explicitGenres.map((g) => g.toLowerCase()),
        ...explicitMoods.map((m) => m.toLowerCase()),
        ...explicitTropes,
        "style & tone",
        "reading experience",
      ],
    };
  }

  // 8. Classify Intent Types & Determine Primary Intent
  const intentTypes: IntentType[] = [];

  if (explicitTitles.length > 0) {
    intentTypes.push("book_similarity");
  }
  if (explicitAuthors.length > 0) {
    intentTypes.push("author_preference");
  }
  if (explicitTropes.length > 0) {
    intentTypes.push("trope_preference");
  }
  if (explicitGenres.length > 0) {
    intentTypes.push("genre_preference");
  }
  if (explicitMoods.length > 0) {
    intentTypes.push("mood_preference");
  }

  // Check if hybrid
  if (
    (explicitTitles.length > 0 && (modifiers.length > 0 || explicitGenres.length > 0 || explicitMoods.length > 0 || explicitTropes.length > 0)) ||
    (explicitAuthors.length > 0 && (modifiers.length > 0 || explicitGenres.length > 0 || explicitMoods.length > 0 || explicitTropes.length > 0)) ||
    (explicitAuthors.length > 1) ||
    (explicitTitles.length > 1) ||
    intentTypes.length > 1
  ) {
    intentTypes.unshift("hybrid");
  }

  const isVague =
    intentTypes.length === 0 &&
    (lower.length < 15 ||
      /\b(?:something\s+good|recommend\s+something|what\s+should\s+i\s+read|surprise\s+me|anything)\b/i.test(lower));

  if (isVague) {
    intentTypes.push("vague_discovery");
  }

  // Determine primary intent based on strict priority
  let primaryIntent: IntentType = "vague_discovery";
  if (intentTypes.includes("hybrid")) {
    primaryIntent = "hybrid";
  } else if (intentTypes.includes("book_similarity")) {
    primaryIntent = "book_similarity";
  } else if (intentTypes.includes("author_preference")) {
    primaryIntent = "author_preference";
  } else if (intentTypes.includes("trope_preference")) {
    primaryIntent = "trope_preference";
  } else if (intentTypes.includes("genre_preference")) {
    primaryIntent = "genre_preference";
  } else if (intentTypes.includes("mood_preference")) {
    primaryIntent = "mood_preference";
  }

  // Build human-readable summary
  const summaryParts: string[] = [];
  if (referenceWork) {
    summaryParts.push(`Reference Work: ${referenceWork.title} (${referenceWork.signals.slice(0, 4).join(", ")})`);
  } else if (explicitTitles.length > 0) {
    summaryParts.push(`Book: ${explicitTitles.join(", ")}`);
  }
  if (explicitAuthors.length > 0) {
    summaryParts.push(`Author: ${explicitAuthors.join(", ")}`);
  }
  if (explicitTropes.length > 0) {
    summaryParts.push(`Trope: ${explicitTropes.join(", ")}`);
  }
  if (explicitGenres.length > 0) {
    summaryParts.push(`Genre: ${explicitGenres.join(", ")}`);
  }
  if (explicitMoods.length > 0) {
    summaryParts.push(`Mood: ${explicitMoods.join(", ")}`);
  }
  if (modifiers.length > 0) {
    summaryParts.push(`Modifiers: ${modifiers.join(", ")}`);
  }

  const summary = summaryParts.length > 0 ? summaryParts.join(" | ") : "General Discovery";

  return {
    intentTypes,
    primaryIntent,
    explicitAuthors,
    explicitTitles,
    explicitGenres,
    explicitMoods,
    explicitTropes,
    modifiers,
    referenceWork,
    isFollowUpMore,
    isVague,
    rawQuery: q,
    summary,
  };
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isExcludedAuthorCandidate(word: string): boolean {
  const commonExclusions = [
    "New York",
    "United States",
    "Great Britain",
    "The Silent",
    "Good Girl",
    "Beach Read",
    "Science Fiction",
    "Dark Fantasy",
    "High Fantasy",
    "Something Dark",
    "Something Cozy",
    "Something Good",
    "More Romantic",
    "Harry Potter"
  ];
  return commonExclusions.some((exc) => exc.toLowerCase() === word.toLowerCase());
}
