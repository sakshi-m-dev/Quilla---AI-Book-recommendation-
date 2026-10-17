import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient, TBRItem, UserProfile } from "@/lib/apiClient";
import { Star, Trash2, BookMarked, TrendingUp, Library, ArrowLeft, Sun, Moon } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { useBookChat } from "@/hooks/useBookChat";
import { useTheme } from "@/context/ThemeContext";

const GENRE_COLORS: Record<string, string> = {
  "Sci-Fi":     "chip-rose",
  "Fantasy":    "chip-sage",
  "Thriller":   "chip-coral",
  "Romance":    "chip-blush",
  "Horror":     "chip-marigold",
  "Non-Fiction":"chip-sky",
  "Classics":   "chip-mint",
  "General":    "chip-rose",
};

const StarRating = ({
  rating,
  onRate,
}: {
  rating: number | null;
  onRate: (r: number) => void;
}) => {
  const [hovered, setHovered] = useState<number | null>(null);
  const display = hovered ?? rating ?? 0;

  return (
    <div className="flex gap-0.5" role="group" aria-label="Star rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className="star-btn"
          aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(null)}
          onClick={() => onRate(star)}
        >
          <span style={{ color: star <= display ? "#f5a623" : "#d1d5db" }}>★</span>
        </button>
      ))}
    </div>
  );
};

