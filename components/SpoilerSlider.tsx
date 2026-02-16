'use client';

import { useState } from 'react';

interface SpoilerSliderProps {
  episodeDuration: number; // exact duration in seconds from API
  value: number; // in seconds
  onChange: (value: number) => void; // in seconds
  disabled?: boolean;
  episodeTitle?: string;
  episodeNumber?: number;
}

export function SpoilerSlider({ episodeDuration, value, onChange, disabled, episodeTitle, episodeNumber }: SpoilerSliderProps) {
  // Track enabled state independently - start as enabled if value is less than max
  const [isEnabled, setIsEnabled] = useState(value < episodeDuration);
  const [lastEnabledValue, setLastEnabledValue] = useState(Math.min(Math.floor(episodeDuration / 2), 1800));

  const handleToggle = () => {
    if (isEnabled) {
      // Turning off - remember current value and set to max (no spoiler protection)
      setLastEnabledValue(value);
      setIsEnabled(false);
      onChange(episodeDuration);
    } else {
      // Turning on - restore last value or use default
      setIsEnabled(true);
      onChange(Math.max(0, Math.min(lastEnabledValue, episodeDuration - 1)));
    }
  };

  const formatTime = (seconds: number) => {
    const totalMinutes = Math.floor(seconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const secs = seconds % 60;

    const formattedMins = mins.toString().padStart(2, '0');
    const formattedSecs = secs.toString().padStart(2, '0');

    return `${hours}:${formattedMins}:${formattedSecs}`;
  };

  return (
    <div>
      <div className="rounded-md border border-[#282828] bg-[#121212] p-4 transition-all">
        {/* Header with toggle */}
        <div className="mb-4 flex items-center justify-between">
          <span className="text-base text-[#b3b3b3]">Spoiler Protection</span>
          <button
            type="button"
            role="switch"
            aria-checked={isEnabled}
            onClick={handleToggle}
            disabled={disabled}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
              isEnabled ? 'bg-[#1DB954]' : 'bg-[#4d4d4d]'
            }`}
          >
            <span
              className={`inline-block size-4 transform rounded-full bg-white transition-transform ${
                isEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {isEnabled && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Episode title */}
            {episodeTitle && (
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-white line-clamp-2">
                  {episodeTitle}
                </h3>
              </div>
            )}

            {/* Spotify-style progress bar section */}
            <div className="space-y-1.5">
              {/* Progress bar with visible thumb */}
              <div className="relative group">
                <input
                  type="range"
                  min={0}
                  max={episodeDuration}
                  value={value}
                  onChange={(e) => onChange(parseInt(e.target.value))}
                  disabled={disabled}
                  className="h-1 w-full cursor-pointer appearance-none rounded-full bg-[#4d4d4d] disabled:opacity-50 group-hover:h-1.5 transition-all [&::-moz-range-thumb]:size-3 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:transition-all [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition-all"
                  style={{
                    background: `linear-gradient(to right, #b3b3b3 0%, #b3b3b3 ${(value / episodeDuration) * 100}%, #4d4d4d ${(value / episodeDuration) * 100}%, #4d4d4d 100%)`
                  }}
                />
              </div>

              {/* Time stamps */}
              <div className="flex items-center justify-between text-xs text-[#b3b3b3]">
                <span className="font-medium">{formatTime(value)}</span>
                <span className="font-medium">{formatTime(episodeDuration)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
