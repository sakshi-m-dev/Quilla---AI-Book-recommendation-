import { useState, useEffect, useRef } from "react";
import { apiClient, ChatMessageItem } from "@/lib/apiClient";
import { toast } from "sonner";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const INITIAL_GREETING: Message = {
  role: "assistant",
  content: "Hello! I'm your personal book recommendation assistant. Tell me about your reading preferences, favorite genres, or what kind of mood you're in, and I'll help you discover your next great read!",
};

export const useBookChat = () => {
  const [messages, setMessages] = useState<Message[]>([INITIAL_GREETING]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>();
  const isInitializing = useRef(false);

  useEffect(() => {
    if (!isInitializing.current) {
      isInitializing.current = true;
      createNewConversation();
    }
  }, []);

  const createNewConversation = async () => {
    try {
      const conv = await apiClient.createConversation("New Chat");
      setCurrentConversationId(conv.id);
      setMessages([INITIAL_GREETING]);
      return conv.id;
    } catch {
      const fallbackId = "conv_" + Math.random().toString(36).substring(2, 9);
      setCurrentConversationId(fallbackId);
      setMessages([INITIAL_GREETING]);
      return fallbackId;
    }
  };

  const loadConversation = async (conversationId: string) => {
    try {
      setIsLoading(true);
      const history = await apiClient.getMessages(conversationId);
      if (history && history.length > 0) {
        setMessages(
          history.map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          }))
        );
      } else {
        setMessages([INITIAL_GREETING]);
      }
      setCurrentConversationId(conversationId);
    } catch (err) {
      toast.error("Could not load conversation messages");
    } finally {
      setIsLoading(false);
    }
  };

  const newChat = async () => {
    await createNewConversation();
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    let convId = currentConversationId;
    if (!convId) {
      convId = await createNewConversation();
    }

    const userMessage: Message = { role: "user", content: content.trim() };
    const updatedMessages = [...messages, userMessage];

    // Optimistically show user message
    setMessages(updatedMessages);
    setIsLoading(true);

    let assistantAccumulated = "";

    await apiClient.streamChat(
      convId,
      updatedMessages.map((m) => ({ role: m.role, content: m.content })),
      (chunk: string) => {
        assistantAccumulated += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) =>
              i === prev.length - 1 ? { ...m, content: assistantAccumulated } : m
            );
          }
          return [...prev, { role: "assistant", content: assistantAccumulated }];
        });
      },
      (fullText: string) => {
        setIsLoading(false);
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) =>
              i === prev.length - 1 ? { ...m, content: fullText } : m
            );
          }
          return [...prev, { role: "assistant", content: fullText }];
        });
      },
      (err: Error) => {
        setIsLoading(false);
        toast.error("Could not reach recommendation engine. Please try again.");
      }
    );
  };

  const deleteConversation = async (conversationId: string): Promise<boolean> => {
    const success = await apiClient.deleteConversation(conversationId);
    if (success) {
      toast.success("Conversation deleted");
      if (currentConversationId === conversationId) {
        await createNewConversation();
      }
    } else {
      toast.error("Failed to delete conversation");
    }
    return success;
  };

  const renameConversation = async (conversationId: string, newTitle: string): Promise<boolean> => {
    if (!newTitle.trim()) return false;
    const success = await apiClient.renameConversation(conversationId, newTitle.trim());
    if (success) {
      toast.success("Title updated");
    } else {
      toast.error("Failed to update conversation title");
    }
    return success;
  };

  return {
    messages,
    sendMessage,
    isLoading,
    newChat,
    loadConversation,
    deleteConversation,
    renameConversation,
    currentConversationId,
  };
};
