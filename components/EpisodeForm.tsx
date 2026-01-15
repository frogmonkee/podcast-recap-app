'use client';

import { useState } from 'react';
import { Episode, EpisodeMetadata } from '@/types';
import { isValidSpotifyUrl } from '@/lib/utils';
import TimestampSlider from './TimestampSlider';
import EpisodeCard from './EpisodeCard';

interface EpisodeFormProps {
  onEpisodesChange: (episodes: Episode[]) => void;
  onTargetDurationChange: (duration: 1 | 5 | 10) => void;
}

export default function EpisodeForm({ onEpisodesChange, onTargetDurationChange }: EpisodeFormProps) {
  const [urls, setUrls] = useState<string[]>(['']);
  const [episodeMetadata, setEpisodeMetadata] = useState<(EpisodeMetadata | null)[]>([null]);
  const [targetDuration, setTargetDuration] = useState<1 | 5 | 10>(5);
  const [lastEpisodeDuration, setLastEpisodeDuration] = useState<number | null>(null);
  const [lastEpisodeTimestamp, setLastEpisodeTimestamp] = useState<number | null>(null);
  const [fetchingMetadata, setFetchingMetadata] = useState(false);

  const addEpisode = () => {
    setUrls([...urls, '']);
    setEpisodeMetadata([...episodeMetadata, null]);
  };

  const removeEpisode = (index: number) => {
    if (urls.length > 1) {
      const newUrls = urls.filter((_, i) => i !== index);
      const newMetadata = episodeMetadata.filter((_, i) => i !== index);
      setUrls(newUrls);
      setEpisodeMetadata(newMetadata);
      updateEpisodes(newUrls, lastEpisodeTimestamp);
    }
  };

  const handleUrlChange = async (index: number, value: string) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);

    // If valid URL, fetch metadata for this episode
    let metadata: EpisodeMetadata | null = null;
    if (isValidSpotifyUrl(value)) {
      metadata = await fetchEpisodeMetadata(value, index);
    } else {
      // Clear metadata if URL becomes invalid
      const newMetadata = [...episodeMetadata];
      newMetadata[index] = null;
      setEpisodeMetadata(newMetadata);
    }

    // If this is the last episode and it's a valid URL, reuse metadata for timestamp slider
    const lastNonEmptyIndex = newUrls.findLastIndex(url => url.trim() !== '');
    if (index === lastNonEmptyIndex && isValidSpotifyUrl(value) && metadata) {
      // Reuse the metadata we just fetched instead of making another API call
      setLastEpisodeDuration(metadata.duration);
      setLastEpisodeTimestamp(metadata.duration);
    } else if (index === lastNonEmptyIndex) {
      // Last episode changed but invalid/empty
      setLastEpisodeDuration(null);
      setLastEpisodeTimestamp(null);
    }

    updateEpisodes(newUrls, lastEpisodeTimestamp);
  };

  const fetchEpisodeMetadata = async (url: string, index: number): Promise<EpisodeMetadata | null> => {
    try {
      // Call our API endpoint to fetch Spotify oEmbed metadata
      const response = await fetch('/api/spotify-metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          episodeUrl: url,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch metadata');
      }

      const metadata: EpisodeMetadata = await response.json();

      const newMetadata = [...episodeMetadata];
      newMetadata[index] = metadata;
      setEpisodeMetadata(newMetadata);

      return metadata;
    } catch (error) {
      console.error('Failed to fetch episode metadata:', error);
      // Clear metadata on error
      const newMetadata = [...episodeMetadata];
      newMetadata[index] = null;
      setEpisodeMetadata(newMetadata);
      return null;
    }
  };

  const fetchLastEpisodeMetadata = async (url: string) => {
    setFetchingMetadata(true);
    try {
      // Fetch duration from same metadata endpoint
      const response = await fetch('/api/spotify-metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          episodeUrl: url,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch metadata');
      }

      const metadata: EpisodeMetadata = await response.json();

      // Increment Listen Notes API call counter if call was made
      if (metadata.listenNotesCallMade) {
        const currentCount = parseInt(localStorage.getItem('listenNotesCallCount') || '0', 10);
        localStorage.setItem('listenNotesCallCount', (currentCount + 1).toString());
      }

      setLastEpisodeDuration(metadata.duration);
      setLastEpisodeTimestamp(metadata.duration); // Default to full duration
    } catch (error) {
      console.error('Failed to fetch last episode metadata:', error);
      // Fallback to 1 hour if fetch fails
      // TODO: Revisit this 1-hour fallback default
      setLastEpisodeDuration(3600);
      setLastEpisodeTimestamp(3600);
    } finally {
      setFetchingMetadata(false);
    }
  };

  const handleTimestampChange = (seconds: number) => {
    setLastEpisodeTimestamp(seconds);
    updateEpisodes(urls, seconds);
  };

  const updateEpisodes = (currentUrls: string[], timestamp: number | null) => {
    const validUrls = currentUrls.filter(url => isValidSpotifyUrl(url));

    const episodes: Episode[] = validUrls.map((url, index) => {
      const isLast = index === validUrls.length - 1;
      const metadata = episodeMetadata[index];

      return {
        url,
        title: metadata?.title || `Episode ${index + 1}`,
        showName: metadata?.showName,
        duration: metadata?.duration || 3600, // fallback to 1 hour
        audioUrl: metadata?.audioUrl,
        timestamp: isLast && timestamp !== null ? timestamp : undefined,
      };
    });

    onEpisodesChange(episodes);
  };

  const handleDurationChange = (duration: 1 | 5 | 10) => {
    setTargetDuration(duration);
    onTargetDurationChange(duration);
  };

  const lastNonEmptyIndex = urls.findLastIndex(url => url.trim() !== '');
  const showTimestampSlider = lastNonEmptyIndex >= 0 && lastEpisodeDuration !== null;
  const lastEpisodeMetadata = lastNonEmptyIndex >= 0 ? episodeMetadata[lastNonEmptyIndex] : null;

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold text-gray-900">Episode URLs</h2>

      {/* Episode URL Inputs */}
      <div className="space-y-4">
        {urls.map((url, index) => (
          <div key={index} className="space-y-3">
            {/* Show episode card if metadata is loaded, otherwise show input */}
            {episodeMetadata[index] ? (
              <EpisodeCard
                metadata={episodeMetadata[index]}
                episodeNumber={index + 1}
                onRemove={() => removeEpisode(index)}
                showRemove={urls.length > 1}
              />
            ) : (
              <div className="flex gap-2">
                <div className="flex-1">
                  <label
                    htmlFor={`episode-${index}`}
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Episode {index + 1} {index === 0 && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    id={`episode-${index}`}
                    type="url"
                    value={url}
                    onChange={(e) => handleUrlChange(index, e.target.value)}
                    placeholder="https://open.spotify.com/episode/..."
                    className={`w-full px-4 py-3 text-base border-2 rounded-lg font-medium
                               focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all
                               ${url && !isValidSpotifyUrl(url)
                                 ? 'border-red-500 bg-red-50 text-red-900'
                                 : url
                                 ? 'border-green-500 bg-green-50 text-gray-900'
                                 : 'border-gray-300 bg-white text-gray-900 hover:border-gray-400'
                               }`}
                  />
                  {url && !isValidSpotifyUrl(url) && (
                    <p className="text-xs text-red-500 mt-1">Invalid Spotify episode URL</p>
                  )}
                </div>
                {urls.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeEpisode(index)}
                    className="mt-7 px-3 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove episode"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Another Episode Button */}
      <button
        type="button"
        onClick={addEpisode}
        className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg
                   text-gray-600 font-medium hover:border-blue-500 hover:text-blue-600
                   transition-colors flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add Another Episode
      </button>

      {/* Timestamp Slider (only shown for last episode) */}
      {showTimestampSlider && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            {lastEpisodeMetadata?.title || 'Final Episode Cutoff (Avoid Spoilers)'}
          </h3>
          {fetchingMetadata ? (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
              Fetching episode duration...
            </div>
          ) : (
            <TimestampSlider
              episodeDuration={lastEpisodeDuration!}
              onTimestampChange={handleTimestampChange}
              initialValue={lastEpisodeTimestamp || lastEpisodeDuration}
            />
          )}
        </div>
      )}

      {/* Summary Duration Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Summary Length <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-3 gap-3">
          {[1, 5, 10].map((duration) => (
            <button
              key={duration}
              onClick={() => handleDurationChange(duration as 1 | 5 | 10)}
              className={`px-4 py-3 rounded-md font-medium transition-colors
                         ${
                           targetDuration === duration
                             ? 'bg-blue-600 text-white'
                             : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                         }`}
            >
              {duration} min
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-500">
        * At least one episode URL is required
      </p>
    </div>
  );
}
