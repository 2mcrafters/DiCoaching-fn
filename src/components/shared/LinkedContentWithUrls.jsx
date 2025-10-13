import React from 'react';
import { ExternalLink } from 'lucide-react';
import LinkedContent from './LinkedContent';

/**
 * Component that wraps LinkedContent and also converts URLs to clickable links
 * Handles URLs like: http://, https://, www., and standalone domain names
 */
const LinkedContentWithUrls = ({ text }) => {
  if (!text) return null;

  // Regular expression to detect URLs
  // Matches: http://, https://, www., or common domain patterns
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|(?:^|\s)([a-zA-Z0-9-]+\.(?:com|fr|org|net|edu|gov|info|biz|co|io)[^\s]*))/gi;

  // Split text by URLs
  const parts = [];
  let lastIndex = 0;
  let match;

  const textCopy = text;
  const regex = new RegExp(urlRegex);

  while ((match = regex.exec(textCopy)) !== null) {
    // Add text before the URL
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: textCopy.slice(lastIndex, match.index),
        key: `text-${lastIndex}`,
      });
    }

    // Add the URL
    let url = match[0].trim();
    // Add protocol if missing
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    parts.push({
      type: 'url',
      content: match[0].trim(),
      url: url,
      key: `url-${match.index}`,
    });

    lastIndex = regex.lastIndex;
  }

  // Add remaining text after last URL
  if (lastIndex < textCopy.length) {
    parts.push({
      type: 'text',
      content: textCopy.slice(lastIndex),
      key: `text-${lastIndex}`,
    });
  }

  // If no URLs found, just return LinkedContent
  if (parts.length === 0) {
    return <LinkedContent text={text} />;
  }

  return (
    <>
      {parts.map((part) => {
        if (part.type === 'url') {
          return (
            <a
              key={part.key}
              href={part.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline decoration-2 underline-offset-2 inline-flex items-center gap-1 font-medium"
              onClick={(e) => e.stopPropagation()}
            >
              {part.content}
              <ExternalLink className="h-3 w-3 inline" />
            </a>
          );
        } else {
          return (
            <LinkedContent key={part.key} text={part.content} />
          );
        }
      })}
    </>
  );
};

export default LinkedContentWithUrls;
