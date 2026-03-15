import React from "react";

/**
 * Renders text with @mentions and #hashtags highlighted.
 * Supports @Name, @"Full Name", and #hashtag patterns.
 */
export function renderMentions(text: string): React.ReactNode[] {
  if (!text) return [text];

  // Match @"Full Name", @Word, or #hashtag patterns
  const combinedRegex = /@"([^"]+)"|@(\w+)|#([a-zA-Z0-9_]+)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = combinedRegex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[1] || match[2]) {
      // It's a mention
      const displayName = match[1] || match[2];
      parts.push(
        <span
          key={`m-${match.index}`}
          className="text-primary font-semibold cursor-pointer hover:underline"
        >
          @{displayName}
        </span>
      );
    } else if (match[3]) {
      // It's a hashtag
      parts.push(
        <span
          key={`h-${match.index}`}
          className="text-primary cursor-pointer hover:underline"
        >
          #{match[3]}
        </span>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}
