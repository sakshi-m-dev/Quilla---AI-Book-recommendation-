import { StructuredQuery, QueryIntent } from "./types";

// Well-known book titles to recognize directly
const KNOWN_BOOKS: Array<{ title: string; matchers: RegExp[] }> = [
  { title: "Harry Potter", matchers: [/harry potter/i, /hogwarts/i] },
  { title: "Six of Crows", matchers: [/six of crows/i, /grishaverse/i] },
  { title: "Babel", matchers: [/\bbabel\b/i] },
  { title: "Atomic Habits", matchers: [/atomic habits/i] },
  { title: "A Good Girl's Guide to Murder", matchers: [/a good girl's guide to murder/i, /good girl's guide/i, /agggtm/i] },
  { title: "Percy Jackson", matchers: [/percy jackson/i, /lightning thief/i, /camp half-blood/i] },
  { title: "The Silent Patient", matchers: [/the silent patient/i] },
  { title: "Project Hail Mary", matchers: [/project hail mary/i] },
  { title: "The House in the Cerulean Sea", matchers: [/house in the cerulean sea/i, /cerulean sea/i] },
  { title: "Legends & Lattes", matchers: [/legends (?:and|&) lattes/i] },
  { title: "The Love Hypothesis", matchers: [/the love hypothesis/i] },
  { title: "Beach Read", matchers: [/beach read/i] },
  { title: "Book Lovers", matchers: [/book lovers/i] },
  { title: "The Seven Husbands of Evelyn Hugo", matchers: [/evelyn hugo/i] },
  { title: "Daisy Jones & The Six", matchers: [/daisy jones/i] },
  { title: "The Midnight Library", matchers: [/midnight library/i] },
  { title: "Dune", matchers: [/\bdune\b/i] },
  { title: "The Hunger Games", matchers: [/hunger games/i, /katniss/i] },
  { title: "The Song of Achilles", matchers: [/song of achilles/i] },
  { title: "The Maid", matchers: [/\bthe maid\b/i] },
  { title: "Verity", matchers: [/\bverity\b/i] },
  { title: "Normal People", matchers: [/normal people/i] },
  { title: "Deep Work", matchers: [/deep work/i] },
  { title: "The Psychology of Money", matchers: [/psychology of money/i] }
];

// Well-known authors to recognize directly
const KNOWN_AUTHORS: Array<{ author: string; matchers: RegExp[] }> = [
  { author: "Holly Jackson", matchers: [/holly jackson/i] },
  { author: "J.K. Rowling", matchers: [/j\.?\s*k\.?\s*rowling/i] },
  { author: "Emily Henry", matchers: [/emily henry/i] },
  { author: "Taylor Jenkins Reid", matchers: [/taylor jenkins reid/i, /\btjr\b/i] },
  { author: "Brandon Sanderson", matchers: [/brandon sanderson/i] },
  { author: "Colleen Hoover", matchers: [/colleen hoover/i, /\bcoho\b/i] },
  { author: "James Clear", matchers: [/james clear/i] },
  { author: "TJ Klune", matchers: [/t\.?\s*j\.?\s*klune/i] },
  { author: "Travis Baldree", matchers: [/travis baldree/i] },
  { author: "Ali Hazelwood", matchers: [/ali hazelwood/i] },
  { author: "Leigh Bardugo", matchers: [/leigh bardugo/i] },
  { author: "R.F. Kuang", matchers: [/r\.?\s*f\.?\s*kuang/i, /rebecca kuang/i] },
  { author: "Rick Riordan", matchers: [/rick riordan/i] },
  { author: "Lucy Foley", matchers: [/lucy foley/i] },
  { author: "Freida McFadden", matchers: [/freida mcfadden/i] },
  { author: "Karen M. McManus", matchers: [/karen m\.?\s*mcmanus/i, /mcmanus/i] },
  { author: "Matt Haig", matchers: [/matt haig/i] },
  { author: "Andy Weir", matchers: [/andy weir/i] },
  { author: "Blake Crouch", matchers: [/blake crouch/i] },
  { author: "Fredrik Backman", matchers: [/fredrik backman/i] },
  { author: "Sally Rooney", matchers: [/sally rooney/i] }
];

