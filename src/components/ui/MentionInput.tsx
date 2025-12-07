"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface User {
  id: string;
  name: string;
  email: string;
}

interface MentionInputProps {
  value: string;
  onChange: (val: string) => void;
  onSend: () => void;
  users: User[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

interface MentionMatch {
  start: number;
  end: number;
  query: string;
}

export function MentionInput({
  value,
  onChange,
  onSend,
  users,
  placeholder = "Type @ to mention someone...",
  disabled = false,
  className = "",
}: MentionInputProps) {
  const [mentionMatch, setMentionMatch] = useState<MentionMatch | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Find mention match at cursor position
  const findMentionMatch = useCallback((text: string, cursorPos: number): MentionMatch | null => {
    // Find the start of the current word
    let start = cursorPos - 1;
    while (start >= 0 && /[\w@]/.test(text[start])) {
      start--;
    }
    start++;

    // Check if we're inside a mention (starts with @)
    if (start < text.length && text[start] === "@") {
      // Find the end of the mention
      let end = start + 1;
      while (end < text.length && /[\w\s]/.test(text[end])) {
        end++;
      }

      const mentionText = text.substring(start + 1, end).trim();
      return {
        start,
        end,
        query: mentionText,
      };
    }

    return null;
  }, []);

  // Update mention match when value or cursor position changes
  useEffect(() => {
    if (!textareaRef.current) return;

    const updateMentionMatch = () => {
      const cursorPos = textareaRef.current?.selectionStart || 0;
      const match = findMentionMatch(value, cursorPos);

      if (match) {
        setMentionMatch(match);
        setSelectedIndex(0);

        // Calculate dropdown position using a more accurate method
        if (textareaRef.current) {
          const rect = textareaRef.current.getBoundingClientRect();
          const style = window.getComputedStyle(textareaRef.current);
          const lineHeight = parseFloat(style.lineHeight) || 24;
          const paddingLeft = parseFloat(style.paddingLeft) || 16;
          const paddingTop = parseFloat(style.paddingTop) || 12;
          const fontSize = parseFloat(style.fontSize) || 14;
          
          // Create a temporary element to measure text width
          const measureEl = document.createElement("span");
          measureEl.style.position = "absolute";
          measureEl.style.visibility = "hidden";
          measureEl.style.whiteSpace = "pre-wrap";
          measureEl.style.font = style.font;
          measureEl.style.padding = style.padding;
          document.body.appendChild(measureEl);

          // Measure text before mention
          const textBeforeMention = value.substring(0, match.start);
          measureEl.textContent = textBeforeMention;
          const widthBefore = measureEl.offsetWidth;

          // Measure text in mention
          const textInMention = value.substring(match.start, cursorPos);
          measureEl.textContent = textBeforeMention + textInMention;
          const widthInMention = measureEl.offsetWidth;

          document.body.removeChild(measureEl);

          // Count lines before cursor
          const linesBefore = textBeforeMention.split("\n").length - 1;
          
          // Calculate position
          const top = rect.top + paddingTop + (linesBefore * lineHeight) - 8; // Position slightly above cursor
          const left = rect.left + paddingLeft + widthInMention;
          
          setDropdownPosition({ top, left });
        }
      } else {
        setMentionMatch(null);
      }
    };

    updateMentionMatch();

    // Update on input, click, and keyup
    const textarea = textareaRef.current;
    textarea.addEventListener("click", updateMentionMatch);
    textarea.addEventListener("keyup", updateMentionMatch);
    textarea.addEventListener("input", updateMentionMatch);

    return () => {
      textarea.removeEventListener("click", updateMentionMatch);
      textarea.removeEventListener("keyup", updateMentionMatch);
      textarea.removeEventListener("input", updateMentionMatch);
    };
  }, [value, findMentionMatch]);

  // Filter users based on mention query
  const filteredUsers = mentionMatch
    ? users.filter((user) => {
        const query = mentionMatch.query.toLowerCase();
        return (
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)
        );
      })
    : [];

  // Handle textarea input
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  // Handle keydown events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionMatch && filteredUsers.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredUsers.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredUsers.length) % filteredUsers.length);
      } else if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        selectUser(filteredUsers[selectedIndex]);
      } else if (e.key === "Escape") {
        e.preventDefault();
        setMentionMatch(null);
      }
    } else if (e.key === "Enter" && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      onSend();
    } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      // Allow Cmd/Ctrl+Enter for newline
      return;
    }
  };

  // Select a user from the dropdown
  const selectUser = (user: User) => {
    if (!mentionMatch || !textareaRef.current) return;

    const beforeMention = value.substring(0, mentionMatch.start);
    const afterMention = value.substring(mentionMatch.end);
    const newValue = `${beforeMention}@${user.name} ${afterMention}`;

    onChange(newValue);
    setMentionMatch(null);

    // Set cursor position after the mention
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = beforeMention.length + `@${user.name} `.length;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        textareaRef.current.focus();
      }
    }, 0);
  };

  // Scroll selected item into view
  useEffect(() => {
    if (dropdownRef.current && selectedIndex >= 0) {
      const selectedElement = dropdownRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [selectedIndex]);

  return (
    <div className={`relative ${className}`}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full min-h-[120px] rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed"
        rows={4}
      />

      {/* Mention Dropdown */}
      {mentionMatch && filteredUsers.length > 0 && (
        <div
          ref={dropdownRef}
          className="fixed z-50 w-64 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-2xl shadow-black/10"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            transform: "translateY(-100%)",
            marginTop: "-8px",
          }}
        >
          <div className="p-2 space-y-1">
            {filteredUsers.map((user, index) => (
              <button
                key={user.id}
                type="button"
                onClick={() => selectUser(user)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
                  index === selectedIndex
                    ? "bg-blue-50 text-blue-900 border border-blue-200"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white text-xs font-semibold flex-shrink-0">
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">
                      {user.name}
                    </div>
                    <div className="text-xs text-slate-500 truncate">{user.email}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No matches message */}
      {mentionMatch && filteredUsers.length === 0 && mentionMatch.query.length > 0 && (
        <div
          className="fixed z-50 w-64 rounded-xl border border-slate-200 bg-white shadow-2xl shadow-black/10 p-4"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            transform: "translateY(-100%)",
            marginTop: "-8px",
          }}
        >
          <div className="text-sm text-slate-500 text-center">
            No users found matching "@{mentionMatch.query}"
          </div>
        </div>
      )}
    </div>
  );
}

