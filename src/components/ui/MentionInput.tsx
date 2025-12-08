"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface User {
  id: string;
  name: string;
  email: string;
}

interface SlackChannel {
  id: string;
  name: string;
}

interface MentionInputProps {
  value: string;
  onChange: (val: string) => void;
  onSend: () => void;
  users: User[];
  slackChannels?: SlackChannel[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

interface MentionMatch {
  start: number;
  end: number;
  query: string;
  type: "user" | "channel"; // @ for users, # for channels
}

// Default Slack channels (common channels)
const DEFAULT_SLACK_CHANNELS: SlackChannel[] = [
  { id: "general", name: "general" },
  { id: "random", name: "random" },
  { id: "announcements", name: "announcements" },
  { id: "marketing", name: "marketing" },
  { id: "sales", name: "sales" },
  { id: "support", name: "support" },
  { id: "engineering", name: "engineering" },
  { id: "design", name: "design" },
  { id: "product", name: "product" },
  { id: "operations", name: "operations" },
];

export function MentionInput({
  value,
  onChange,
  onSend,
  users,
  slackChannels = [],
  placeholder = "Type @ to mention someone...",
  disabled = false,
  className = "",
}: MentionInputProps) {
  // Combine default and provided channels
  const allChannels = [...DEFAULT_SLACK_CHANNELS, ...slackChannels];
  const [mentionMatch, setMentionMatch] = useState<MentionMatch | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Find mention match at cursor position (supports both @ and #)
  const findMentionMatch = useCallback((text: string, cursorPos: number): MentionMatch | null => {
    // Find the start of the current word
    let start = cursorPos - 1;
    while (start >= 0 && /[\w@#-]/.test(text[start])) {
      start--;
    }
    start++;

    // Check if we're inside a mention (starts with @ or #)
    if (start < text.length && (text[start] === "@" || text[start] === "#")) {
      const type = text[start] === "@" ? "user" : "channel";
      
      // Find the end of the mention (include space after mention if exists)
      let end = start + 1;
      while (end < text.length && /[\w-]/.test(text[end])) {
        end++;
      }
      
      // Include trailing space if exists
      if (end < text.length && text[end] === " ") {
        end++;
      }

      const mentionText = text.substring(start + 1, end).trim();
      return {
        start,
        end,
        query: mentionText,
        type,
      };
    }

    return null;
  }, []);

  // Find complete mention before cursor (for deletion)
  const findCompleteMentionBeforeCursor = useCallback((text: string, cursorPos: number): { start: number; end: number } | null => {
    if (cursorPos === 0) return null;
    
    // Strategy 1: Check if cursor is right after a mention (with or without space)
    let pos = cursorPos;
    let hasTrailingSpace = false;
    
    // Skip trailing space if cursor is right after a space
    if (pos > 0 && text[pos - 1] === " ") {
      pos--;
      hasTrailingSpace = true;
    }
    
    // Find the word boundaries
    let wordStart = pos;
    let wordEnd = pos;
    
    // Go backwards to find start of word
    while (wordStart > 0 && /[\w-]/.test(text[wordStart - 1])) {
      wordStart--;
    }
    
    // Go forwards to find end of word
    while (wordEnd < text.length && /[\w-]/.test(text[wordEnd])) {
      wordEnd++;
    }
    
    // Check if we found @ or # right before the word
    if (wordStart > 0 && (text[wordStart - 1] === "@" || text[wordStart - 1] === "#")) {
      const start = wordStart - 1;
      let mentionEnd = wordEnd;
      
      // Include trailing space
      if (hasTrailingSpace) {
        mentionEnd = cursorPos; // Include the space we skipped
      } else if (mentionEnd < text.length && text[mentionEnd] === " ") {
        mentionEnd++; // Include existing space
      }
      
      return { start, end: mentionEnd };
    }
    
    // Strategy 2: Check if cursor is inside a mention word
    // Go backwards from cursor to find @ or #
    let checkPos = cursorPos - 1;
    while (checkPos >= 0 && /[\w-]/.test(text[checkPos])) {
      checkPos--;
    }
    
    if (checkPos >= 0 && (text[checkPos] === "@" || text[checkPos] === "#")) {
      const start = checkPos;
      // Find end of mention
      let mentionEnd = cursorPos;
      while (mentionEnd < text.length && /[\w-]/.test(text[mentionEnd])) {
        mentionEnd++;
      }
      // Include trailing space
      if (mentionEnd < text.length && text[mentionEnd] === " ") {
        mentionEnd++;
      }
      return { start, end: mentionEnd };
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

  // Filter users or channels based on mention query
  const filteredUsers = mentionMatch && mentionMatch.type === "user"
    ? users.filter((user) => {
        const query = mentionMatch.query.toLowerCase();
        return (
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)
        );
      })
    : [];

  const filteredChannels = mentionMatch && mentionMatch.type === "channel"
    ? allChannels.filter((channel) => {
        const query = mentionMatch.query.toLowerCase();
        return channel.name.toLowerCase().includes(query);
      })
    : [];

  // Remove duplicates from channels
  const uniqueChannels = filteredChannels.filter((channel, index, self) =>
    index === self.findIndex((c) => c.id === channel.id)
  );

  // Handle textarea input
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  // Get current filtered items (users or channels)
  const filteredItems = mentionMatch?.type === "channel" ? uniqueChannels : filteredUsers;
  const maxItems = filteredItems.length;

  // Handle keydown events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const cursorPos = textarea.selectionStart;
    
    // Handle Backspace to remove complete mentions
    if (e.key === "Backspace" && cursorPos > 0) {
      const completeMention = findCompleteMentionBeforeCursor(value, cursorPos);
      if (completeMention) {
        e.preventDefault();
        const beforeMention = value.substring(0, completeMention.start);
        const afterMention = value.substring(completeMention.end);
        const newValue = beforeMention + afterMention;
        onChange(newValue);
        
        // Set cursor position after deletion
        setTimeout(() => {
          if (textareaRef.current) {
            const newCursorPos = completeMention.start;
            textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
            textareaRef.current.focus();
          }
        }, 0);
        return;
      }
    }
    
    // Handle Delete key (forward delete) - check if cursor is at start of a mention
    if (e.key === "Delete" && cursorPos < value.length) {
      // Check if we're at the start of a mention (@ or #)
      if (value[cursorPos] === "@" || value[cursorPos] === "#") {
        // Find the end of this mention
        let mentionEnd = cursorPos + 1;
        while (mentionEnd < value.length && /[\w-]/.test(value[mentionEnd])) {
          mentionEnd++;
        }
        // Include trailing space if exists
        if (mentionEnd < value.length && value[mentionEnd] === " ") {
          mentionEnd++;
        }
        
        e.preventDefault();
        const beforeMention = value.substring(0, cursorPos);
        const afterMention = value.substring(mentionEnd);
        const newValue = beforeMention + afterMention;
        onChange(newValue);
        
        // Cursor stays at same position
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.setSelectionRange(cursorPos, cursorPos);
            textareaRef.current.focus();
          }
        }, 0);
        return;
      }
    }
    
    if (mentionMatch && maxItems > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % maxItems);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + maxItems) % maxItems);
      } else if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (mentionMatch.type === "channel") {
          selectChannel(uniqueChannels[selectedIndex]);
        } else {
          selectUser(filteredUsers[selectedIndex]);
        }
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