// Genre patterns mapping to canonical names
const GENRE_PATTERNS: Array<{ genre: string; patterns: RegExp[] }> = [
  {
    genre: "Romance",
    patterns: [
      /\bromance\b/i,
      /\brom-?com\b/i,
      /\bromantic\b/i,
      /\blove story\b/i,
      /\blove stories\b/i,
      /\bspicy romance\b/i,
      /\benemies to lovers\b/i,
      /\bfake dating\b/i
    ]
  },
  {
    genre: "Fantasy",
    patterns: [
      /\bfantasy\b/i,
      /\bmagical\b/i,
      /\bmagic\b/i,
      /\bwizard\b/i,
      /\bwitches\b/i,
      /\bhigh fantasy\b/i,
      /\burban fantasy\b/i,
      /\bepic fantasy\b/i,
      /\bcozy fantasy\b/i,
      /\bdragons\b/i,
      /\bfae\b/i,
      /\bsword and sorcery\b/i
    ]
  },
  {
    genre: "Self-Help",
    patterns: [
      /\bself-?help\b/i,
      /\bproductivity\b/i,
      /\bhabits\b/i,
      /\bpersonal development\b/i,
      /\bpersonal growth\b/i,
      /\bdiscipline\b/i,
      /\bfinancial literacy\b/i,
      /\bmindset\b/i,
      /\bnon-fiction\b/i,
      /\bnonfiction\b/i
    ]
  },
  {
    genre: "Mystery",
    patterns: [
      /\bmystery\b/i,
      /\bmysteries\b/i,
      /\bdetective\b/i,
      /\bwhodunit\b/i,
      /\bmurder mystery\b/i,
      /\bcrime\b/i,
      /\binvestigation\b/i
    ]
  },
  {
    genre: "Thriller",
    patterns: [
      /\bthriller\b/i,
      /\bpsychological thriller\b/i,
      /\bsuspense\b/i,
      /\btwists\b/i,
      /\bplot twist\b/i
    ]
  },
  {
    genre: "Science Fiction",
    patterns: [
      /\bsci-?fi\b/i,
      /\bscience fiction\b/i,
      /\bspace opera\b/i,
      /\bcyberpunk\b/i,
      /\balien\b/i,
      /\bspace exploration\b/i,
      /\bastrophysics\b/i
    ]
  },
  {
    genre: "Young Adult",
    patterns: [
      /\bya\b/i,
      /\byoung adult\b/i,
      /\bteen\b/i,
      /\bhigh school\b/i
    ]
  },
  {
    genre: "Historical Fiction",
    patterns: [
      /\bhistorical fiction\b/i,
      /\bhistorical\b/i,
      /\bwwii\b/i,
      /\bworld war\b/i,
      /\bvictorian\b/i
    ]
  },
  {
    genre: "Horror",
    patterns: [
      /\bhorror\b/i,
      /\bscary\b/i,
      /\bcreepy\b/i,
      /\bhaunted\b/i,
      /\bghosts?\b/i
    ]
  },
  {
    genre: "Literary Fiction",
    patterns: [
      /\bliterary\b/i,
      /\bliterary fiction\b/i,
      /\bcharacter-driven\b/i,
      /\bprose\b/i
    ]
  }
];

// Mood patterns
const MOOD_PATTERNS: Array<{ mood: string; patterns: RegExp[] }> = [
  {
    mood: "Cozy",
    patterns: [/\bcozy\b/i, /\bcosy\b/i, /\bgentle\b/i, /\bcomforting\b/i, /\bwarm\b/i, /\bpeaceful\b/i, /\blow[- ]stakes\b/i]
  },
  {
    mood: "Heartwarming",
    patterns: [/\bheartwarming\b/i, /\bwholesome\b/i, /\bfeel-?good\b/i, /\buplifting\b/i, /\bsweet\b/i]
  },
  {
    mood: "Dark",
    patterns: [/\bdark\b/i, /\bgritty\b/i, /\bbleak\b/i, /\bheavy\b/i, /\bgrotesque\b/i, /\bgothic\b/i]
  },
  {
    mood: "Intense",
    patterns: [/\bintense\b/i, /\bgripping\b/i, /\bedge of your seat\b/i, /\bunputdownable\b/i, /\bfast-?paced\b/i, /\bthrilling\b/i]
  },
  {
    mood: "Humorous",
    patterns: [/\bfunny\b/i, /\bhumorous\b/i, /\blaugh out loud\b/i, /\bwitty\b/i, /\bplayful\b/i, /\blighthearted\b/i]
  },
  {
    mood: "Emotional",
    patterns: [/\bemotional\b/i, /\btearjerker\b/i, /\bsad\b/i, /\bmake me cry\b/i, /\bbittersweet\b/i]
  },
  {
    mood: "Thought-Provoking",
    patterns: [/\bthought-?provoking\b/i, /\bdeep\b/i, /\bmind-?bending\b/i, /\bphilosophical\b/i, /\breflective\b/i]
  },
  {
    mood: "Atmospheric",
    patterns: [/\batmospheric\b/i, /\bmoody\b/i, /\bvibe\b/i, /\bimmersiv(e|ing)\b/i]
  }
];

