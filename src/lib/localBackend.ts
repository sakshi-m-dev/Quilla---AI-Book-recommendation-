// Local Database and Authentication Fallback Engine
import { extractIntent } from "./intentExtractor";
import { generateUniversalBookRecommendation } from "./universalBookEngine";
import { runRecommendationPipeline } from "./recommendation/pipeline";

export interface LocalUser {
  id: string;
  email: string;
  created_at: string;
}

export interface LocalSession {
  user: LocalUser;
  access_token: string;
  expires_at: number;
}

export interface LocalConversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface LocalMessage {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

const STORAGE_KEYS = {
  USERS: "quilla_users",
  SESSION: "quilla_session",
  CONVERSATIONS: "quilla_conversations",
  MESSAGES: "quilla_messages",
  TBR_BOOKS: "quilla_tbr_books",
};

export interface TBRBook {
  id: string;
  userId: string;
  title: string;
  author: string;
  genre: string;
  rating: number | null; // 1-5, null = unrated
  addedAt: string;
}

// In-memory fallback store for Node.js / SSR environments
const memoryStore = new Map<string, string>();

// Helper utilities for storage
const getItem = <T>(key: string, defaultValue: T): T => {
  try {
    if (typeof localStorage !== "undefined") {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    }
    const mem = memoryStore.get(key);
    return mem ? JSON.parse(mem) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
};

const setItem = <T>(key: string, value: T): void => {
  try {
    const serialized = JSON.stringify(value);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(key, serialized);
    }
    memoryStore.set(key, serialized);
  } catch (e) {
    console.error("Failed to write to storage", e);
  }
};

// -------------------------------------------------------------
// LOCAL AUTH SERVICE
// -------------------------------------------------------------
export const localAuth = {
  getCurrentSession: (): LocalSession | null => {
    const session = getItem<LocalSession | null>(STORAGE_KEYS.SESSION, null);
    if (session && session.expires_at > Date.now()) {
      return session;
    }
    if (session) {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
    }
    return null;
  },

  signUp: async (email: string, password: string): Promise<{ user: LocalUser | null; error: Error | null }> => {
    const users = getItem<Array<LocalUser & { password: string }>>(STORAGE_KEYS.USERS, []);
    const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    
    if (existing) {
      return { user: null, error: new Error("User already registered. Please login instead.") };
    }

    const newUser: LocalUser & { password: string } = {
      id: "user_" + Math.random().toString(36).substr(2, 9),
      email,
      password,
      created_at: new Date().toISOString(),
    };

    users.push(newUser);
    setItem(STORAGE_KEYS.USERS, users);

    // Auto sign in
    const session: LocalSession = {
      user: { id: newUser.id, email: newUser.email, created_at: newUser.created_at },
      access_token: "local_token_" + Date.now(),
      expires_at: Date.now() + 30 * 24 * 60 * 60 * 1000,
    };
    setItem(STORAGE_KEYS.SESSION, session);

    return { user: session.user, error: null };
  },

  signIn: async (email: string, password: string): Promise<{ session: LocalSession | null; error: Error | null }> => {
    const users = getItem<Array<LocalUser & { password: string }>>(STORAGE_KEYS.USERS, []);
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);

    if (!user) {
      return { session: null, error: new Error("Invalid email or password. Please check your credentials.") };
    }

    const session: LocalSession = {
      user: { id: user.id, email: user.email, created_at: user.created_at },
      access_token: "local_token_" + Date.now(),
      expires_at: Date.now() + 30 * 24 * 60 * 60 * 1000,
    };
    setItem(STORAGE_KEYS.SESSION, session);

    return { session, error: null };
  },

  signOut: async (): Promise<void> => {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  },
};

