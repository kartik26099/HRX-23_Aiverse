import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface TagFilterProps {
  selectedTag?: string;
  onSelect: (tag: string | null) => void;
}

export const TagFilter: React.FC<TagFilterProps> = ({ selectedTag, onSelect }) => {
  const [tags, setTags] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTags = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('tags').select('*').order('name');
      if (!error && data) setTags(data);
      setLoading(false);
    };
    fetchTags();
  }, []);

  return (
    <div className="flex flex-wrap gap-2">
      <button
        className={`px-3 py-1 rounded ${!selectedTag ? 'bg-primary text-white' : 'bg-muted'}`}
        onClick={() => onSelect(null)}
      >
        All
      </button>
      {loading ? (
        <span className="text-xs text-muted-foreground">Loading...</span>
      ) : (
        tags.map((tag) => (
          <button
            key={tag.id}
            className={`px-3 py-1 rounded ${selectedTag === tag.name ? 'bg-primary text-white' : 'bg-muted'}`}
            onClick={() => onSelect(tag.name)}
          >
            #{tag.name}
          </button>
        ))
      )}
    </div>
  );
}; 