  // Select a channel from the dropdown
  const selectChannel = (channel: SlackChannel) => {
    if (!mentionMatch || !textareaRef.current) return;

    const beforeMention = value.substring(0, mentionMatch.start);
    const afterMention = value.substring(mentionMatch.end);
    const newValue = `${beforeMention}#${channel.name} ${afterMention}`;

    onChange(newValue);
    setMentionMatch(null);

    // Set cursor position after the mention
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = beforeMention.length + `#${channel.name} `.length;
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

      {/* Mention Dropdown - Users */}
      {mentionMatch && mentionMatch.type === "user" && filteredUsers.length > 0 && (
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

      {/* Mention Dropdown - Channels */}
      {mentionMatch && mentionMatch.type === "channel" && uniqueChannels.length > 0 && (
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
            {uniqueChannels.map((channel, index) => (
              <button
                key={channel.id}
                type="button"
                onClick={() => selectChannel(channel)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
                  index === selectedIndex
                    ? "bg-purple-50 text-purple-900 border border-purple-200"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs font-semibold flex-shrink-0">
                    #
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">
                      {channel.name}
                    </div>
                    <div className="text-xs text-slate-500 truncate">Slack channel</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No matches message */}
      {mentionMatch && filteredItems.length === 0 && mentionMatch.query.length > 0 && (
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
            {mentionMatch.type === "channel" 
              ? `No channels found matching "#${mentionMatch.query}"`
              : `No users found matching "@${mentionMatch.query}"`}
          </div>
        </div>
      )}
    </div>
  );
}