// -------------------------------------------------------------
// LOCAL DATABASE SERVICE
// -------------------------------------------------------------
export const localDb = {
  createConversation: async (userId: string, title = "New Chat"): Promise<LocalConversation> => {
    const convs = getItem<LocalConversation[]>(STORAGE_KEYS.CONVERSATIONS, []);
    const newConv: LocalConversation = {
      id: "conv_" + Math.random().toString(36).substr(2, 9),
      user_id: userId,
      title,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    convs.unshift(newConv);
    setItem(STORAGE_KEYS.CONVERSATIONS, convs);
    return newConv;
  },

  getConversations: async (userId: string): Promise<LocalConversation[]> => {
    const convs = getItem<LocalConversation[]>(STORAGE_KEYS.CONVERSATIONS, []);
    return convs
      .filter((c) => c.user_id === userId)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  },

  updateConversationTitle: async (convId: string, title: string): Promise<boolean> => {
    const convs = getItem<LocalConversation[]>(STORAGE_KEYS.CONVERSATIONS, []);
    const idx = convs.findIndex((c) => c.id === convId);
    if (idx !== -1) {
      convs[idx].title = title;
      convs[idx].updated_at = new Date().toISOString();
      setItem(STORAGE_KEYS.CONVERSATIONS, convs);
      return true;
    }
    return false;
  },

  deleteConversation: async (convId: string): Promise<boolean> => {
    const convs = getItem<LocalConversation[]>(STORAGE_KEYS.CONVERSATIONS, []);
    const filteredConvs = convs.filter((c) => c.id !== convId);
    setItem(STORAGE_KEYS.CONVERSATIONS, filteredConvs);

    const msgs = getItem<LocalMessage[]>(STORAGE_KEYS.MESSAGES, []);
    const filteredMsgs = msgs.filter((m) => m.conversation_id !== convId);
    setItem(STORAGE_KEYS.MESSAGES, filteredMsgs);
    return true;
  },

  getMessages: async (convId: string): Promise<LocalMessage[]> => {
    const msgs = getItem<LocalMessage[]>(STORAGE_KEYS.MESSAGES, []);
    return msgs
      .filter((m) => m.conversation_id === convId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  },

  addMessage: async (convId: string, role: "user" | "assistant", content: string): Promise<LocalMessage> => {
    const msgs = getItem<LocalMessage[]>(STORAGE_KEYS.MESSAGES, []);
    const newMsg: LocalMessage = {
      id: "msg_" + Math.random().toString(36).substr(2, 9),
      conversation_id: convId,
      role,
      content,
      created_at: new Date().toISOString(),
    };
    msgs.push(newMsg);
    setItem(STORAGE_KEYS.MESSAGES, msgs);

    // Update conversation updated_at & title if first user message
    const convs = getItem<LocalConversation[]>(STORAGE_KEYS.CONVERSATIONS, []);
    const convIndex = convs.findIndex((c) => c.id === convId);
    if (convIndex !== -1) {
      convs[convIndex].updated_at = new Date().toISOString();
      const convMsgs = msgs.filter((m) => m.conversation_id === convId);
      if (role === "user" && convMsgs.length <= 1) {
        convs[convIndex].title = content.slice(0, 45) + (content.length > 45 ? "..." : "");
      }
      setItem(STORAGE_KEYS.CONVERSATIONS, convs);
    }

    return newMsg;
  },
};

// -------------------------------------------------------------
// TBR (TO BE READ) DATABASE SERVICE
// -------------------------------------------------------------
export const tbrDb = {
  addBook: (userId: string, book: Omit<TBRBook, "id" | "userId" | "addedAt" | "rating">): TBRBook => {
    const books = getItem<TBRBook[]>(STORAGE_KEYS.TBR_BOOKS, []);
    // Avoid exact duplicates by title+author
    const exists = books.find(
      (b) => b.title.toLowerCase() === book.title.toLowerCase() && b.userId === userId
    );
    if (exists) return exists;
    const newBook: TBRBook = {
      id: "tbr_" + Math.random().toString(36).substr(2, 9),
      userId,
      rating: null,
      addedAt: new Date().toISOString(),
      ...book,
    };
    books.unshift(newBook);
    setItem(STORAGE_KEYS.TBR_BOOKS, books);
    return newBook;
  },

  getBooks: (userId: string): TBRBook[] => {
    const books = getItem<TBRBook[]>(STORAGE_KEYS.TBR_BOOKS, []);
    return books.filter((b) => b.userId === userId).sort(
      (a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
    );
  },

  rateBook: (id: string, rating: number): boolean => {
    const books = getItem<TBRBook[]>(STORAGE_KEYS.TBR_BOOKS, []);
    const idx = books.findIndex((b) => b.id === id);
    if (idx === -1) return false;
    books[idx].rating = rating;
    setItem(STORAGE_KEYS.TBR_BOOKS, books);
    return true;
  },

  removeBook: (id: string): boolean => {
    const books = getItem<TBRBook[]>(STORAGE_KEYS.TBR_BOOKS, []);
    const filtered = books.filter((b) => b.id !== id);
    setItem(STORAGE_KEYS.TBR_BOOKS, filtered);
    return true;
  },

  // Returns a ratings context string to inject into AI prompts
  getRatingsContext: (userId: string): string => {
    const books = getItem<TBRBook[]>(STORAGE_KEYS.TBR_BOOKS, []).filter(
      (b) => b.userId === userId && b.rating !== null
    );
    if (books.length === 0) return "";

    const ratingStars = (r: number) => "★".repeat(r) + "☆".repeat(5 - r);
    const lines = books.map((b) => `"${b.title}" by ${b.author} ${ratingStars(b.rating!)} (${b.genre})`);

    const highRated = books.filter((b) => b.rating! >= 4);
    const lowRated  = books.filter((b) => b.rating! <= 2);

    let context = `The user has rated these books: ${lines.join(", ")}.`;
    if (highRated.length > 0) {
      const genres = [...new Set(highRated.map((b) => b.genre))];
      context += ` They loved books in these genres: ${genres.join(", ")} — lean into these styles.`;
    }
    if (lowRated.length > 0) {
      const titles = lowRated.map((b) => b.title).join(", ");
      context += ` They didn't enjoy: ${titles} — avoid recommending similar books.`;
    }
    return context;
  },
};

// -------------------------------------------------------------
// DYNAMIC AI BOOK RECOMMENDATION GENERATOR
// Intent-driven, author-aware, candidate-ranked, personalized, and non-repetitive
// -------------------------------------------------------------

export interface CandidateBook {
  title: string;
  author: string;
  year: number | string;
  genre: string;
  tags: string[];
  moods: string[];
  tropes: string[];
  referenceMatches: string[];
  description: string;
}

export const BOOK_CATALOG: CandidateBook[] = [
  // ── 1. HARRY POTTER READ-ALIKES / MAGICAL SCHOOLS / COMING-OF-AGE ────
  {
    title: "Percy Jackson & the Olympians: The Lightning Thief",
    author: "Rick Riordan",
    year: 2005,
    genre: "Fantasy",
    tags: ["Mythology", "Demigods", "Quests", "Friendship"],
    moods: ["Fast-Paced", "Lighthearted / Witty"],
    tropes: ["found family", "chosen one"],
    referenceMatches: ["harry potter", "percy jackson"],
    description: "Like Harry Potter, an overlooked boy discovers an extraordinary hidden world of gods, monsters, and ancient prophecies. Packed with laugh-out-loud snark, unbreakable trio friendships, and mythical quests."
  },
  {
    title: "Nevermoor: The Trials of Morrigan Crow",
    author: "Jessica Townsend",
    year: 2017,
    genre: "Fantasy",
    tags: ["Magical World", "Whimsical", "Trials", "Found Family"],
    moods: ["Cozy", "Atmospheric", "Lighthearted / Witty"],
    tropes: ["found family"],
    referenceMatches: ["harry potter"],
    description: "Captures the wondrous, whimsical magic of entering Diagon Alley for the first time. An outcast cursed girl escapes into a breathtaking hidden city and competes for entry into an elite society."
  },
  {
    title: "A Deadly Education",
    author: "Naomi Novik",
    year: 2020,
    genre: "Fantasy",
    tags: ["Magic Academy", "Dark Academia", "Survival", "High Stakes"],
    moods: ["Dark", "Fast-Paced", "Atmospheric"],
    tropes: ["dark academia"],
    referenceMatches: ["harry potter", "the scholomance"],
    description: "A thrilling, darker evolution of the wizarding boarding school. Inside the Scholomance, there are no teachers and the school itself breeds deadly monsters — surviving to graduation requires fierce alliances and immense grit."
  },
  {
    title: "The Magicians",
    author: "Lev Grossman",
    year: 2009,
    genre: "Fantasy",
    tags: ["Magic College", "Dark Fantasy", "Portal Fantasy", "Literary"],
    moods: ["Dark", "Atmospheric", "Mind-Bending / Twisty"],
    tropes: ["dark academia"],
    referenceMatches: ["harry potter"],
    description: "A collegiate, psychological spin on magical schooling. Restless math prodigy Quentin Coldwater gains entry into an exclusive secret college for real magic, only to discover childhood fantasy wonder carries perilous, complex consequences."
  },
  {
    title: "Children of Blood and Bone",
    author: "Tomi Adeyemi",
    year: 2018,
    genre: "Fantasy",
    tags: ["West African Fantasy", "High Stakes", "Magic System", "Rebellion"],
    moods: ["Fast-Paced", "Heartbreaking / Emotional"],
    tropes: ["enemies to lovers"],
    referenceMatches: ["harry potter"],
    description: "High-stakes West African-inspired fantasy delivering Harry Potter's epic battle against tyranny. Zélie fights to strike back against a ruthless monarchy and bring magic back to Orïsha."
  },
  {
    title: "Skandar and the Unicorn Thief",
    author: "A.F. Steadman",
    year: 2022,
    genre: "Fantasy",
    tags: ["Fierce Unicorns", "Elemental Magic", "Island Academy", "Quests"],
    moods: ["Fast-Paced", "Atmospheric"],
    tropes: ["found family", "chosen one"],
    referenceMatches: ["harry potter"],
    description: "Ferocious winged elemental unicorns, bonded riders, and an island boarding school. Offers the pure adrenaline of discovery, fierce loyalty, and secret ancient magic that made Hogwarts so irresistible."
  },
  {
    title: "Amari and the Night Brothers",
    author: "B.B. Alston",
    year: 2021,
    genre: "Fantasy",
    tags: ["Secret Bureau", "Supernatural Trials", "Mystery", "Urban Fantasy"],
    moods: ["Fast-Paced", "Lighthearted / Witty"],
    tropes: ["found family"],
    referenceMatches: ["harry potter"],
    description: "An Atlanta girl searching for her missing brother uncovers the top-secret Bureau of Supernatural Affairs. Bursting with magical tryouts, alien and wizard colleagues, and empowering heart."
  },
  {
    title: "Carry On",
    author: "Rainbow Rowell",
    year: 2015,
    genre: "Fantasy",
    tags: ["Wizarding School", "Banter", "Magic Spells", "LGBTQ+"],
    moods: ["Lighthearted / Witty", "Cozy"],
    tropes: ["enemies to lovers", "chosen one"],
    referenceMatches: ["harry potter"],
    description: "Simon Snow is the prophesied chosen one at the Watford School of Magicks, but his infuriating vampire roommate Baz complicates everything. Delivers witty dialogue, spellcasting charm, and rich boarding school nostalgia."
  },
  {
    title: "A Wizard of Earthsea",
    author: "Ursula K. Le Guin",
    year: 1968,
    genre: "Fantasy",
    tags: ["Classics", "Wizard School of Roke", "True Names", "Philosophy"],
    moods: ["Atmospheric", "Mind-Bending / Twisty"],
    tropes: ["chosen one"],
    referenceMatches: ["harry potter"],
    description: "The foundational classic of wizard schools. Young Ged studies at the school of Roke, but his arrogance releases a terrifying shadow. A profound meditation on balance, magic, and self-knowledge."
  },
  {
    title: "The Golden Compass",
    author: "Philip Pullman",
    year: 1995,
    genre: "Fantasy",
    tags: ["Daemons", "Parallel Worlds", "Oxford", "Epic Adventure"],
    moods: ["Atmospheric", "Fast-Paced"],
    tropes: ["found family"],
    referenceMatches: ["harry potter"],
    description: "Lyra Belacqua journeys from collegiate Oxford to the frozen Arctic to save kidnapped children alongside armored polar bears and aeronauts. A masterclass in magical world-building and moral courage."
  },

  // ── 2. HOLLY JACKSON & YA INVESTIGATIVE MYSTERIES / THRILLERS ────────
  {
    title: "A Good Girl's Guide to Murder",
    author: "Holly Jackson",
    year: 2019,
    genre: "Mystery",
    tags: ["True Crime", "High School Sleuth", "Podcasts", "Twists"],
    moods: ["Fast-Paced", "Mind-Bending / Twisty"],
    tropes: ["enemies to lovers"],
    referenceMatches: ["a good girl's guide to murder"],
    description: "Pip Fitz-Amobi re-examines a closed small-town murder case as her senior project. Interviews, text transcripts, secret audio logs, and an electric investigative chemistry with Ravi Singh."
  },
  {
    title: "The Naturals",
    author: "Jennifer Lynn Barnes",
    year: 2013,
    genre: "Mystery",
    tags: ["FBI Cold Cases", "Psychological Profiling", "Gifted Teens", "Twists"],
    moods: ["Fast-Paced", "Mind-Bending / Twisty"],
    tropes: ["found family"],
    referenceMatches: ["the naturals"],
    description: "Gifted teenagers with innate profiling and lie-detection skills recruited into an elite FBI cold-case division. Delivers Holly Jackson's high-octane investigative plotting with romantic tension."
  },
  {
    title: "Truly Devious",
    author: "Maureen Johnson",
    year: 2018,
    genre: "Mystery",
    tags: ["Boarding School", "Cold Case", "Puzzle Mystery", "Sherlockian"],
    moods: ["Atmospheric", "Mind-Bending / Twisty"],
    tropes: ["dark academia"],
    referenceMatches: ["truly devious"],
    description: "Stevie Bell enters an eccentric Vermont boarding school determined to solve a famous 1930s kidnapping, only for fresh murders to ignite. Intricate clues, witty banter, and atmospheric deduction."
  },
  {
    title: "One of Us Is Lying",
    author: "Karen M. McManus",
    year: 2017,
    genre: "Mystery",
    tags: ["Detention Murder", "Gossip App", "Multi-POV", "High School Secrets"],
    moods: ["Fast-Paced", "Mind-Bending / Twisty"],
    tropes: ["enemies to lovers"],
    referenceMatches: ["one of us is lying"],
    description: "The Breakfast Club meets Agatha Christie. Five high schoolers walk into detention, but only four walk out alive after a notorious school gossip is poisoned. Fast-paced and twist-packed."
  },
  {
    title: "Sadie",
    author: "Courtney Summers",
    year: 2018,
    genre: "Thriller",
    tags: ["Missing Persons", "True Crime Podcast", "Dark & Raw", "Sisters"],
    moods: ["Dark", "Heartbreaking / Emotional"],
    tropes: [],
    referenceMatches: ["sadie"],
    description: "A fierce older sister hunts her sister's killer across rural motels while a podcast radio host retraces her path. Raw, unapologetic, and much darker than standard YA mysteries."
  },
  {
    title: "The Cheerleaders",
    author: "Kara Thomas",
    year: 2018,
    genre: "Mystery",
    tags: ["Small Town Secrets", "Cold Case", "Cynical", "Chilling"],
    moods: ["Dark", "Fast-Paced"],
    tropes: [],
    referenceMatches: ["the cheerleaders"],
    description: "Five years after brutal tragedies dismantled Sunnybrook's varsity squad, new clues emerge that the killer was never caught. Bleak, atmospheric, and relentlessly suspenseful."
  },
  {
    title: "None Shall Sleep",
    author: "Ellie Marney",
    year: 2020,
    genre: "Thriller",
    tags: ["FBI Interrogations", "Serial Killers", "Silence of the Lambs YA", "Psychological"],
    moods: ["Dark", "Mind-Bending / Twisty", "Fast-Paced"],
    tropes: [],
    referenceMatches: ["none shall sleep"],
    description: "Two trauma-surviving teens are enlisted by the FBI to interview imprisoned juvenile serial killers. A terrifying psychological high-wire act with sharp mind games."
  },
  {
    title: "Five Survive",
    author: "Holly Jackson",
    year: 2022,
    genre: "Thriller",
    tags: ["Locked Room RV", "Sniper", "Ticking Clock", "Secrets"],
    moods: ["Fast-Paced", "Dark"],
    tropes: [],
    referenceMatches: ["five survive"],
    description: "Six friends stranded in an RV on a pitch-black deserted road with a sniper demanding one fatal secret. An eight-hour claustrophobic survival nightmare that never lets you breathe."
  },

  // ── 3. THE SILENT PATIENT & PSYCHOLOGICAL THRILLERS ──────────────────
  {
    title: "The Silent Patient",
    author: "Alex Michaelides",
    year: 2019,
    genre: "Thriller",
    tags: ["Psychological", "Unreliable Narrator", "Clinical Obsession", "Twists"],
    moods: ["Dark", "Mind-Bending / Twisty"],
    tropes: [],
    referenceMatches: ["the silent patient"],
    description: "A celebrated painter shoots her husband five times and never utters another word. A criminal psychotherapist becomes fatally obsessed with unlocking her silence before a staggering final revelation."
  },
  {
    title: "The Maidens",
    author: "Alex Michaelides",
    year: 2021,
    genre: "Mystery",
    tags: ["Cambridge University", "Greek Tragedy", "Secret Societies", "Academic"],
    moods: ["Dark", "Atmospheric"],
    tropes: ["dark academia"],
    referenceMatches: ["the silent patient", "the maidens"],
    description: "A group psychotherapist investigates a string of murders among an exclusive group of female students at Cambridge University. Steeped in Greek tragedy, obsession, and mythic suspense."
  },
  {
    title: "The Woman in the Window",
    author: "A.J. Finn",
    year: 2018,
    genre: "Thriller",
    tags: ["Agoraphobia", "Hitchcockian", "Unreliable Memory", "Domestic"],
    moods: ["Dark", "Mind-Bending / Twisty"],
    tropes: [],
    referenceMatches: ["the silent patient"],
    description: "An agoraphobic child psychologist trapped in her Harlem brownstone watches her neighbors and witnesses something terrible — or did she? Claustrophobic dread and unreliable narration."
  },
  {
    title: "Behind Closed Doors",
    author: "B.A. Paris",
    year: 2016,
    genre: "Thriller",
    tags: ["Domestic Nightmare", "Chilling Control", "Psychological Trap", "Tension"],
    moods: ["Dark", "Fast-Paced"],
    tropes: [],
    referenceMatches: ["the silent patient"],
    description: "The seemingly perfect, fairytale marriage reveals a calculated, terrifying nightmare behind locked doors. Breathless, claustrophobic psychological suspense."
  },
  {
    title: "Rock Paper Scissors",
    author: "Alice Feeney",
    year: 2021,
    genre: "Thriller",
    tags: ["Scottish Chapel", "Anniversary Letters", "Twists", "Unreliable"],
    moods: ["Atmospheric", "Mind-Bending / Twisty"],
    tropes: [],
    referenceMatches: ["the silent patient"],
    description: "A troubled couple wins a weekend retreat to an isolated chapel in Scotland. Featuring ten years of hidden anniversary letters and a narrative twist that completely upends reality."
  },
  {
    title: "The Guest List",
    author: "Lucy Foley",
    year: 2020,
    genre: "Mystery",
    tags: ["Island Wedding", "Locked Room", "Storm", "Dark Secrets"],
    moods: ["Atmospheric", "Mind-Bending / Twisty"],
    tropes: [],
    referenceMatches: ["the silent patient"],
    description: "A celebrity wedding on a storm-lashed Irish island turns deadly as resentments explode. Multi-POV whodunit where everyone has a motive and a buried past."
  },
  {
    title: "Gone Girl",
    author: "Gillian Flynn",
    year: 2012,
    genre: "Thriller",
    tags: ["Toxic Marriage", "Media Circus", "Dueling Narrators", "Masterpiece"],
    moods: ["Dark", "Mind-Bending / Twisty"],
    tropes: ["enemies to lovers"],
    referenceMatches: ["the silent patient", "gone girl"],
    description: "The gold standard for unreliable narrators and psychological revenge. On their fifth anniversary, Amy disappears and Nick becomes the prime suspect in a razor-sharp game of deceit."
  },
  {
    title: "Verity",
    author: "Colleen Hoover",
    year: 2018,
    genre: "Thriller",
    tags: ["Disturbing Manuscript", "Dark Obsession", "Isolated Estate", "Romantic Suspense"],
    moods: ["Dark", "Mind-Bending / Twisty"],
    tropes: ["forbidden love"],
    referenceMatches: ["verity", "the silent patient"],
    description: "A struggling writer is hired to finish a crippled author's hit series and uncovers a horrifying, confessional autobiography hidden in the estate. Morally twisted and shockingly addictive."
  },

  // ── 4. FOURTH WING, ROMANTASY & ENEMIES TO LOVERS ────────────────────
  {
    title: "Fourth Wing",
    author: "Rebecca Yarros",
    year: 2023,
    genre: "Fantasy",
    tags: ["Dragon Riders", "War College", "Deadly Trials", "Romantasy"],
    moods: ["Fast-Paced", "Atmospheric"],
    tropes: ["enemies to lovers", "forbidden love"],
    referenceMatches: ["fourth wing"],
    description: "Twenty-year-old Violet Sorrengail is ordered into the lethal Riders Quadrant where cadets bond dragons or die trying. Sizzling enemies-to-lovers tension, high body counts, and high-flying danger."
  },
  {
    title: "The Cruel Prince",
    author: "Holly Black",
    year: 2018,
    genre: "Fantasy",
    tags: ["Fae Court Politics", "Mortal Ambition", "Lethal Intrigue", "Enemies to Lovers"],
    moods: ["Dark", "Mind-Bending / Twisty"],
    tropes: ["enemies to lovers"],
    referenceMatches: ["fourth wing", "a court of thorns and roses"],
    description: "A mortal girl raised in the treacherous high court of Elfhame matches blades, wits, and vicious political maneuvers against the cruel prince Cardan. Sharp, vicious, and intoxicating."
  },
  {
    title: "A Court of Thorns and Roses",
    author: "Sarah J. Maas",
    year: 2015,
    genre: "Fantasy",
    tags: ["Fae Realms", "High Fantasy", "Slow Burn", "Court Politics"],
    moods: ["Atmospheric", "Fast-Paced"],
    tropes: ["enemies to lovers", "found family"],
    referenceMatches: ["fourth wing", "a court of thorns and roses", "acotar"],
    description: "Mortal huntress Feyre kills a faerie wolf and is dragged across the wall into the magical realm of Prythian. High stakes, ancient curses, and slow-burn enemies-to-lovers romance."
  },
  {
    title: "Six of Crows",
    author: "Leigh Bardugo",
    year: 2015,
    genre: "Fantasy",
    tags: ["Impossible Heist", "Criminal Crew", "Found Family", "Morally Gray"],
    moods: ["Fast-Paced", "Dark"],
    tropes: ["found family", "heist", "enemies to lovers"],
    referenceMatches: ["six of crows", "fourth wing"],
    description: "Six dangerous outcasts attempt an impossible heist inside an impenetrable military fortress. Legendary banter, deep emotional scars, and the greatest found-family crew in modern fantasy."
  },
  {
    title: "The Serpent and the Wings of Night",
    author: "Carissa Broadbent",
    year: 2022,
    genre: "Fantasy",
    tags: ["Vampire Tournament", "Gladiatorial", "Deadly Romance", "High Stakes"],
    moods: ["Dark", "Fast-Paced"],
    tropes: ["enemies to lovers", "forbidden love"],
    referenceMatches: ["fourth wing", "the hunger games"],
    description: "An adopted human daughter of a vampire king enters the Kejari — a lethal tournament held by the goddess of death. Visceral combat, survival stakes, and sizzling enemies-to-lovers passion."
  },
  {
    title: "The Hunger Games",
    author: "Suzanne Collins",
    year: 2008,
    genre: "Sci-Fi",
    tags: ["Dystopian Arena", "Survival", "Rebellion", "High Tension"],
    moods: ["Fast-Paced", "Heartbreaking / Emotional"],
    tropes: [],
    referenceMatches: ["the hunger games", "fourth wing"],
    description: "Katniss Everdeen volunteers for a televised fight to the death in a post-apocalyptic arena. The gold standard for relentless survival stakes, moral choices, and rebellion."
  },

  // ── 5. COZY FANTASY & COMFORTING READS ───────────────────────────────
  {
    title: "Legends & Lattes",
    author: "Travis Baldree",
    year: 2022,
    genre: "Fantasy",
    tags: ["Cozy Fantasy", "Coffee Shop", "Found Family", "Low Stakes"],
    moods: ["Cozy", "Lighthearted / Witty"],
    tropes: ["found family", "slow burn"],
    referenceMatches: ["legends & lattes"],
    description: "A battle-weary orc barbarian hangs up her sword to open the first espresso shop in a fantasy metropolis. Warm cinnamon rolls, gentle community bonds, and absolute comforting tranquility."
  },
  {
    title: "The House in the Cerulean Sea",
    author: "TJ Klune",
    year: 2020,
    genre: "Fantasy",
    tags: ["Magical Orphanage", "Island Sanctuary", "Found Family", "Pure Joy"],
    moods: ["Cozy", "Lighthearted / Witty"],
    tropes: ["found family"],
    referenceMatches: ["the house in the cerulean sea"],
    description: "A by-the-book caseworker visits a classified island orphanage for extraordinary youth and discovers profound warmth, acceptance, and an eccentric found family. Like a warm hug in book form."
  },
  {
    title: "A Psalm for the Wild-Built",
    author: "Becky Chambers",
    year: 2021,
    genre: "Sci-Fi",
    tags: ["Hopepunk", "Solarpunk", "Tea Monk & Robot", "Gentle Philosophy"],
    moods: ["Cozy", "Atmospheric"],
    tropes: ["found family"],
    referenceMatches: ["a psalm for the wild-built"],
    description: "A restless tea monk wanders wilderness trails and meets a sentient wild robot who asks: 'What do humans need?' Tender, gentle, and deeply restorative reading."
  },
  {
    title: "Before the Coffee Gets Cold",
    author: "Toshikazu Kawaguchi",
    year: 2015,
    genre: "Fantasy",
    tags: ["Time Travel Cafe", "Tokyo", "Reflective", "Heartwarming"],
    moods: ["Cozy", "Heartbreaking / Emotional"],
    tropes: [],
    referenceMatches: ["before the coffee gets cold"],
    description: "In a quiet Tokyo basement cafe, patrons can travel back in time to revisit a pivotal moment — provided they return before their cup grows cold. Wistful, touching, and comforting."
  },
  {
    title: "The Very Secret Society of Irregular Witches",
    author: "Sangu Mandanna",
    year: 2022,
    genre: "Fantasy",
    tags: ["Cozy Witches", "Sanctuary Estate", "Found Family", "Romantic"],
    moods: ["Cozy", "Lighthearted / Witty"],
    tropes: ["found family", "slow burn"],
    referenceMatches: ["the very secret society of irregular witches"],
    description: "A solitary witch takes an unexpected invitation to tutor three chaotic young magical orphans at a secluded manor. Pure comfort, delightful found-family mischief, and sweet romance."
  },

  // ── 6. HEARTBREAKING & EMOTIONALLY MOVING READS ──────────────────────
  {
    title: "The Song of Achilles",
    author: "Madeline Miller",
    year: 2011,
    genre: "Fantasy",
    tags: ["Greek Myth", "Achilles & Patroclus", "Lyrical Prose", "Heartbreaking"],
    moods: ["Heartbreaking / Emotional", "Atmospheric"],
    tropes: ["found family"],
    referenceMatches: ["the song of achilles"],
    description: "The Trojan War recounted through the profound, luminous bond between Achilles and Patroclus. Lyrical, heartbreaking, and an unforgettable tribute to enduring love."
  },
  {
    title: "A Little Life",
    author: "Hanya Yanagihara",
    year: 2015,
    genre: "Classics",
    tags: ["Enduring Friendship", "New York City", "Trauma & Grace", "Devastating"],
    moods: ["Heartbreaking / Emotional", "Dark"],
    tropes: ["found family"],
    referenceMatches: ["a little life"],
    description: "Four college friends build careers in Manhattan, centering around the brilliant, deeply scarred Jude. A monumental, emotionally devastating exploration of suffering and love."
  },
  {
    title: "They Both Die at the End",
    author: "Adam Silvera",
    year: 2017,
    genre: "Young Adult",
    tags: ["Death-Cast", "Last Day on Earth", "Bittersweet", "Soulmates"],
    moods: ["Heartbreaking / Emotional", "Fast-Paced"],
    tropes: ["found family"],
    referenceMatches: ["they both die at the end"],
    description: "Two teenage strangers receive calls informing them they have twenty-four hours left to live and meet through an app to spend their End Day together. Poignant and life-affirming."
  },
  {
    title: "Never Let Me Go",
    author: "Kazuo Ishiguro",
    year: 2005,
    genre: "Sci-Fi",
    tags: ["Boarding School", "Dystopian Haunting", "Quiet Grief", "Nobel Laureate"],
    moods: ["Heartbreaking / Emotional", "Atmospheric"],
    tropes: [],
    referenceMatches: ["never let me go"],
    description: "Students grow up at a sheltered English country boarding school, only to slowly realize the heartbreaking purpose of their existence. Unbearably moving, understated, and timeless."
  },

  // ── 7. CONTEMPORARY ROMANCE & WITTY BANTER ───────────────────────────
  {
    title: "Book Lovers",
    author: "Emily Henry",
    year: 2022,
    genre: "Romance",
    tags: ["Literary Agent & Editor", "Small Town Rivalry", "Sharp Banter", "Meta-Romance"],
    moods: ["Lighthearted / Witty", "Cozy"],
    tropes: ["enemies to lovers", "slow burn"],
    referenceMatches: ["book lovers", "beach read"],
    description: "A fierce Manhattan literary agent and her cynical rival editor cross paths during a summer in small-town North Carolina. Razor-sharp prose, witty chemistry, and emotional depth."
  },
  {
    title: "Beach Read",
    author: "Emily Henry",
    year: 2020,
    genre: "Romance",
    tags: ["Rival Authors", "Summer Swap Challenge", "Emotional Depth", "Banters"],
    moods: ["Lighthearted / Witty", "Cozy"],
    tropes: ["enemies to lovers"],
    referenceMatches: ["beach read"],
    description: "Two rival authors struggling with writer's block in neighboring beach houses challenge each other to write outside their comfort zones. Sparkling banter layered with poignant grief and romance."
  },
  {
    title: "The Hating Game",
    author: "Sally Thorne",
    year: 2016,
    genre: "Romance",
    tags: ["Office Rivalry", "Executive Assistants", "Tension", "Enemies to Lovers"],
    moods: ["Lighthearted / Witty", "Fast-Paced"],
    tropes: ["enemies to lovers"],
    referenceMatches: ["the hating game"],
    description: "Lucy Hutton and Joshua Templeman despise each other while sharing an office, competing for the same COO promotion. The quintessential modern enemies-to-lovers workplace romance."
  },
  {
    title: "Part of Your World",
    author: "Abby Jimenez",
    year: 2022,
    genre: "Romance",
    tags: ["Small Town", "Opposites Attract", "Big City ER Doctor", "Heart"],
    moods: ["Lighthearted / Witty", "Cozy"],
    tropes: ["slow burn"],
    referenceMatches: ["part of your world"],
    description: "A world-weary city ER doctor's car gets stuck in a tiny rural town, crossing paths with a charismatic carpenter. Laugh-out-loud humor, deep empathy, and genuine warmth."
  },

  // ── 8. DARK ACADEMIA & ATMOSPHERIC LITERARY ──────────────────────────
  {
    title: "The Secret History",
    author: "Donna Tartt",
    year: 1992,
    genre: "Classics",
    tags: ["Greek Classics", "Vermont College", "Moral Corruption", "Atmospheric"],
    moods: ["Dark", "Atmospheric", "Mind-Bending / Twisty"],
    tropes: ["dark academia"],
    referenceMatches: ["the secret history"],
    description: "Under the influence of a charismatic classics professor, an elite circle of eccentric students at an isolated Vermont college step beyond moral boundaries into murder."
  },
  {
    title: "Babel: An Arcane History",
    author: "R.F. Kuang",
    year: 2022,
    genre: "Fantasy",
    tags: ["Oxford Translation", "Silver-working Magic", "Empire & Rebellion", "Scholarly"],
    moods: ["Dark", "Atmospheric", "Heartbreaking / Emotional"],
    tropes: ["dark academia", "found family"],
    referenceMatches: ["babel"],
    description: "Oxford's prestigious Institute of Translation powers the British Empire using magical silver bars engraved with words. A passionate, heartbreaking critique of empire, language, and power."
  },
  {
    title: "If We Were Villains",
    author: "M.L. Rio",
    year: 2018,
    genre: "Mystery",
    tags: ["Shakespeare Drama", "Conservatory", "Murder Mystery", "Obsession"],
    moods: ["Dark", "Atmospheric"],
    tropes: ["dark academia"],
    referenceMatches: ["if we were villains"],
    description: "Seven Shakespearean acting students at an elite arts conservatory discover the deadly rivalries of the tragedies they perform bleeding into their real lives."
  },

  // ── 9. SCI-FI & EPIC WORLD-BUILDING ──────────────────────────────────
  {
    title: "Project Hail Mary",
    author: "Andy Weir",
    year: 2021,
    genre: "Sci-Fi",
    tags: ["Lone Astronaut", "Science Problem-Solving", "Alien Friendship", "Hope"],
    moods: ["Lighthearted / Witty", "Fast-Paced"],
    tropes: ["found family"],
    referenceMatches: ["project hail mary"],
    description: "A lone survivor of a desperate space mission awakens with amnesia and must use scientific deduction to prevent Earth's extinction. Unmatched humor, science, and a wonderful friendship."
  },
  {
    title: "Dune",
    author: "Frank Herbert",
    year: 1965,
    genre: "Sci-Fi",
    tags: ["Desert Planet", "Spice Ecology", "Dynasties", "Prophecy"],
    moods: ["Dark", "Atmospheric"],
    tropes: ["chosen one"],
    referenceMatches: ["dune"],
    description: "Paul Atreides journeys to the harsh desert planet Arrakis, where spice economics, giant sandworms, and messianic prophecies collide in the greatest space opera ever written."
  },
  {
    title: "The Name of the Wind",
    author: "Patrick Rothfuss",
    year: 2007,
    genre: "Fantasy",
    tags: ["Arcane University", "Sympathy Magic", "Lyrical Prose", "Legendary Hero"],
    moods: ["Atmospheric", "Mind-Bending / Twisty"],
    tropes: ["dark academia"],
    referenceMatches: ["the name of the wind"],
    description: "Kvothe recounts his true journey from a troupe of traveling players to the legendary University where he masters the names of the wind. Lyrical, immersive, and unforgettable."
  },
  {
    title: "The Way of Kings",
    author: "Brandon Sanderson",
    year: 2010,
    genre: "Fantasy",
    tags: ["Roshar Highstorms", "Shardblades", "Spren", "Epic Scope"],
    moods: ["Atmospheric", "Fast-Paced"],
    tropes: ["found family", "chosen one"],
    referenceMatches: ["the way of kings"],
    description: "A sprawling epic set upon a storm-ravaged world where honor is tested against impossible odds. Intricate magic systems, deep lore, and monumental battle sequences."
  }
];

// Helper to extract previously recommended titles from conversation history
function extractPreviousTitlesFromHistory(
  messages: Array<{ role: "user" | "assistant"; content: string }>
): Set<string> {
  const titles = new Set<string>();
  for (const msg of messages) {
    if (msg.role === "assistant") {
      // Matches **Title** by Author
      const matches = msg.content.match(/\*\*([^*]+)\*\*\s+by/gi);
      if (matches) {
        for (const m of matches) {
          const clean = m.replace(/^\*\*/, "").replace(/\*\*\s+by$/i, "").trim().toLowerCase();
          titles.add(clean);
        }
      }
    }
  }
  return titles;
}

export const generateBookRecommendation = (
  userQuery: string,
  historyMessages: Array<{ role: "user" | "assistant"; content: string }> = [],
  userId?: string
): string => {
  let userRatings: Array<{ title: string; author: string; genre: string; rating: number | null }> = [];
  let userTbrTitles: string[] = [];
  if (userId) {
    try {
      const userBooks = tbrDb.getBooks(userId);
      userRatings = userBooks.map((b) => ({ title: b.title, author: b.author, genre: b.genre, rating: b.rating }));
      userTbrTitles = userBooks.map((b) => b.title);
    } catch {}
  }

  const prevTitles = Array.from(extractPreviousTitlesFromHistory(historyMessages));

  const result = runRecommendationPipeline(userQuery, {
    limit: 3,
    recentRecommendations: prevTitles,
    ratings: userRatings,
    tbrTitles: userTbrTitles,
  });

  return result.formatted_response;
};

