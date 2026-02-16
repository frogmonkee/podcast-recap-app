'use client';

import { Trash2 } from 'lucide-react';
import { EpisodeMetadata } from '@/types';

interface EpisodeCardProps {
  episode: EpisodeMetadata;
  onRemove: () => void;
  disabled?: boolean;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
}

export function EpisodeCard({ episode, onRemove, disabled }: EpisodeCardProps) {
  const cleanDescription = episode.description ? stripHtml(episode.description) : undefined;

  return (
    <div className="flex items-start gap-3 rounded-lg bg-[#121212] p-3 sm:items-center sm:gap-4 sm:p-4">
      {/* Thumbnail */}
      {episode.thumbnailUrl ? (
        <img
          src={episode.thumbnailUrl}
          alt={episode.title}
          className="size-16 shrink-0 rounded object-cover sm:size-20"
        />
      ) : (
        <div className="size-16 shrink-0 rounded bg-[#282828] flex items-center justify-center sm:size-20">
          <svg className="size-8 text-[#1DB954]" fill="currentColor" viewBox="0 0 20 20">
            <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
          </svg>
        </div>
      )}

      {/* Episode Info */}
      <div className="min-w-0 flex-1">
        <h3 className="mb-0.5 text-base font-bold text-white sm:mb-1 sm:text-xl">
          {episode.title}
        </h3>
        <p className="mb-1.5 text-sm text-[#b3b3b3] sm:mb-2 sm:text-base">
          {episode.showName}
        </p>
        {cleanDescription && (
          <p className="mb-2 text-xs text-[#b3b3b3] line-clamp-2 sm:mb-3 sm:text-sm">
            {cleanDescription}
          </p>
        )}
        {episode.publishDate && (
          <p className="text-xs text-white sm:text-sm">
            {new Date(episode.publishDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        )}
      </div>

      {/* Remove Button */}
      <button
        onClick={onRemove}
        disabled={disabled}
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#1DB954] text-white transition-transform hover:scale-105 disabled:opacity-50 sm:size-12"
        title="Remove episode"
      >
        <Trash2 className="size-4 text-black sm:size-5" />
      </button>
    </div>
  );
}
