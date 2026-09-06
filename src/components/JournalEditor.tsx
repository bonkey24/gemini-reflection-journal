import React, { useState, useRef, useEffect } from "react";
import { 
  Sparkles, 
  Send, 
  Loader2, 
  Compass, 
  FileText, 
  Lightbulb, 
  CheckCircle2, 
  Tag, 
  Save,
  Clock,
  ShieldCheck,
  User as UserIcon,
  Bot
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { JournalEntry, JournalMessage, ReflectionMode } from "../types";

interface JournalEditorProps {
  currentEntry: JournalEntry;
  onUpdateEntry: (updated: JournalEntry) => Promise<void>;
  onSendTurn: (message: string, mode: ReflectionMode) => Promise<void>;
  isGenerating: boolean;
  isSaving: boolean;
  onNewReflection: () => void;
}

const MODES: Array<{
  id: ReflectionMode;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}> = [
  {
    id: "deep-reflection",
    label: "Deep Reflection",
    icon: Compass,
    description: "Empathetic, introspective exploration with thoughtful questions."
  },
  {
    id: "executive-summary",
    label: "Executive Summary",
    icon: FileText,
    description: "Structured synthesis, key decisions, and core takeaways."
  },
  {
    id: "brainstorming",
    label: "Brainstorming",
    icon: Lightbulb,
    description: "Creative idea expansion, divergent angles, and fresh framing."
  },
  {
    id: "action-steps",
    label: "Action Steps",
    icon: CheckCircle2,
    description: "Pragmatic, prioritized next steps and 5-minute starter tasks."
  }
];

/**
 * Helper to strip any residual JSON or telemetry markdown blocks from conversational chat bubbles
 */
function cleanAiChatMessage(text: string): string {
  if (!text) return "";
  let cleaned = text;
  if (cleaned.includes("---TELEMETRY---")) {
    cleaned = cleaned.split("---TELEMETRY---")[0].trim();
  }
  // Strip json code fences
  cleaned = cleaned.replace(/```(?:json)?\s*\{[\s\S]*?\}\s*```/gi, "").trim();
  // Strip trailing Analytical Telemetry headers and lists
  cleaned = cleaned.replace(/(?:#{1,4}\s*)?Analytical Telemetry[\s\S]*$/i, "").trim();
  cleaned = cleaned.replace(/(?:#{1,4}\s*)?Telemetry[\s\S]*$/i, "").trim();
  // Strip trailing raw JSON telemetry objects
  cleaned = cleaned.replace(/\{[\s\S]*"(?:sentiment|clarity|sentimentScore|tags|actionableSteps|action_items|actionItems)"[\s\S]*\}\s*$/gi, "").trim();
  return cleaned || text;
}

export function JournalEditor({
  currentEntry,
  onUpdateEntry,
  onSendTurn,
  isGenerating,
  isSaving,
  onNewReflection
}: JournalEditorProps) {
  const [inputText, setInputText] = useState("");
  const [activeMode, setActiveMode] = useState<ReflectionMode>(currentEntry.mode || "deep-reflection");
  const [titleInput, setTitleInput] = useState(currentEntry.title);
  const [newTagInput, setNewTagInput] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Sync title input when selected entry changes
  useEffect(() => {
    setTitleInput(currentEntry.title);
    setActiveMode(currentEntry.mode || "deep-reflection");
  }, [currentEntry.id, currentEntry.title, currentEntry.mode]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentEntry.messages.length, isGenerating]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [inputText]);

  const handleTitleBlur = () => {
    if (titleInput !== currentEntry.title) {
      onUpdateEntry({
        ...currentEntry,
        title: titleInput.trim() || "Untitled Reflection"
      });
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isGenerating) return;

    const messageToSend = inputText.trim();
    setInputText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    await onSendTurn(messageToSend, activeMode);
  };

  const handleAddTag = () => {
    const trimmed = newTagInput.trim().toLowerCase().replace(/^#/, "");
    if (!trimmed) return;
    const existing = currentEntry.tags || [];
    if (!existing.includes(trimmed)) {
      onUpdateEntry({
        ...currentEntry,
        tags: [...existing, trimmed]
      });
    }
    setNewTagInput("");
    setShowTagInput(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onUpdateEntry({
      ...currentEntry,
      tags: (currentEntry.tags || []).filter(t => t !== tagToRemove)
    });
  };

  return (
    <div id="journal-editor-container" className="flex-1 flex flex-col h-full bg-[#FAF8F5] relative overflow-hidden">
      {/* Top Action Bar */}
      <div id="editor-header" className="px-6 py-3.5 border-b border-[#EAE4DC] bg-[#FAF8F5]/95 backdrop-blur-xs flex flex-wrap items-center justify-between gap-4 z-10">
        <div className="flex-1 min-w-[240px]">
          <input
            id="journal-title-input"
            type="text"
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            onBlur={handleTitleBlur}
            placeholder="Reflection Title..."
            className="text-xl md:text-2xl font-serif font-medium text-stone-900 bg-transparent border-b border-transparent hover:border-[#DFD7CB] focus:border-[#3A4D39] focus:outline-none w-full py-0.5 transition-colors"
          />
          <div className="flex items-center gap-3 mt-1 text-[11px] text-stone-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(currentEntry.updatedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric"
              })}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-[#3A4D39] font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              Firestore Protected
            </span>
            {isSaving && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1 text-[#3A4D39] animate-pulse">
                  <Save className="w-3 h-3" />
                  Saving to Cloud...
                </span>
              </>
            )}
          </div>
        </div>

        {/* Reflection Mode Selector */}
        <div id="mode-selector" className="flex items-center gap-1 p-1 bg-[#F0EBE1] rounded-lg border border-[#DFD7CB] text-xs">
          {MODES.map((m) => {
            const Icon = m.icon;
            const isSelected = activeMode === m.id;
            return (
              <button
                key={m.id}
                id={`mode-select-${m.id}`}
                onClick={() => {
                  setActiveMode(m.id);
                  onUpdateEntry({ ...currentEntry, mode: m.id });
                }}
                title={m.description}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium text-xs transition-all ${
                  isSelected
                    ? "bg-white text-stone-900 shadow-2xs font-semibold"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-[#3A4D39]" : "text-stone-400"}`} />
                <span className="hidden sm:inline">{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tags Section */}
      <div id="editor-tags-bar" className="px-6 py-2 bg-[#FAF8F5] border-b border-[#EAE4DC] flex items-center gap-2 flex-wrap text-xs">
        <Tag className="w-3.5 h-3.5 text-stone-400" />
        {(currentEntry.tags || []).map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F0EBE1] border border-[#DFD7CB] text-stone-700 text-[11px] font-mono"
          >
            #{tag}
            <button
              onClick={() => handleRemoveTag(tag)}
              className="text-stone-400 hover:text-stone-700 ml-0.5"
            >
              ×
            </button>
          </span>
        ))}

        {showTagInput ? (
          <div className="inline-flex items-center gap-1">
            <input
              type="text"
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
              placeholder="tag name..."
              autoFocus
              className="px-2 py-0.5 text-xs bg-white border border-[#DFD7CB] rounded-md focus:outline-none focus:ring-1 focus:ring-[#3A4D39]"
            />
            <button
              onClick={handleAddTag}
              className="px-2 py-0.5 bg-[#2D3B2C] text-[#FAF8F5] rounded text-xs uppercase tracking-wider font-semibold"
            >
              Add
            </button>
            <button
              onClick={() => setShowTagInput(false)}
              className="text-stone-400 hover:text-stone-600 text-xs px-1"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowTagInput(true)}
            className="text-[11px] text-stone-500 hover:text-stone-900 hover:underline uppercase tracking-wider font-semibold"
          >
            + Add tag
          </button>
        )}
      </div>

      {/* Conversation / Messages Stream */}
      <div id="messages-scroll-area" className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {currentEntry.messages.length === 0 ? (
          <div id="empty-journal-state" className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto py-12">
            <div className="w-12 h-12 rounded-xl bg-[#F0EBE1] border border-[#DFD7CB] text-[#3A4D39] flex items-center justify-center mb-4 shadow-2xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-serif italic text-lg font-medium text-stone-900 mb-2">
              Begin Your Reflection
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed mb-6 font-sans">
              Write freely about your day, a challenging decision, creative ideas, or emotional state. Gemini 3.6 Flash will assist with thoughtful reflections and multi-turn inquiry.
            </p>

            <div className="grid grid-cols-1 gap-2 w-full text-left">
              <button
                onClick={() => setInputText("What is one thing I learned today that shifted my perspective?")}
                className="p-3 text-xs bg-white hover:bg-[#F0EBE1] rounded-lg border border-[#EAE4DC] text-stone-700 transition-colors font-serif italic"
              >
                ✨ "What is one thing I learned today that shifted my perspective?"
              </button>
              <button
                onClick={() => setInputText("I am feeling overwhelmed with choices regarding my next project. Help me organize my thoughts.")}
                className="p-3 text-xs bg-white hover:bg-[#F0EBE1] rounded-lg border border-[#EAE4DC] text-stone-700 transition-colors font-serif italic"
              >
                💡 "I am feeling overwhelmed with choices. Help me organize my thoughts."
              </button>
              <button
                onClick={() => setInputText("Three things I am grateful for today and why they matter to me:")}
                className="p-3 text-xs bg-white hover:bg-[#F0EBE1] rounded-lg border border-[#EAE4DC] text-stone-700 transition-colors font-serif italic"
              >
                🌿 "Three things I am grateful for today and why they matter to me:"
              </button>
            </div>
          </div>
        ) : (
          currentEntry.messages.map((message) => {
            const isUser = message.role === "user";

            return (
              <div
                key={message.id}
                id={`message-bubble-${message.id}`}
                className={`flex gap-3 max-w-3xl ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-2xs ${
                    isUser
                      ? "bg-[#2D3B2C] text-[#FAF8F5]"
                      : "bg-[#F0EBE1] border border-[#DFD7CB] text-[#3A4D39]"
                  }`}
                >
                  {isUser ? <UserIcon className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                {/* Message Content */}
                <div
                  className={`rounded-xl px-5 py-4 text-sm leading-relaxed ${
                    isUser
                      ? "bg-[#2D3B2C] text-[#FAF8F5] rounded-tr-xs shadow-2xs"
                      : "bg-white border border-[#EAE4DC] text-stone-800 rounded-tl-xs shadow-2xs"
                  }`}
                >
                  {isUser ? (
                    <div className="whitespace-pre-wrap font-sans text-stone-100">{message.content}</div>
                  ) : (
                    <div className="markdown-body prose prose-stone prose-sm max-w-none prose-headings:font-serif prose-headings:font-semibold prose-headings:text-stone-900 prose-p:text-stone-700 prose-li:text-stone-700 prose-strong:text-stone-900">
                      <ReactMarkdown>{cleanAiChatMessage(message.content)}</ReactMarkdown>
                    </div>
                  )}

                  <div
                    className={`text-[10px] mt-2 text-right ${
                      isUser ? "text-stone-300" : "text-stone-400"
                    }`}
                  >
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Loading indicator when Gemini is generating */}
        {isGenerating && (
          <div id="ai-generating-loader" className="flex gap-3 max-w-3xl mr-auto">
            <div className="w-7 h-7 rounded-full bg-[#F0EBE1] border border-[#DFD7CB] text-[#3A4D39] flex items-center justify-center shrink-0">
              <Sparkles className="w-3.5 h-3.5 animate-spin text-[#3A4D39]" />
            </div>
            <div className="bg-white border border-[#EAE4DC] rounded-xl rounded-tl-xs px-5 py-4 text-sm text-stone-600 flex items-center gap-3 shadow-2xs">
              <Loader2 className="w-4 h-4 animate-spin text-[#3A4D39]" />
              <span className="font-serif italic">Gemini is reflecting on your thoughts...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div id="editor-input-box" className="p-4 md:p-5 border-t border-[#EAE4DC] bg-[#FAF8F5]/95">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="relative bg-white border border-[#DFD7CB] rounded-xl p-3 focus-within:border-[#3A4D39] focus-within:ring-1 focus-within:ring-[#3A4D39]/40 transition-all shadow-2xs">
            <textarea
              ref={textareaRef}
              id="reflection-user-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder={`Write your reflection in ${activeMode.replace("-", " ")} mode (Shift+Enter for newline)...`}
              rows={2}
              disabled={isGenerating}
              className="w-full bg-transparent resize-none text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none px-1 py-1 disabled:opacity-50 font-sans"
            />

            <div className="flex items-center justify-between pt-2 px-1 border-t border-[#F0EBE1] mt-1">
              <span className="text-[11px] text-stone-400">
                Shift + Enter for new line • Enter to reflect
              </span>

              <button
                id="send-reflection-btn"
                type="submit"
                disabled={!inputText.trim() || isGenerating}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#2D3B2C] hover:bg-[#1E281D] text-[#FAF8F5] text-xs uppercase tracking-wider font-semibold rounded-lg transition-all shadow-xs active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Reflecting...</span>
                  </>
                ) : (
                  <>
                    <span>Send Turn</span>
                    <Send className="w-3 h-3" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
