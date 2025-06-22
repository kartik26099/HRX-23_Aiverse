import React, { useState } from 'react';

interface ReactionBarProps {
  initialCount: number;
  reacted: boolean;
  onReact: () => void;
}

export const ReactionBar: React.FC<ReactionBarProps> = ({ initialCount, reacted, onReact }) => {
  const [count, setCount] = useState(initialCount);
  const [hasReacted, setHasReacted] = useState(reacted);

  const handleReact = () => {
    if (!hasReacted) {
      setCount(count + 1);
      setHasReacted(true);
      onReact();
    }
  };

  return (
    <button
      className={`flex items-center gap-1 px-2 py-1 rounded ${hasReacted ? 'bg-primary text-white' : 'bg-muted'}`}
      onClick={handleReact}
      disabled={hasReacted}
    >
      👍 {count}
    </button>
  );
}; 