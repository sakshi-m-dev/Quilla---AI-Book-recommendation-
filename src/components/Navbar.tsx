import { useState, useEffect, useRef } from "react";
import { apiClient } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { BookOpen, LogOut, Plus, History, Trash2, Edit2, Check, X, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

interface NavbarProps {
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation?: (id: string) => Promise<boolean>;
  onRenameConversation?: (id: string, newTitle: string) => Promise<boolean>;
  currentConversationId?: string;
  isGenerating?: boolean;
}

export const Navbar = ({
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
  onRenameConversation,
  currentConversationId,
  isGenerating = false,
}: NavbarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isStoryPage = location.pathname === "/story" || location.pathname === "/about";
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [justCompleted, setJustCompleted] = useState(false);
  const wasGenerating = useRef(isGenerating);

  useEffect(() => {
    // Detect transition from generating -> complete
    if (wasGenerating.current && !isGenerating) {
      setJustCompleted(true);
      const timer = setTimeout(() => setJustCompleted(false), 1400);
      return () => clearTimeout(timer);
    }
    wasGenerating.current = isGenerating;
  }, [isGenerating]);

  useEffect(() => {
    loadConversations();
    const user = apiClient.getUser();
    if (user) {
      setUserEmail(user.email);
    }
  }, [currentConversationId]);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const list = await apiClient.getConversations();
      setConversations(list || []);
    } catch {
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    apiClient.clearSession();
    toast.success("Signed out! See you soon.");
    navigate("/auth");
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!onDeleteConversation) return;
    const success = await onDeleteConversation(id);
    if (success) setConversations((prev) => prev.filter((c) => c.id !== id));
  };

  const startEditing = (e: React.MouseEvent, conv: Conversation) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditingTitle(conv.title);
  };

  const saveEditing = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!onRenameConversation) return;
    const success = await onRenameConversation(id, editingTitle);
    if (success) {
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title: editingTitle } : c))
      );
      setEditingId(null);
    }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60));
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffHours < 48) return "Yesterday";
    return d.toLocaleDateString();
  };

  const handleBrandClick = () => {
    if (isStoryPage) {
      navigate("/");
    } else {
      navigate("/story");
    }
  };

  const handleNewChat = () => {
    onNewChat();
    if (location.pathname !== "/") {
      navigate("/");
    }
  };

  const handleSelectConversation = (id: string) => {
    onSelectConversation(id);
    if (location.pathname !== "/") {
      navigate("/");
    }
  };

  const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : "QU";

  return (
    <nav className="navbar-clean sticky top-0 z-50 transition-colors">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand with Living Icon */}
        <button
          onClick={handleBrandClick}
          className="flex items-center gap-2.5 text-left group transition-all"
          title={isStoryPage ? "Return to library" : "Quilla's Story — A quiet note to readers"}
          aria-label={isStoryPage ? "Return to library" : "Read Quilla's story"}
        >
          {/* Animated Quilla Icon Container */}
          <div className="relative">
            {/* Outer Radial Pulse Glow on Response Complete */}
            {justCompleted && (
              <div className="absolute -inset-1.5 rounded-2xl bg-primary/30 animate-ping pointer-events-none opacity-60" />
            )}

            {/* Orbiting particles ring when generating */}
            {isGenerating && (
              <div className="absolute -inset-1 rounded-2xl border border-dashed border-primary/40 animate-[spin_6s_linear_infinite] pointer-events-none" />
            )}

            <div
              className={`quilla-logo-mark w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white shadow-sm shadow-rose-500/20 ${
                isGenerating
                  ? "animate-icon-generating scale-105"
                  : "animate-icon-idle"
              }`}
            >
              <BookOpen className={`quilla-logo-icon w-4 h-4 transition-transform ${isGenerating ? "scale-110" : ""}`} />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-serif font-bold text-foreground leading-tight tracking-tight block">
                Quilla
              </span>
              {isStoryPage ? (
                <span className="inline-flex items-center gap-1 text-[10.5px] font-serif italic text-primary font-medium bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                  Our Story
                </span>
              ) : isGenerating ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.2 rounded-full animate-pulse">
                  <Sparkles className="w-2.5 h-2.5" />
                  Weaving
                </span>
              ) : null}
            </div>
            <span className="text-[11px] text-muted-foreground/80 font-normal hidden sm:block -mt-0.5">
              {isStoryPage ? "Click to return to library" : "Your personal book companion"}
            </span>
          </div>
        </button>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* New Chat */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNewChat}
            className="h-8 px-2.5 gap-1.5 text-xs font-medium text-foreground/80 hover:text-foreground hover:bg-secondary/70 rounded-full transition-transform active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 text-primary" />
            <span className="hidden sm:inline">New Chat</span>
          </Button>

          {/* History Drawer */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={loadConversations}
                className="h-8 px-2.5 gap-1.5 text-xs font-medium text-foreground/80 hover:text-foreground hover:bg-secondary/70 rounded-full transition-transform active:scale-95"
              >
                <History className="w-3.5 h-3.5 text-primary" />
                <span className="hidden sm:inline">History</span>
              </Button>
            </SheetTrigger>
            <SheetContent className="bg-background border-border">
              <SheetHeader>
                <SheetTitle className="font-serif text-foreground text-xl">Chat History</SheetTitle>
                <SheetDescription className="text-muted-foreground text-sm">
                  Your previous conversations 📚
                </SheetDescription>
              </SheetHeader>
              <div className="mt-5 space-y-1.5 max-h-[80vh] overflow-y-auto pr-1">
                {loading ? (
                  <p className="text-sm text-muted-foreground italic px-2">Loading…</p>
                ) : conversations.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-2xl mb-2">💬</p>
                    <p className="text-sm text-muted-foreground">No conversations yet!</p>
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv.id)}
                      className={`group relative w-full text-left p-3 rounded-xl border cursor-pointer flex items-center justify-between gap-2 transition-all ${
                        currentConversationId === conv.id
                          ? "bg-primary/10 border-primary/30 shadow-sm"
                          : "bg-card border-border/80 hover:border-primary/30 hover:bg-secondary/40"
                      }`}
                    >
                      {editingId === conv.id ? (
                        <div
                          className="flex items-center gap-1 w-full"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Input
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            className="h-8 text-xs"
                            autoFocus
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-emerald-600"
                            onClick={(e) => saveEditing(e, conv.id)}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-muted-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingId(null);
                            }}
                          >
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-foreground line-clamp-1">
                              {conv.title}
                            </p>
                            <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                              {formatDate(conv.updated_at)}
                            </p>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-secondary"
                              onClick={(e) => startEditing(e, conv)}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={(e) => handleDelete(e, conv.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </SheetContent>
          </Sheet>

          {/* Profile button */}
          <button
            onClick={() => navigate("/profile")}
            aria-label="Profile"
            title={userEmail || "Profile"}
            className="w-7 h-7 rounded-full bg-primary/15 text-primary border border-primary/25 flex items-center justify-center text-xs font-bold transition-all hover:scale-105 hover:bg-primary/25 active:scale-95 ml-1"
          >
            {initials}
          </button>

          {/* Sign Out */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="h-8 px-2 gap-1 text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-transform active:scale-95"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
