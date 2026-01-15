'use client';

import { EpisodeMetadata } from '@/types';

interface EpisodeCardProps {
  metadata: EpisodeMetadata | null;
  episodeNumber: number;
  onRemove?: () => void;
  showRemove: boolean;
}

export default function EpisodeCard({ metadata, episodeNumber, onRemove, showRemove }: EpisodeCardProps) {
  if (!metadata) return null;

  // Format file size for display
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return null;
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)}MB`;
  };

  const fileSizeDisplay = formatFileSize(metadata.audioFileSize);
  const isLargeFile = metadata.audioFileSize && metadata.audioFileSize > 25 * 1024 * 1024;

  return (
    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-500 rounded-lg">
      {/* Thumbnail */}
      <div className="flex-shrink-0">
        {metadata.thumbnailUrl ? (
          <img
            src={metadata.thumbnailUrl}
            alt={metadata.title}
            className="w-20 h-20 rounded-lg object-cover shadow-md"
          />
        ) : (
          <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center shadow-md">
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
            </svg>
          </div>
        )}
      </div>

      {/* Episode Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-blue-600 mb-1">Episode {episodeNumber}</p>
        <h3 className="text-sm font-bold text-gray-900 truncate">{metadata.title}</h3>
        {metadata.showName && (
          <p className="text-xs text-gray-600 truncate mt-1">{metadata.showName}</p>
        )}
        {fileSizeDisplay && (
          <p className={`text-xs mt-1 font-medium ${isLargeFile ? 'text-orange-600' : 'text-gray-500'}`}>
            {fileSizeDisplay} {isLargeFile && '(Will be chunked for transcription)'}
          </p>
        )}
      </div>

      {/* Remove Button */}
      {showRemove && onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="flex-shrink-0 p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
          title="Remove episode"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
