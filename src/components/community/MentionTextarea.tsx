import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sparkles, Loader2, Bot } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface MentionUser {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  soul_title?: string | null;
  is_ai?: boolean;
}

interface MentionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
  disabled?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}

export interface MentionTextareaRef {
  focus: () => void;
  setSelectionRange: (start: number, end: number) => void;
  textarea: HTMLTextAreaElement | null;
}

export const MentionTextarea = forwardRef<MentionTextareaRef, MentionTextareaProps>(
  ({ value, onChange, placeholder, className, rows = 2, disabled, onFocus, onBlur }, ref) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const [mentionQuery, setMentionQuery] = useState("");
    const [mentionStartIndex, setMentionStartIndex] = useState(-1);
    const [users, setUsers] = useState<MentionUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useImperativeHandle(ref, () => ({
      focus: () => textareaRef.current?.focus(),
      setSelectionRange: (start: number, end: number) => textareaRef.current?.setSelectionRange(start, end),
      textarea: textareaRef.current,
    }));

    // Search users when mention query changes
    useEffect(() => {
      if (!showDropdown) return;

      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

      searchTimeoutRef.current = setTimeout(async () => {
        setLoading(true);
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const user = session?.user;
          
          // Search soul profiles
          let profileQuery = supabase
            .from("soul_profiles")
            .select("user_id, display_name, avatar_url, soul_title")
            .neq("user_id", user?.id || "")
            .order("display_name")
            .limit(15);

          if (mentionQuery.length > 0) {
            profileQuery = profileQuery.ilike("display_name", `${mentionQuery}%`);
          }

          // Search AI companions (user's own)
          let aiQuery = supabase
            .from("ai_companion_displays")
            .select("id, display_name, photo_url, user_id")
            .eq("user_id", user?.id || "")
            .eq("is_visible", true)
            .limit(5);

          if (mentionQuery.length > 0) {
            aiQuery = aiQuery.ilike("display_name", `${mentionQuery}%`);
          }

          const [profileRes, aiRes] = await Promise.all([profileQuery, aiQuery]);

          const profileUsers: MentionUser[] = (profileRes.data || []).map(p => ({
            ...p,
            is_ai: false,
          }));

          const aiUsers: MentionUser[] = (aiRes.data || []).map(a => ({
            user_id: a.id,
            display_name: a.display_name,
            avatar_url: a.photo_url,
            soul_title: "AI Companion",
            is_ai: true,
          }));

          // AI companions first, then soul profiles
          setUsers([...aiUsers, ...profileUsers]);
          setSelectedIndex(0);
        } catch (err) {
          console.error("Error searching users:", err);
        } finally {
          setLoading(false);
        }
      }, 200);

      return () => {
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      };
    }, [mentionQuery, showDropdown]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      const cursorPos = e.target.selectionStart;
      onChange(newValue);

      // Check if we should show the mention dropdown
      const textBeforeCursor = newValue.slice(0, cursorPos);
      const lastAtIndex = textBeforeCursor.lastIndexOf("@");

      if (lastAtIndex !== -1) {
        const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
        // Only show if @ is at start or preceded by whitespace, and no spaces in the query
        const charBeforeAt = lastAtIndex > 0 ? newValue[lastAtIndex - 1] : " ";
        if (/\s/.test(charBeforeAt) || lastAtIndex === 0) {
          if (!/\s/.test(textAfterAt)) {
            setShowDropdown(true);
            setMentionQuery(textAfterAt);
            setMentionStartIndex(lastAtIndex);
            return;
          }
        }
      }

      setShowDropdown(false);
    };

    const selectUser = (user: MentionUser) => {
      const hasSpace = user.display_name.includes(" ");
      const mention = hasSpace ? `@"${user.display_name}" ` : `@${user.display_name} `;
      const before = value.slice(0, mentionStartIndex);
      const cursorPos = textareaRef.current?.selectionStart || value.length;
      const after = value.slice(cursorPos);
      const newValue = before + mention + after;
      onChange(newValue);
      setShowDropdown(false);

      // Restore focus and cursor position
      setTimeout(() => {
        const newPos = before.length + mention.length;
        textareaRef.current?.focus();
        textareaRef.current?.setSelectionRange(newPos, newPos);
      }, 10);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (!showDropdown || users.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, users.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        selectUser(users[selectedIndex]);
      } else if (e.key === "Escape") {
        setShowDropdown(false);
      }
    };

    // Scroll selected item into view
    useEffect(() => {
      if (showDropdown && dropdownRef.current) {
        const items = dropdownRef.current.querySelectorAll("[data-mention-item]");
        items[selectedIndex]?.scrollIntoView({ block: "nearest" });
      }
    }, [selectedIndex, showDropdown]);

    // Close dropdown on outside click
    useEffect(() => {
      const handler = (e: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(e.target as Node) &&
          textareaRef.current &&
          !textareaRef.current.contains(e.target as Node)
        ) {
          setShowDropdown(false);
        }
      };
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
      <div className="relative flex-1 min-w-0">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={onFocus}
          onBlur={(e) => {
            // Delay to allow click on dropdown
            setTimeout(() => {
              if (!dropdownRef.current?.contains(document.activeElement)) {
                onBlur?.();
              }
            }, 150);
          }}
          placeholder={placeholder}
          className={className}
          rows={rows}
          disabled={disabled}
        />

        {showDropdown && (
          <div
            ref={dropdownRef}
            className="absolute z-50 left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-lg"
          >
            {loading ? (
              <div className="flex items-center justify-center py-4 gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching souls...
              </div>
            ) : users.length === 0 ? (
              <div className="py-4 text-center text-sm text-muted-foreground">
                No souls found {mentionQuery && `matching "${mentionQuery}"`}
              </div>
            ) : (
              users.map((user, index) => (
                <button
                  key={user.user_id}
                  data-mention-item
                  type="button"
                  onClick={() => selectUser(user)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors",
                    index === selectedIndex
                      ? "bg-primary/10 text-foreground"
                      : "hover:bg-accent/50 text-foreground"
                  )}
                >
                  <Avatar className="h-8 w-8 border border-primary/10">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {user.is_ai ? <Bot className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium truncate">{user.display_name}</p>
                      {user.is_ai && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium shrink-0">AI</span>
                      )}
                    </div>
                    {user.soul_title && (
                      <p className="text-xs text-muted-foreground truncate">{user.soul_title}</p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    );
  }
);

MentionTextarea.displayName = "MentionTextarea";
