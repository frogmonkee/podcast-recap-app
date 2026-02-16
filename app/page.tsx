'use client';

import { useState, useRef } from 'react';
import { Play } from 'lucide-react';
import { Episode, EpisodeMetadata } from '@/types';
import { useJob } from '@/hooks/useJob';
import { isValidSpotifyUrl } from '@/lib/utils';
import { MultiEpisodeInput } from '@/components/MultiEpisodeInput';
import { DurationSelector } from '@/components/DurationSelector';
import { SpoilerSlider } from '@/components/SpoilerSlider';
import { AudioPlayer } from '@/components/AudioPlayer';
import { GenerationProgress } from '@/components/GenerationProgress';
import { ImageWithFallback } from '@/components/ImageWithFallback';

export default function Home() {
  const [episodes, setEpisodes] = useState<string[]>(['']);
  const [episodeMetadataList, setEpisodeMetadataList] = useState<(EpisodeMetadata | null)[]>([]);
  const [duration, setDuration] = useState<1 | 5 | 10>(5);
  const [maxTimestamp, setMaxTimestamp] = useState<number>(3600); // Default 3600 seconds (60 minutes)

  const { submit, progress, result, isProcessing, error, reset } = useJob();

  // Get valid episodes (those with loaded metadata)
  const validEpisodeData = episodeMetadataList.filter((ep): ep is EpisodeMetadata => ep !== null);
  const hasValidEpisodes = validEpisodeData.length > 0;

  // Get the last episode for spoiler protection
  const lastEpisode = validEpisodeData[validEpisodeData.length - 1];
  const lastEpisodeNumber = validEpisodeData.length;

  // Use exact episode duration in seconds for spoiler slider
  const lastEpisodeDuration = lastEpisode?.duration || 3600;

  // Track the last episode ID so we only reset maxTimestamp when the episode itself changes
  const prevLastEpisodeTitleRef = useRef<string | null>(null);

  const handleEpisodeDataChange = (dataList: (EpisodeMetadata | null)[]) => {
    setEpisodeMetadataList(dataList);
    const validData = dataList.filter((ep): ep is EpisodeMetadata => ep !== null);
    const newLastEpisode = validData[validData.length - 1];
    const newLastTitle = newLastEpisode?.title ?? null;

    // Only reset maxTimestamp when the last episode actually changes
    if (newLastEpisode && newLastTitle !== prevLastEpisodeTitleRef.current) {
      prevLastEpisodeTitleRef.current = newLastTitle;
      setMaxTimestamp(newLastEpisode.duration);
    }
  };

  const handleGenerate = async () => {
    // Build Episode[] from metadata + URLs
    const validEpisodes: Episode[] = [];

    episodes.forEach((url, index) => {
      if (!url.trim() || !isValidSpotifyUrl(url)) return;

      const metadata = episodeMetadataList[index];
      const isLast = index === episodes.findLastIndex(u => isValidSpotifyUrl(u));

      validEpisodes.push({
        url,
        title: metadata?.title || `Episode ${validEpisodes.length + 1}`,
        showName: metadata?.showName,
        duration: metadata?.duration || 3600,
        audioUrl: metadata?.audioUrl,
        timestamp: isLast ? maxTimestamp : undefined,
      });
    });

    if (validEpisodes.length === 0) return;

    await submit(validEpisodes, duration);
  };

  const handleReset = () => {
    reset();
    setEpisodes(['']);
    setEpisodeMetadataList([]);
    setMaxTimestamp(3600);
  };

  const canGenerate = hasValidEpisodes && !isProcessing;

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      {/* Header */}
      <header className="border-b border-[#282828] bg-[#000000]">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <div className="flex items-center gap-4">
            <ImageWithFallback
              src="/logo.png"
              alt="Spotify Replay Logo"
              className="size-12 rounded-lg object-cover"
            />
            <h1 className="text-3xl font-bold">Spotify Replay</h1>
            <div className="mx-4 h-8 w-px bg-[#1DB954]" />
            <p className="text-base text-[#b3b3b3]">Pick up where you left off</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-6 py-8">
        {!result ? (
          <div className="space-y-6">
            {/* Input Section */}
            <div className="rounded-lg bg-[#181818] p-6">
              <h2 className="mb-4 text-center text-xl font-semibold">Summarize Any <span className="text-[#1DB954]">Spotify</span> Podcast</h2>

              <MultiEpisodeInput
                episodes={episodes}
                onChange={setEpisodes}
                disabled={isProcessing}
                onEpisodeDataChange={handleEpisodeDataChange}
              />

              {hasValidEpisodes && (
                <>
                  <div className="mt-6">
                    <SpoilerSlider
                      value={maxTimestamp}
                      onChange={setMaxTimestamp}
                      disabled={isProcessing}
                      episodeDuration={lastEpisodeDuration}
                      episodeTitle={lastEpisode?.title}
                      episodeNumber={lastEpisodeNumber}
                    />
                  </div>

                  <div className="mt-6">
                    <DurationSelector
                      value={duration}
                      onChange={setDuration}
                      disabled={isProcessing}
                    />
                  </div>
                </>
              )}

              {error && (
                <div className="mt-4 rounded-md bg-[#e22134]/10 border border-[#e22134] px-4 py-3">
                  <p className="text-sm text-[#e22134]">{error}</p>
                </div>
              )}

              <div className="mt-6 flex justify-center">
                <button
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                  className="flex size-20 items-center justify-center rounded-full bg-[#1DB954] text-black shadow-[0_8px_24px_rgba(29,185,84,0.4)] transition-all hover:scale-105 hover:bg-[#1ed760] hover:shadow-[0_12px_32px_rgba(29,185,84,0.5)] disabled:opacity-50 disabled:shadow-none disabled:hover:scale-100"
                >
                  <Play className="size-8 fill-current" />
                </button>
              </div>
            </div>

            {/* Progress Section */}
            {isProcessing && (
              <GenerationProgress progress={progress} isProcessing={isProcessing} />
            )}
          </div>
        ) : (
          <AudioPlayer
            result={result}
            onReset={handleReset}
            episodeMetadata={validEpisodeData}
          />
        )}
      </main>
    </div>
  );
}
