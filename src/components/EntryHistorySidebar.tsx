import React, { useState } from "react";
import { 
  Plus, 
  Trash2, 
  Search, 
  Clock, 
  Sparkles, 
  ChevronRight, 
  BookMarked,
  Filter
} from "lucide-react";
import type { JournalEntry } from "../types";

interface EntryHistorySidebarProps {
  entries: JournalEntry[];
  selectedEntryId: string | null;
  onSelectEntry: (entry: JournalEntry) => void;
  onNewEntry: () => void;
  onDeleteEntry: (entryId: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function EntryHistorySidebar({
  entries,
  selectedEntryId,
  onSelectEntry,
  onNewEntry,
  onDeleteEntry,
  isOpen,
  onClose
}: EntryHistorySidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Extract all unique tags
  const allTags = Array.from(
    new Set(entries.flatMap(e => e.tags || []))
  ).filter(Boolean);

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = 
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entry.summary && entry.summary.toLowerCase().includes(searchQuery.toLowerCase())) ||
      entry.messages.some(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTag = !selectedTag || (entry.tags && entry.tags.includes(selectedTag));

    return matchesSearch && matchesTag;
  });

  function formatDate(isoString: string) {
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
      }).format(date);
    } catch {
      return "Recent";
    }
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-stone-900/30 backdrop-blur-xs z-30 lg:hidden"
        />
      )}

      <aside
        id="journal-history-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-40 w-80 bg-[#FAF8F5] border-r border-[#EAE4DC] flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-[#EAE4DC] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookMarked className="w-4 h-4 text-[#3A4D39]" />
              <h2 className="font-serif italic font-medium text-stone-900 text-base">
                Reflection History
              </h2>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EAE4DC] text-stone-700 font-mono font-medium">
              {entries.length}
            </span>
          </div>

          {/* New Reflection Button */}
          <button
            id="new-reflection-btn"
            onClick={() => {
              onNewEntry();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#2D3B2C] hover:bg-[#1E281D] text-[#FAF8F5] text-xs uppercase tracking-wider font-semibold rounded-lg shadow-xs transition-all active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Reflection</span>
          </button>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search entries or insights..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#DFD7CB] rounded-md focus:outline-none focus:ring-1 focus:ring-[#3A4D39] text-stone-800 placeholder:text-stone-400 font-sans"
            />
          </div>

          {/* Tag Filter pills */}
          {allTags.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
              <button
                onClick={() => setSelectedTag(null)}
                className={`px-2 py-0.5 rounded-md whitespace-nowrap text-[11px] transition-colors ${
                  selectedTag === null
                    ? "bg-[#2D3B2C] text-[#FAF8F5] font-medium"
                    : "bg-[#F0EBE1] text-stone-600 hover:bg-[#E5DFD4]"
                }`}
              >
                All
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  className={`px-2 py-0.5 rounded-md whitespace-nowrap text-[11px] transition-colors ${
                    selectedTag === tag
                      ? "bg-[#3A4D39] text-[#FAF8F5] font-medium"
                      : "bg-[#F0EBE1] text-stone-600 hover:bg-[#E5DFD4]"
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Entries List */}
        <div id="entries-history-list" className="flex-1 overflow-y-auto p-2 space-y-1.5 divide-y-0">
          {filteredEntries.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <p className="text-xs text-stone-500 mb-2 font-serif italic">No reflections found.</p>
              <button
                onClick={onNewEntry}
                className="text-xs text-[#3A4D39] hover:underline font-medium uppercase tracking-wider"
              >
                Start your first one
              </button>
            </div>
          ) : (
            filteredEntries.map((entry) => {
              const isSelected = selectedEntryId === entry.id;
              const previewText = entry.summary || 
                (entry.messages.length > 0 ? entry.messages[0].content : "No content yet...");

              return (
                <div
                  key={entry.id}
                  id={`history-entry-${entry.id}`}
                  onClick={() => {
                    onSelectEntry(entry);
                    onClose();
                  }}
                  className={`group relative p-3 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-white border-[#3A4D39] shadow-xs ring-1 ring-[#3A4D39]/30"
                      : "bg-[#FAF8F5] border-[#EAE4DC] hover:bg-white hover:border-[#DFD7CB]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="text-xs font-serif font-semibold text-stone-900 truncate flex-1">
                      {entry.title || "Untitled Reflection"}
                    </h3>
                    <button
                      id={`delete-entry-btn-${entry.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm("Are you sure you want to delete this reflection?")) {
                          onDeleteEntry(entry.id);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-stone-400 hover:text-red-600 rounded transition-opacity"
                      title="Delete Entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed mb-2 font-sans">
                    {previewText}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-stone-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(entry.updatedAt)}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 bg-[#F0EBE1] text-stone-600 font-mono rounded">
                      {entry.messages.length} {entry.messages.length === 1 ? "turn" : "turns"}
                    </span>
                  </div>

                  {entry.tags && entry.tags.length > 0 && (
                    <div className="flex items-center gap-1 mt-2 flex-wrap">
                      {entry.tags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-[9px] px-1.5 py-0.2 rounded bg-[#F0EBE1] text-stone-700 font-mono"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </aside>
    </>
  );
}