// Theme patterns
const THEME_PATTERNS: Array<{ theme: string; patterns: RegExp[] }> = [
  { theme: "Magic School", patterns: [/magic school/i, /boarding school/i, /academy/i, /hogwarts/i] },
  { theme: "Enemies to Lovers", patterns: [/enemies to lovers/i, /rivals to lovers/i] },
  { theme: "Found Family", patterns: [/found family/i, /ragtag crew/i, /band of misfits/i] },
  { theme: "Heist", patterns: [/\bheist\b/i, /\bcrew\b/i, /\bcon artists?\b/i] },
  { theme: "Dark Academia", patterns: [/dark academia/i, /secret society/i, /ancient languages/i] },
  { theme: "Small Town", patterns: [/small town/i, /cozy town/i, /village/i] },
  { theme: "Underdog", patterns: [/underdog/i, /zero to hero/i, /chosen one/i] },
  { theme: "Habits & Routine", patterns: [/habits/i, /routine/i, /productivity/i, /focus/i] },
  { theme: "Grief & Healing", patterns: [/grief/i, /loss/i, /healing/i, /second chance/i] },
  { theme: "Survival", patterns: [/survival/i, /stranded/i, /apocalypse/i, /dystopia/i] }
];

// Atmosphere patterns
const ATMOSPHERE_PATTERNS: Array<{ atmosphere: string; patterns: RegExp[] }> = [
  { atmosphere: "Quiet Evening", patterns: [/quiet evening/i, /rainy day/i, /bedtime/i, /night/i] },
  { atmosphere: "Coffee Shop", patterns: [/coffee shop/i, /cafe/i, /bakery/i] },
  { atmosphere: "Autumn", patterns: [/autumn/i, /fall vibes/i, /october/i] },
  { atmosphere: "Winter", patterns: [/winter/i, /snow/i, /cold weather/i] },
  { atmosphere: "Summer", patterns: [/summer/i, /beach/i, /vacation/i] }
];

// Negative constraints patterns (e.g. "no romance", "not fantasy", "without magic")
const NEGATIVE_PATTERNS: Array<{ constraint: string; patterns: RegExp[] }> = [
  { constraint: "Romance", patterns: [/no romance/i, /without romance/i, /not romantic/i, /not a romance/i] },
  { constraint: "Fantasy", patterns: [/no fantasy/i, /not fantasy/i, /without magic/i, /no magic/i, /not magical/i] },
  { constraint: "Sci-Fi", patterns: [/no sci-?fi/i, /not sci-?fi/i, /no space/i] },
  { constraint: "Depressing", patterns: [/not depressing/i, /no sad endings?/i, /not dark/i, /not bleak/i, /no trauma/i] },
  { constraint: "Horror", patterns: [/no horror/i, /not scary/i, /not gory/i] },
  { constraint: "Self-Help", patterns: [/no self-?help/i, /not non-?fiction/i] }
];

/**
 * Robustly parses a user's natural language input into a StructuredQuery.
 */
