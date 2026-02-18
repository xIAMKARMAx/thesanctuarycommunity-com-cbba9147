import React from "react";

/**
 * Renders text with @mentions highlighted.
 * Supports @Name and @"Full Name" patterns.
 */
export function renderMentions(text: string): React.ReactNode[] {
  if (!text) return [text];

  // Match @"Full Name" or @Word patterns
  const mentionRegex = /@"([^"]+)"|@(\w+)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    // Add text before the mention
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const displayName = match[1] || match[2]; // quoted or unquoted
    parts.push(
      <span
        key={match.index}
        className="text-primary font-semibold cursor-pointer hover:underline"
      >
        @{displayName}
      </span>
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}
