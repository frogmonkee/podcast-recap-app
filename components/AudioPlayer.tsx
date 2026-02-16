'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, ArrowLeft } from 'lucide-react';
import { SummaryResult, EpisodeMetadata } from '@/types';

interface AudioPlayerProps {
  result: SummaryResult;
  onReset: () => void;
  episodeMetadata?: EpisodeMetadata[];
}

export function AudioPlayer({ result, onReset, episodeMetadata }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const volumeBarRef = useRef<HTMLDivElement>(null);

  const firstEpisode = episodeMetadata?.[0];
  const thumbnail = firstEpisode?.thumbnailUrl;
  const displayTitle = firstEpisode?.showName || 'Podcast Summary';

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setAudioDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const time = parseFloat(e.target.value);
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const togglePlaybackRate = () => {
    const audio = audioRef.current;
    if (!audio) return;

    const rates = [1, 1.25, 1.5, 2];
    const currentIndex = rates.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % rates.length;
    const newRate = rates[nextIndex];

    audio.playbackRate = newRate;
    setPlaybackRate(newRate);
  };

  const skipTime = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + seconds));
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleVolumeBarInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const bar = volumeBarRef.current;
    if (!bar) return;

    const updateFromEvent = (clientX: number) => {
      const rect = bar.getBoundingClientRect();
      const newVol = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      if (audioRef.current) audioRef.current.volume = newVol;
      setVolume(newVol);
    };

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    updateFromEvent(clientX);

    if ('touches' in e) {
      const onTouchMove = (ev: TouchEvent) => { ev.preventDefault(); updateFromEvent(ev.touches[0].clientX); };
      const onTouchEnd = () => { document.removeEventListener('touchmove', onTouchMove); document.removeEventListener('touchend', onTouchEnd); };
      document.addEventListener('touchmove', onTouchMove, { passive: false });
      document.addEventListener('touchend', onTouchEnd);
    } else {
      const onMouseMove = (ev: MouseEvent) => updateFromEvent(ev.clientX);
      const onMouseUp = () => { document.removeEventListener('mousemove', onMouseMove); document.removeEventListener('mouseup', onMouseUp); };
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={onReset}
        className="flex items-center gap-2 text-[#b3b3b3] transition-colors hover:text-white"
      >
        <ArrowLeft className="size-5" />
        <span className="text-sm">Summarize another podcast</span>
      </button>

      {/* Player Card */}
      <div className="rounded-lg bg-[#181818] p-12">
        {/* Album Art - Centered */}
        <div className="mx-auto mb-12 flex max-w-lg items-center justify-center">
          <div className="flex aspect-square w-96 items-center justify-center overflow-hidden rounded-lg bg-[#282828] shadow-2xl">
            {thumbnail ? (
              <img src={thumbnail} alt="Podcast Thumbnail" className="h-full w-full object-cover" />
            ) : (
              <svg width="160" height="160" viewBox="0 0 120 120" fill="none">
                <circle cx="60" cy="60" r="50" fill="#1DB954" opacity="0.2"/>
                <path d="M60 20C37.9 20 20 37.9 20 60s17.9 40 40 40 40-17.9 40-40S82.1 20 60 20zm0 72c-17.6 0-32-14.4-32-32s14.4-32 32-32 32 14.4 32 32-14.4 32-32 32z" fill="#1DB954"/>
                <path d="M52 44v32l24-16z" fill="#1DB954"/>
              </svg>
            )}
          </div>
        </div>

        {/* Track Info */}
        <div className="mb-10 text-center">
          <h2 className="mb-2 text-3xl font-bold">{displayTitle}</h2>
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <input
            type="range"
            min="0"
            max={audioDuration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[#4d4d4d] [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
            style={{
              background: audioDuration
                ? `linear-gradient(to right, #1DB954 0%, #1DB954 ${(currentTime / audioDuration) * 100}%, #4d4d4d ${(currentTime / audioDuration) * 100}%, #4d4d4d 100%)`
                : '#4d4d4d'
            }}
          />
        </div>

        {/* Time Display */}
        <div className="mb-10 flex justify-between text-sm text-[#b3b3b3]">
          <span>{formatTime(currentTime)}</span>
          <span>-{formatTime(audioDuration - currentTime)}</span>
        </div>

        {/* Controls */}
        <div className="mx-auto flex max-w-md items-center justify-center gap-6">
          {/* Playback Speed Button */}
          <button
            onClick={togglePlaybackRate}
            className="flex size-12 items-center justify-center rounded-full text-[#1DB954] transition-colors hover:text-white"
            title={`Playback speed: ${playbackRate}x`}
          >
            <span className="text-base font-semibold">{playbackRate}x</span>
          </button>

          {/* Skip Back 15s */}
          <button
            onClick={() => skipTime(-15)}
            className="flex size-12 items-center justify-center rounded-full text-[#b3b3b3] transition-colors hover:text-white"
            title="Skip back 15s"
          >
            <svg width="32" height="32" viewBox="0 0 28 28" fill="currentColor">
              <path d="M14 4.5c5.25 0 9.5 4.25 9.5 9.5 0 5.25-4.25 9.5-9.5 9.5s-9.5-4.25-9.5-9.5h2c0 4.15 3.35 7.5 7.5 7.5s7.5-3.35 7.5-7.5-3.35-7.5-7.5-7.5c-2.05 0-3.9.85-5.25 2.2L11.5 11.5h-7v-7l2.4 2.4C8.75 5.3 11.25 4.5 14 4.5z"/>
              <text x="14" y="18" fontSize="8" fontWeight="bold" textAnchor="middle" fill="currentColor">15</text>
            </svg>
          </button>

          {/* Play/Pause Button */}
          <button
            onClick={togglePlayPause}
            className="flex size-16 flex-shrink-0 items-center justify-center rounded-full bg-white text-black transition-transform hover:scale-105"
          >
            {isPlaying ? (
              <Pause className="size-7" fill="black" />
            ) : (
              <Play className="ml-1 size-7" fill="black" />
            )}
          </button>

          {/* Skip Forward 15s */}
          <button
            onClick={() => skipTime(15)}
            className="flex size-12 items-center justify-center rounded-full text-[#b3b3b3] transition-colors hover:text-white"
            title="Skip forward 15s"
          >
            <svg width="32" height="32" viewBox="0 0 28 28" fill="currentColor">
              <path d="M14 4.5C8.75 4.5 4.5 8.75 4.5 14c0 5.25 4.25 9.5 9.5 9.5s9.5-4.25 9.5-9.5h-2c0 4.15-3.35 7.5-7.5 7.5S6.5 18.15 6.5 14 9.85 6.5 14 6.5c2.05 0 3.9.85 5.25 2.2L16.5 11.5h7v-7l-2.4 2.4C19.25 5.3 16.75 4.5 14 4.5z"/>
              <text x="14" y="18" fontSize="8" fontWeight="bold" textAnchor="middle" fill="currentColor">15</text>
            </svg>
          </button>

          {/* Volume Control */}
          <button
            onClick={() => setShowVolumeSlider(!showVolumeSlider)}
            className={`flex size-12 items-center justify-center rounded-full transition-colors ${showVolumeSlider ? 'text-[#1DB954]' : 'text-[#b3b3b3] hover:text-white'}`}
            title="Adjust volume"
          >
            <Volume2 className="size-6" />
          </button>
        </div>

        {/* Horizontal Volume Slider */}
        {showVolumeSlider && (
          <div className="mx-auto mt-6 flex max-w-md items-center gap-3">
            <Volume2 className="size-5 shrink-0 text-[#b3b3b3]" />
            <div
              className="relative h-1.5 flex-1 cursor-pointer rounded-full bg-[#4d4d4d]"
              ref={volumeBarRef}
              onMouseDown={handleVolumeBarInteraction}
              onTouchStart={handleVolumeBarInteraction}
            >
              <div
                className="absolute left-0 top-0 h-full rounded-full bg-[#1DB954]"
                style={{ width: `${volume * 100}%` }}
              />
              <div
                className="absolute top-1/2 size-4 -translate-y-1/2 rounded-full bg-white"
                style={{ left: `calc(${volume * 100}% - 8px)` }}
              />
            </div>
            <span className="w-10 text-right text-xs text-[#b3b3b3]">{Math.round(volume * 100)}%</span>
          </div>
        )}

        {/* Hidden Audio Element */}
        <audio ref={audioRef} src={result.audioUrl} />
      </div>

    </div>
  );
}
