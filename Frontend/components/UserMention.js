import { useState, useEffect } from 'react';

export default function UserMention({ text, users }) {
  const [processedText, setProcessedText] = useState('');

  useEffect(() => {
    if (!text || !users) return;

    const regex = /@(\w+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      const username = match[1];
      const user = users.find(u => 
        u.name.toLowerCase().includes(username.toLowerCase())
      );

      if (user) {
        parts.push(
          <span key={match.index} className="bg-primary/20 text-primary px-1 rounded">
            @{user.name}
          </span>
        );
      } else {
        parts.push(match[0]);
      }

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    setProcessedText(parts);
  }, [text, users]);

  return <div>{processedText}</div>;
}