'use client';

import { Link, Plus, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { EpisodeCard } from './EpisodeCard';
import { EpisodeMetadata } from '@/types';

interface MultiEpisodeInputProps {
  episodes: string[];
  onChange: (episodes: string[]) => void;
  disabled?: boolean;
  onEpisodeDataChange?: (episodeDataList: (EpisodeMetadata | null)[]) => void;
}

const fetchEpisodeData = async (url: string): Promise<EpisodeMetadata | null> => {
  try {
    const res = await fetch('/api/spotify-metadata', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ episodeUrl: url }),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
};

export function MultiEpisodeInput({ episodes, onChange, disabled, onEpisodeDataChange }: MultiEpisodeInputProps) {
  const [episodeDataList, setEpisodeDataList] = useState<(EpisodeMetadata | null)[]>([]);
  const [loadingStates, setLoadingStates] = useState<boolean[]>([]);

  useEffect(() => {
    // Initialize arrays if needed
    if (episodeDataList.length !== episodes.length) {
      setEpisodeDataList(new Array(episodes.length).fill(null));
      setLoadingStates(new Array(episodes.length).fill(false));
    }
  }, [episodes.length]);

  // Notify parent when episode data changes
  useEffect(() => {
    if (onEpisodeDataChange) {
      onEpisodeDataChange(episodeDataList);
    }
  }, [episodeDataList, onEpisodeDataChange]);

  const handleAddEpisode = () => {
    onChange([...episodes, '']);
    setEpisodeDataList([...episodeDataList, null]);
    setLoadingStates([...loadingStates, false]);
  };

  const handleRemoveEpisode = (index: number) => {
    onChange(episodes.filter((_, i) => i !== index));
    setEpisodeDataList(episodeDataList.filter((_, i) => i !== index));
    setLoadingStates(loadingStates.filter((_, i) => i !== index));
  };

  const handleEpisodeChange = async (index: number, value: string) => {
    const newEpisodes = [...episodes];
    newEpisodes[index] = value;
    onChange(newEpisodes);

    // Reset episode data for this index
    setEpisodeDataList(prev => {
      const updated = [...prev];
      updated[index] = null;
      return updated;
    });

    // If URL looks like a Spotify episode URL, fetch metadata
    if (value.trim() && value.includes('open.spotify.com/episode/')) {
      setLoadingStates(prev => {
        const updated = [...prev];
        updated[index] = true;
        return updated;
      });

      const data = await fetchEpisodeData(value);

      setEpisodeDataList(prev => {
        const updated = [...prev];
        updated[index] = data;
        return updated;
      });

      setLoadingStates(prev => {
        const updated = [...prev];
        updated[index] = false;
        return updated;
      });
    }
  };

  return (
    <div>
      <div className="space-y-3">
        {episodes.map((episode, index) => {
          const episodeData = episodeDataList[index];
          const isLoading = loadingStates[index];

          // If we have episode data, show the card
          if (episodeData) {
            return (
              <EpisodeCard
                key={index}
                episode={episodeData}
                onRemove={() => handleRemoveEpisode(index)}
                disabled={disabled}
              />
            );
          }

          // Otherwise show the input field
          return (
            <div key={index}>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <Link className="size-5 text-[#b3b3b3]" />
                  </div>
                  <input
                    type="url"
                    value={episode}
                    onChange={(e) => handleEpisodeChange(index, e.target.value)}
                    disabled={disabled || isLoading}
                    placeholder="https://open.spotify.com/episode/..."
                    className="w-full rounded-md border border-[#282828] bg-[#121212] py-3 pl-12 pr-4 text-white placeholder-[#6a6a6a] transition-colors hover:border-[#3e3e3e] focus:border-[#1DB954] focus:outline-none disabled:opacity-50"
                  />
                </div>

                {episodes.length > 1 && !isLoading && (
                  <button
                    onClick={() => handleRemoveEpisode(index)}
                    disabled={disabled}
                    className="flex size-10 shrink-0 items-center justify-center rounded-md border border-[#282828] text-[#b3b3b3] transition-colors hover:border-[#e22134] hover:bg-[#e22134]/10 hover:text-[#e22134] disabled:opacity-50"
                    title="Remove episode"
                  >
                    <X className="size-5" />
                  </button>
                )}
              </div>

              {isLoading && (
                <div className="mt-2 text-sm text-[#1DB954]">Fetching episode details...</div>
              )}
            </div>
          );
        })}

        {/* Show Add Episode button only if the last episode has data */}
        {episodeDataList[episodeDataList.length - 1] && (
          <button
            onClick={handleAddEpisode}
            disabled={disabled}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-[#282828] py-3 text-sm text-[#b3b3b3] transition-colors hover:border-[#1DB954] hover:bg-[#1DB954]/5 hover:text-[#1DB954] disabled:opacity-50"
          >
            <div className="flex size-6 items-center justify-center rounded-full border border-current">
              <Plus className="size-4" />
            </div>
            Add Episode
          </button>
        )}

        {/* Show Add Episode button if there are no episodes */}
        {episodes.length === 0 && (
          <button
            onClick={handleAddEpisode}
            disabled={disabled}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-[#282828] py-3 text-sm text-[#b3b3b3] transition-colors hover:border-[#1DB954] hover:bg-[#1DB954]/5 hover:text-[#1DB954] disabled:opacity-50"
          >
            <div className="flex size-6 items-center justify-center rounded-full border border-current">
              <Plus className="size-4" />
            </div>
            Add Episode
          </button>
        )}
      </div>
    </div>
  );
}