export function parseUserQuery(rawInput: string): StructuredQuery {
  const query = (rawInput || "").trim();
  const lower = query.toLowerCase();

  // 1. Check for exploration of different things
  const is_exploration_different =
    /completely different/i.test(lower) ||
    /different from what i usually read/i.test(lower) ||
    /outside my comfort zone/i.test(lower) ||
    /something new and unexpected/i.test(lower) ||
    /branch out/i.test(lower) ||
    /surprise me with something different/i.test(lower);

  // 2. Check for followup more
  const is_followup_more =
    /more like this/i.test(lower) ||
    /give me more/i.test(lower) ||
    /another recommendation/i.test(lower) ||
    /more books/i.test(lower);

  // 3. Extract Reference Book
  let reference_book: string | null = null;
  for (const kb of KNOWN_BOOKS) {
    if (kb.matchers.some((m) => m.test(query))) {
      reference_book = kb.title;
      break;
    }
  }

  // If no known title matched, extract title following "similar to", "like", etc.
  if (!reference_book) {
    const simBookMatch = query.match(
      /(?:similar to|like|read-?alikes? for|if i (?:liked|loved))\s+["“']?([^"”'?.!,]+)["”']?/i
    );
    if (simBookMatch && simBookMatch[1]) {
      const candidate = simBookMatch[1].trim();
      // Only keep if candidate is not just a genre like "fantasy" or "romance"
      const isGenre = GENRE_PATTERNS.some((gp) => gp.patterns.some((p) => p.test(candidate)));
      if (!isGenre && candidate.length > 2 && candidate.length < 50) {
        reference_book = candidate;
      }
    }
  }

  // 4. Extract Reference Author
  let reference_author: string | null = null;
  for (const ka of KNOWN_AUTHORS) {
    if (ka.matchers.some((m) => m.test(query))) {
      reference_author = ka.author;
      break;
    }
  }

  // If reference_book was recognized as an author name, normalize it
  if (reference_book) {
    const matchingAuthor = KNOWN_AUTHORS.find((ka) =>
      ka.matchers.some((m) => m.test(reference_book!))
    );
    if (matchingAuthor) {
      reference_author = matchingAuthor.author;
      reference_book = null;
    }
  }

  // 5. Extract Explicit Genres
  const explicit_genres: string[] = [];
  for (const gp of GENRE_PATTERNS) {
    // If user said "books similar to Harry Potter", "Harry Potter" isn't a genre request itself,
    // though "fantasy books similar to Harry Potter" would include fantasy.
    if (gp.patterns.some((p) => p.test(query))) {
      // Special case: make sure we don't confuse "fantasy" if "cozy fantasy"
      if (!explicit_genres.includes(gp.genre)) {
        explicit_genres.push(gp.genre);
      }
    }
  }

  // 6. Extract Moods
  const moods: string[] = [];
  for (const mp of MOOD_PATTERNS) {
    if (mp.patterns.some((p) => p.test(query))) {
      if (!moods.includes(mp.mood)) {
        moods.push(mp.mood);
      }
    }
  }

  // 7. Extract Themes
  const themes: string[] = [];
  for (const tp of THEME_PATTERNS) {
    if (tp.patterns.some((p) => p.test(query))) {
      if (!themes.includes(tp.theme)) {
        themes.push(tp.theme);
      }
    }
  }

  // 8. Extract Atmosphere
  const atmosphere: string[] = [];
  for (const ap of ATMOSPHERE_PATTERNS) {
    if (ap.patterns.some((p) => p.test(query))) {
      if (!atmosphere.includes(ap.atmosphere)) {
        atmosphere.push(ap.atmosphere);
      }
    }
  }

  // 9. Extract Negative Constraints
  const negative_constraints: string[] = [];
  for (const np of NEGATIVE_PATTERNS) {
    if (np.patterns.some((p) => p.test(query))) {
      negative_constraints.push(np.constraint);
    }
  }

  // 10. Desired features (combined themes, atmospheres, keywords)
  const desired_features: string[] = [...moods, ...themes, ...atmosphere];

  // 11. Determine Intent
  let intent: QueryIntent = "recommendation";
  if (is_exploration_different) {
    intent = "explore_different";
  } else if (reference_author) {
    intent = "author_similarity";
  } else if (reference_book) {
    intent = "similarity";
  } else if (
    query.length < 5 ||
    /^(hi|hello|hey|yo|greetings|help|what can you do)\b/i.test(query)
  ) {
    intent = "vague";
  }

  return {
    raw_query: query,
    intent,
    explicit_genres,
    moods,
    themes,
    atmosphere,
    reference_book,
    reference_author,
    desired_features,
    negative_constraints,
    is_exploration_different,
    is_followup_more
  };
}
