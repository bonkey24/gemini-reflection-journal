import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  LogOut, 
  Menu, 
  Plus, 
  ShieldCheck, 
  AlertTriangle,
  User as UserIcon
} from "lucide-react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, signInWithGoogle, logOut } from "./lib/firebase";
import { getUserEntries, saveUserEntry, deleteUserEntry } from "./lib/journalService";
import type { JournalEntry, JournalMessage, ReflectionMode } from "./types";
import { LandingView } from "./components/LandingView";
import { EntryHistorySidebar } from "./components/EntryHistorySidebar";
import { JournalEditor } from "./components/JournalEditor";
import { InsightPanel } from "./components/InsightPanel";

function createNewBlankEntry(userId: string): JournalEntry {
  const now = new Date().toISOString();
  return {
    id: `entry_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId,
    title: "New Reflection",
    createdAt: now,
    updatedAt: now,
    mode: "deep-reflection",
    summary: "",
    tags: ["reflection"],
    messages: []
  };
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Journal Entries State
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Interaction & Async states
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: "error" | "success" | "info"; message: string } | null>(null);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setAuthLoading(false);

      if (user) {
        try {
          const userEntries = await getUserEntries(user.uid);
          setEntries(userEntries);
          if (userEntries.length > 0) {
            setSelectedEntry(userEntries[0]);
          } else {
            const initial = createNewBlankEntry(user.uid);
            setSelectedEntry(initial);
          }
        } catch (error) {
          console.error("Failed to fetch initial user entries:", error);
          setNotification({
            type: "error",
            message: "Unable to load past entries from Firestore. Please check your connection."
          });
        }
      } else {
        setEntries([]);
        setSelectedEntry(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Handle Google Sign-In
  const handleSignIn = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      console.error("Login failed:", error);
      setAuthError(error?.message || "Google Authentication failed. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Sign Out
  const handleSignOut = async () => {
    try {
      await logOut();
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  // Handle Creating a New Reflection Entry
  const handleNewReflection = () => {
    if (!currentUser) return;
    const newEntry = createNewBlankEntry(currentUser.uid);
    setSelectedEntry(newEntry);
  };

  // Handle Updating an Entry & Persisting to Firestore
  const handleUpdateEntry = async (updated: JournalEntry) => {
    if (!currentUser) return;
    setSelectedEntry(updated);
    
    // Update local list
    setEntries((prev) => {
      const idx = prev.findIndex((e) => e.id === updated.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updated;
        return next;
      }
      return [updated, ...prev];
    });

    // Persist to Cloud Firestore with isolated user bound path
    setIsSaving(true);
    try {
      await saveUserEntry(currentUser.uid, updated);
    } catch (error) {
      console.error("Save error:", error);
      setNotification({
        type: "error",
        message: "Failed to persist changes to Cloud Firestore. Retrying on next action."
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Deleting an Entry
  const handleDeleteEntry = async (entryId: string) => {
    if (!currentUser) return;
    try {
      await deleteUserEntry(currentUser.uid, entryId);
      const remaining = entries.filter((e) => e.id !== entryId);
      setEntries(remaining);
      if (selectedEntry?.id === entryId) {
        if (remaining.length > 0) {
          setSelectedEntry(remaining[0]);
        } else {
          setSelectedEntry(createNewBlankEntry(currentUser.uid));
        }
      }
      setNotification({
        type: "success",
        message: "Entry removed securely from Firestore."
      });
    } catch (error) {
      console.error("Delete failed:", error);
      setNotification({
        type: "error",
        message: "Could not delete entry from Cloud Firestore."
      });
    }
  };

  // Handle Submitting a Turn to Gemini AI
  const handleSendTurn = async (userPrompt: string, mode: ReflectionMode) => {
    if (!currentUser || !selectedEntry || isGenerating) return;

    const userMessage: JournalMessage = {
      id: `msg_${Date.now()}_user`,
      role: "user",
      content: userPrompt,
      timestamp: new Date().toISOString()
    };

    // Append user message immediately
    const updatedMessagesWithUser = [...selectedEntry.messages, userMessage];
    const interimEntry: JournalEntry = {
      ...selectedEntry,
      mode,
      messages: updatedMessagesWithUser,
      updatedAt: new Date().toISOString()
    };

    // Update state & persist user turn
    await handleUpdateEntry(interimEntry);

    setIsGenerating(true);
    try {
      // Call server-side Gemini API route
      const response = await fetch("/api/gemini/reflect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          entryTitle: selectedEntry.title,
          currentMessage: userPrompt,
          conversationHistory: selectedEntry.messages.map((m) => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      const rawResponseText = await response.text();
      let data: any = null;

      try {
        data = rawResponseText ? JSON.parse(rawResponseText) : {};
      } catch (parseErr) {
        if (rawResponseText.includes("<!DOCTYPE") || rawResponseText.includes("<html")) {
          throw new Error(
            `The server is initializing or re-authenticating (HTTP ${response.status}). Please try sending your turn again in a few seconds.`
          );
        }
        throw new Error(`Server returned non-JSON response (${response.status}): ${rawResponseText.slice(0, 100)}`);
      }

      if (!response.ok) {
        let errMsg = data?.error || `Server responded with ${response.status}`;
        if (typeof errMsg === "string" && errMsg.startsWith("{")) {
          try {
            const parsed = JSON.parse(errMsg);
            errMsg = parsed?.error?.message || parsed?.message || errMsg;
          } catch {
            // Keep raw if not JSON
          }
        }
        throw new Error(errMsg);
      }

      // Clean conversational message strictly (strip any telemetry block if residual)
      let cleanContent = data.message || data.reply || "Thank you for sharing your thoughts.";
      if (typeof cleanContent === "string") {
        if (cleanContent.includes("---TELEMETRY---")) {
          cleanContent = cleanContent.split("---TELEMETRY---")[0].trim();
        }
        cleanContent = cleanContent
          .replace(/```(?:json)?\s*\{[\s\S]*?\}\s*```/gi, "")
          .replace(/(?:#{1,4}\s*)?Analytical Telemetry[\s\S]*$/i, "")
          .replace(/(?:#{1,4}\s*)?Telemetry[\s\S]*$/i, "")
          .replace(/\{[\s\S]*"(?:sentiment|clarity|sentimentScore|tags|actionableSteps|action_items|actionItems)"[\s\S]*\}\s*$/gi, "")
          .trim();
      }

      const aiMessage: JournalMessage = {
        id: `msg_${Date.now()}_model`,
        role: "model",
        content: cleanContent || "Thank you for sharing your thoughts.",
        timestamp: new Date().toISOString()
      };

      // Extract telemetry values
      const telemetryObj = data.telemetry || {};
      const newSentimentScore = 
        telemetryObj.sentiment ?? 
        telemetryObj.clarity ?? 
        telemetryObj.sentimentScore ?? 
        data.sentimentScore ?? 
        interimEntry.sentimentScore;

      const newTags = telemetryObj.tags || data.suggestedTags || [];
      const newActionItems = telemetryObj.action_items || telemetryObj.actionableSteps || data.actionableSteps || interimEntry.actionableSteps;

      const finalEntry: JournalEntry = {
        ...interimEntry,
        title: (selectedEntry.title === "New Reflection" || !selectedEntry.title) && (telemetryObj.title || data.entryTitle)
          ? (telemetryObj.title || data.entryTitle)
          : interimEntry.title,
        summary: telemetryObj.summary || data.summary || interimEntry.summary,
        tags: Array.from(new Set([...(interimEntry.tags || []), ...(Array.isArray(newTags) ? newTags : [])])),
        sentimentScore: typeof newSentimentScore === "number" ? newSentimentScore : interimEntry.sentimentScore,
        actionableSteps: Array.isArray(newActionItems) && newActionItems.length > 0 ? newActionItems : interimEntry.actionableSteps,
        messages: [...updatedMessagesWithUser, aiMessage],
        updatedAt: new Date().toISOString()
      };

      // Guaranteed transaction verification: Persist both user input & AI output
      await handleUpdateEntry(finalEntry);
    } catch (error: any) {
      console.error("Gemini turn failed:", error);
      setNotification({
        type: "error",
        message: `Gemini Reflection failed: ${error?.message || "Please try again."}`
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // If Auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2D3B2C] text-[#FAF8F5] flex items-center justify-center animate-pulse shadow-xs">
            <Sparkles className="w-5 h-5 text-emerald-200" />
          </div>
          <p className="text-xs font-serif italic text-stone-600">
            Initializing secure session...
          </p>
        </div>
      </div>
    );
  }

  // If user is not authenticated, render Landing / Sign In View
  if (!currentUser) {
    return (
      <LandingView
        onSignIn={handleSignIn}
        isLoading={authLoading}
        errorMessage={authError}
      />
    );
  }

  // If authenticated, render Private Dashboard
  return (
    <div id="authenticated-dashboard" className="h-screen w-screen flex flex-col bg-[#FAF8F5] overflow-hidden text-stone-900 font-sans antialiased">
      {/* Global Top Navbar */}
      <header id="dashboard-navbar" className="h-14 border-b border-[#EAE4DC] bg-[#FAF8F5] px-4 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button
            id="toggle-sidebar-mobile-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-md text-stone-600 hover:bg-[#F0EBE1] lg:hidden"
            title="Toggle History Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[#2D3B2C] text-[#FAF8F5] flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
            </div>
            <span className="font-serif italic font-semibold text-stone-900 text-base tracking-tight hidden sm:inline">
              ReflectAI
            </span>
          </div>

          <span className="text-stone-300 hidden sm:inline">|</span>

          {/* New reflection shortcut */}
          <button
            id="navbar-new-reflection-btn"
            onClick={handleNewReflection}
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-xs uppercase tracking-wider font-semibold text-stone-700 hover:text-stone-950 bg-[#F0EBE1] hover:bg-[#E5DFD4] rounded-md transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Reflection</span>
          </button>
        </div>

        {/* User profile & actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {currentUser.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt="Profile"
                referrerPolicy="no-referrer"
                className="w-7 h-7 rounded-full border border-[#DFD7CB] object-cover"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-[#E5DFD4] text-stone-700 flex items-center justify-center text-xs font-serif font-bold">
                {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : "U"}
              </div>
            )}
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-medium text-stone-900 leading-tight">
                {currentUser.displayName || "Journaler"}
              </span>
              <span className="text-[10px] text-stone-500 leading-tight">
                {currentUser.email}
              </span>
            </div>
          </div>

          <button
            id="signout-button"
            onClick={handleSignOut}
            className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-[#F0EBE1] rounded-md transition-colors flex items-center gap-1 text-xs uppercase tracking-wider font-semibold"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Global Notifications Banner */}
      {notification && (
        <div
          id="global-notification-banner"
          className={`px-4 py-2 text-xs flex items-center justify-between z-30 transition-all ${
            notification.type === "error"
              ? "bg-red-700 text-white"
              : notification.type === "success"
              ? "bg-[#2D3B2C] text-white"
              : "bg-stone-800 text-white"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "error" ? (
              <AlertTriangle className="w-4 h-4" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-white/80 hover:text-white text-xs ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div id="main-workspace-layout" className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Journal History */}
        <EntryHistorySidebar
          entries={entries}
          selectedEntryId={selectedEntry?.id || null}
          onSelectEntry={(entry) => setSelectedEntry(entry)}
          onNewEntry={handleNewReflection}
          onDeleteEntry={handleDeleteEntry}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Center: Active Journal & Multi-Turn Gemini Conversation */}
        {selectedEntry ? (
          <JournalEditor
            currentEntry={selectedEntry}
            onUpdateEntry={handleUpdateEntry}
            onSendTurn={handleSendTurn}
            isGenerating={isGenerating}
            isSaving={isSaving}
            onNewReflection={handleNewReflection}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-white text-stone-500 text-sm font-serif italic">
            Select or create a reflection to begin.
          </div>
        )}

        {/* Right Panel: AI Synthesis & Thought Starters */}
        {selectedEntry && (
          <InsightPanel
            currentEntry={selectedEntry}
            onUpdateEntry={handleUpdateEntry}
            onSendFollowUp={(prompt) => handleSendTurn(prompt, selectedEntry.mode)}
            isGenerating={isGenerating}
          />
        )}
      </div>
    </div>
  );
}