const Profile = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [books, setBooks] = useState<TBRItem[]>([]);
  const { newChat, loadConversation, deleteConversation, renameConversation, currentConversationId } = useBookChat();

  useEffect(() => {
    async function loadData() {
      const currentUser = await apiClient.getCurrentUser();
      if (!currentUser) {
        navigate("/auth");
        return;
      }
      setUser(currentUser);

      try {
        const tbrList = await apiClient.getTBRBooks();
        setBooks(tbrList);
      } catch (e) {
        console.error("Failed to load TBR books:", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [navigate]);

  const handleRate = async (id: string, rating: number) => {
    const success = await apiClient.rateTBRBook(id, rating);
    if (success) {
      setBooks((prev) =>
        prev.map((b) => (b.id === id ? { ...b, rating } : b))
      );
      toast.success("Rating saved! ✨");
    } else {
      toast.error("Could not save rating");
    }
  };

  const handleRemove = async (id: string, title: string) => {
    const success = await apiClient.removeTBRBook(id);
    if (success) {
      setBooks((prev) => prev.filter((b) => b.id !== id));
      toast.success(`"${title}" removed from your TBR 🗑️`);
    } else {
      toast.error("Could not remove book");
    }
  };

  // Stats
  const ratedBooks = books.filter((b) => b.rating !== null);
  const avgRating = ratedBooks.length
    ? (ratedBooks.reduce((s, b) => s + b.rating!, 0) / ratedBooks.length).toFixed(1)
    : "—";
  const genreCounts: Record<string, number> = {};
  books.forEach((b) => {
    genreCounts[b.genre] = (genreCounts[b.genre] || 0) + 1;
  });
  const topGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

  const userEmail = user?.email || "Reader";
  const displayName = user?.name || userEmail;
  const initials = displayName.slice(0, 2).toUpperCase();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="text-4xl animate-bounce">📚</div>
          <p className="text-sm text-muted-foreground font-medium">Loading your library…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        onNewChat={newChat}
        onSelectConversation={loadConversation}
        onDeleteConversation={deleteConversation}
        onRenameConversation={renameConversation}
        currentConversationId={currentConversationId}
      />

      <main className="container max-w-4xl mx-auto px-4 py-8">
        {/* Back */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to chat
        </button>

        {/* Profile header */}
        <div className="profile-header-bg p-6 mb-6 flex flex-col sm:flex-row items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-rose-500/20 flex-shrink-0">
            {initials}
          </div>
          <div className="text-center sm:text-left">
            <h1 className="text-2xl font-serif font-semibold text-foreground leading-tight">
              {displayName}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">{userEmail} · Your reading universe ✨</p>
          </div>
        </div>

        {/* Appearance Setting */}
        <div className="flex items-center justify-between p-4 mb-6 rounded-2xl bg-card border border-border/80 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              {theme === "dark" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Appearance</h3>
              <p className="text-xs text-muted-foreground">
                Choose between warm parchment and midnight library
              </p>
            </div>
          </div>
          {/* Segmented Switch */}
          <div
            role="radiogroup"
            aria-label="Appearance theme switch"
            className="flex items-center p-1 rounded-full bg-secondary/80 border border-border/60 text-xs font-medium"
          >
            <button
              type="button"
              role="radio"
              aria-checked={theme === "light"}
              onClick={() => setTheme("light")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                theme === "light"
                  ? "bg-card text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Light</span>
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={theme === "dark"}
              onClick={() => setTheme("dark")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                theme === "dark"
                  ? "bg-card text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Dark</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="stat-card">
            <div className="flex justify-center mb-2">
              <Library className="w-5 h-5 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground">{books.length}</p>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">Books saved</p>
          </div>
          <div className="stat-card">
            <div className="flex justify-center mb-2">
              <Star className="w-5 h-5 text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-foreground">{avgRating}</p>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">Avg rating</p>
          </div>
          <div className="stat-card">
            <div className="flex justify-center mb-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-foreground truncate">{topGenre}</p>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">Top genre</p>
          </div>
        </div>

        {/* Ratings context notice */}
        {ratedBooks.length > 0 && (
          <div className="mb-6 flex items-start gap-3 p-4 rounded-2xl bg-primary/10 border border-primary/20">
            <span className="text-xl flex-shrink-0">🤖</span>
            <p className="text-sm text-foreground/90 font-medium leading-relaxed">
              Quilla is learning from your ratings! It uses your favorite books to tailor every recommendation going forward.
            </p>
          </div>
        )}

        {/* TBR List */}
        <div className="flex items-center gap-2 mb-4">
          <BookMarked className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-serif font-semibold text-foreground">To Be Read</h2>
          <span className="ml-auto text-xs text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full font-semibold">
            {books.length} book{books.length !== 1 ? "s" : ""}
          </span>
        </div>

        {books.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="empty-doodle">📖</div>
            <h3 className="text-lg font-serif font-semibold text-foreground">Your TBR is empty!</h3>
            <p className="text-sm text-muted-foreground text-center max-w-xs leading-relaxed">
              Head to the chat and ask for book recommendations. You'll see an{" "}
              <strong className="text-primary">+ Add to TBR</strong> button on each suggestion!
            </p>
            <button
              onClick={() => navigate("/")}
              className="genre-chip chip-rose mt-2"
            >
              🔮 Find books to read
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {books.map((book) => (
              <div key={book.id} className="book-card p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                {/* Book spine colour */}
                <div
                  className="w-2 self-stretch rounded-full flex-shrink-0 hidden sm:block"
                  style={{ background: `hsl(${Math.abs(book.title.charCodeAt(0) * 13) % 360} 55% 72%)` }}
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 flex-wrap">
                    <p className="font-semibold text-foreground text-sm leading-snug">{book.title}</p>
                    <span
                      className={`genre-tag ${GENRE_COLORS[book.genre] || "chip-lavender"} flex-shrink-0`}
                    >
                      {book.genre}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{book.author}</p>
                  <p className="text-[11px] text-muted-foreground/60 mt-1">
                    Added {new Date(book.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>

                {/* Rating */}
                <div className="flex flex-col items-start sm:items-end gap-1.5 flex-shrink-0">
                  <StarRating rating={book.rating} onRate={(r) => handleRate(book.id, r)} />
                  {book.rating === null && (
                    <p className="text-[10px] text-muted-foreground">tap to rate</p>
                  )}
                  {book.rating !== null && (
                    <p className="text-[10px] text-amber-500 font-semibold">{book.rating}/5 stars</p>
                  )}
                </div>

                {/* Remove */}
                <button
                  onClick={() => handleRemove(book.id, book.title)}
                  aria-label="Remove from TBR"
                  className="flex-shrink-0 p-1.5 rounded-lg text-muted-foreground/50 hover:text-red-400 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Profile;
