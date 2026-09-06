import React from "react";
import { 
  Sparkles, 
  BookOpen, 
  Clock, 
  Tag, 
  ShieldCheck, 
  HelpCircle,
  FileCheck,
  Zap,
  CheckCircle,
  CheckSquare,
  Square,
  Brain
} from "lucide-react";
import type { JournalEntry } from "../types";

interface InsightPanelProps {
  currentEntry: JournalEntry;
  onUpdateEntry?: (updated: JournalEntry) => Promise<void>;
  onSendFollowUp: (prompt: string) => void;
  isGenerating: boolean;
}

export function InsightPanel({ currentEntry, onUpdateEntry, onSendFollowUp, isGenerating }: InsightPanelProps) {
  const userMessagesCount = currentEntry.messages.filter(m => m.role === "user").length;
  const wordCount = currentEntry.messages
    .filter(m => m.role === "user")
    .reduce((acc, curr) => acc + curr.content.trim().split(/\s+/).length, 0);

  const completedSteps = new Set(currentEntry.completedActionSteps || []);

  const handleToggleStep = (stepText: string) => {
    if (!onUpdateEntry) return;
    const nextCompleted = new Set(completedSteps);
    if (nextCompleted.has(stepText)) {
      nextCompleted.delete(stepText);
    } else {
      nextCompleted.add(stepText);
    }
    onUpdateEntry({
      ...currentEntry,
      completedActionSteps: Array.from(nextCompleted)
    });
  };

  const sentimentDisplay = currentEntry.sentimentScore != null 
    ? `${currentEntry.sentimentScore}/10` 
    : "—";

  return (
    <div id="insights-panel" className="w-80 bg-[#FAF8F5] border-l border-[#EAE4DC] flex flex-col h-full overflow-y-auto hidden xl:flex">
      {/* Header */}
      <div className="p-4 border-b border-[#EAE4DC] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-[#3A4D39]" />
          <h3 className="font-serif italic font-medium text-stone-900 text-sm">
            AI Synthesis & Context
          </h3>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EAE4DC] text-stone-700 font-mono font-medium">
          Gemini 3.7 Flash
        </span>
      </div>

      <div className="p-4 space-y-4 flex-1">
        {/* Summary Card */}
        <div className="bg-white p-4 rounded-xl border border-[#DFD7CB] shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-serif font-semibold text-stone-900 mb-2">
            <FileCheck className="w-4 h-4 text-[#3A4D39]" />
            <span>Executive Synthesis</span>
          </div>

          {currentEntry.summary ? (
            <p className="text-xs text-stone-600 leading-relaxed font-sans">
              {currentEntry.summary}
            </p>
          ) : (
            <p className="text-xs text-stone-400 font-serif italic">
              Summaries are generated automatically as you converse with Gemini.
            </p>
          )}
        </div>

        {/* Reflection Stats & Sentiment Telemetry */}
        <div id="sentiment-telemetry-widget" className="bg-white p-4 rounded-xl border border-[#DFD7CB] shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-serif font-semibold text-stone-900 mb-3">
            <Zap className="w-4 h-4 text-[#3A4D39]" />
            <span>Reflection & Sentiment Telemetry</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center mb-3">
            <div className="p-2 bg-[#FAF8F5] rounded-lg border border-[#EAE4DC]">
              <span className="block text-base font-serif font-semibold text-stone-900 font-mono">
                {userMessagesCount}
              </span>
              <span className="text-[9px] text-stone-500 uppercase tracking-wider font-sans">
                Turns
              </span>
            </div>
            <div className="p-2 bg-[#FAF8F5] rounded-lg border border-[#EAE4DC]">
              <span className="block text-base font-serif font-semibold text-stone-900 font-mono">
                {wordCount}
              </span>
              <span className="text-[9px] text-stone-500 uppercase tracking-wider font-sans">
                Words
              </span>
            </div>
            <div className="p-2 bg-[#FAF8F5] rounded-lg border border-[#EAE4DC]">
              <span id="sentiment-score-value" className="block text-base font-serif font-semibold text-[#3A4D39] font-mono">
                {sentimentDisplay}
              </span>
              <span className="text-[9px] text-stone-500 uppercase tracking-wider font-sans">
                Clarity / Mood
              </span>
            </div>
          </div>

          {currentEntry.sentimentScore != null && (
            <div className="w-full bg-[#EAE4DC] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#2D3B2C] h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(10, currentEntry.sentimentScore * 10))}%` }}
              />
            </div>
          )}
        </div>

        {/* Actionable Steps (Interactive Checklist Telemetry) */}
        {currentEntry.actionableSteps && currentEntry.actionableSteps.length > 0 && (
          <div id="action-items-checklist" className="bg-white p-4 rounded-xl border border-[#DFD7CB] shadow-2xs">
            <div className="flex items-center justify-between text-xs font-serif font-semibold text-stone-900 mb-2.5">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#3A4D39]" />
                <span>Action Items</span>
              </div>
              <span className="text-[10px] text-stone-400 font-mono font-normal">
                {completedSteps.size}/{currentEntry.actionableSteps.length} done
              </span>
            </div>
            <ul className="space-y-2">
              {currentEntry.actionableSteps.map((step, idx) => {
                const isChecked = completedSteps.has(step);
                return (
                  <li 
                    key={idx} 
                    onClick={() => handleToggleStep(step)}
                    className="flex items-start gap-2 text-xs text-stone-700 font-sans leading-relaxed cursor-pointer group hover:text-stone-900 transition-colors select-none"
                  >
                    <button
                      type="button"
                      className="mt-0.5 text-stone-400 group-hover:text-[#3A4D39] shrink-0 transition-colors focus:outline-none"
                    >
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-[#3A4D39]" />
                      ) : (
                        <Square className="w-4 h-4 text-stone-400" />
                      )}
                    </button>
                    <span className={`flex-1 ${isChecked ? "line-through text-stone-400" : "text-stone-700"}`}>
                      {step}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Suggested Follow-up Inquiries */}
        <div className="bg-white p-4 rounded-xl border border-[#DFD7CB] shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-serif font-semibold text-stone-900 mb-3">
            <HelpCircle className="w-4 h-4 text-[#3A4D39]" />
            <span>Thought Starters</span>
          </div>

          <div className="space-y-2">
            <button
              disabled={isGenerating}
              onClick={() => onSendFollowUp("Can you help me identify any cognitive blindspots in what I just wrote?")}
              className="w-full text-left p-2.5 rounded-lg bg-[#FAF8F5] hover:bg-[#F0EBE1] hover:border-[#DFD7CB] border border-[#EAE4DC] text-xs text-stone-700 transition-colors disabled:opacity-50 font-serif italic"
            >
              🔍 "What cognitive blindspots might I be overlooking?"
            </button>
            <button
              disabled={isGenerating}
              onClick={() => onSendFollowUp("Summarize the top 3 high-impact action items from this journal entry.")}
              className="w-full text-left p-2.5 rounded-lg bg-[#FAF8F5] hover:bg-[#F0EBE1] hover:border-[#DFD7CB] border border-[#EAE4DC] text-xs text-stone-700 transition-colors disabled:opacity-50 font-serif italic"
            >
              📋 "Summarize the top 3 high-impact action items."
            </button>
            <button
              disabled={isGenerating}
              onClick={() => onSendFollowUp("What would an alternative, positive reframing of this situation look like?")}
              className="w-full text-left p-2.5 rounded-lg bg-[#FAF8F5] hover:bg-[#F0EBE1] hover:border-[#DFD7CB] border border-[#EAE4DC] text-xs text-stone-700 transition-colors disabled:opacity-50 font-serif italic"
            >
              🌱 "How can I positively reframe this challenge?"
            </button>
          </div>
        </div>

        {/* Security & Isolation Callout */}
        <div className="p-3.5 bg-[#F0EBE1] border border-[#DFD7CB] rounded-xl text-stone-900 flex items-start gap-2.5 text-xs">
          <ShieldCheck className="w-4 h-4 text-[#3A4D39] shrink-0 mt-0.5" />
          <div className="text-[11px] leading-relaxed text-stone-700">
            <span className="font-serif font-semibold block text-stone-900 mb-0.5">Strict Cloud Privacy</span>
            Documents are encrypted and isolated under your private Firestore UID.
          </div>
        </div>
      </div>
    </div>
  );
}
