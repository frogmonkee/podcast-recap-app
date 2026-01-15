'use client';

import { useState, useEffect } from 'react';
import { formatDuration, parseDuration } from '@/lib/utils';

interface TimestampSliderProps {
  episodeDuration: number; // in seconds
  onTimestampChange: (seconds: number) => void;
  initialValue?: number;
}

export default function TimestampSlider({
  episodeDuration,
  onTimestampChange,
  initialValue,
}: TimestampSliderProps) {
  const [selectedTime, setSelectedTime] = useState(initialValue || episodeDuration);

  useEffect(() => {
    setSelectedTime(initialValue || episodeDuration);
  }, [episodeDuration, initialValue]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setSelectedTime(value);
    onTimestampChange(value);
  };

  const percentageComplete = (selectedTime / episodeDuration) * 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">
          Summarize up to:
        </label>
        <span className="text-lg font-bold text-blue-600">
          {formatDuration(selectedTime)}
        </span>
      </div>

      {/* Slider */}
      <div className="relative">
        <input
          type="range"
          min="0"
          max={episodeDuration}
          step="1"
          value={selectedTime}
          onChange={handleSliderChange}
          className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600
                     [&::-webkit-slider-thumb]:appearance-none
                     [&::-webkit-slider-thumb]:w-6
                     [&::-webkit-slider-thumb]:h-6
                     [&::-webkit-slider-thumb]:rounded-full
                     [&::-webkit-slider-thumb]:bg-blue-600
                     [&::-webkit-slider-thumb]:cursor-pointer
                     [&::-webkit-slider-thumb]:shadow-md
                     [&::-moz-range-thumb]:w-6
                     [&::-moz-range-thumb]:h-6
                     [&::-moz-range-thumb]:rounded-full
                     [&::-moz-range-thumb]:bg-blue-600
                     [&::-moz-range-thumb]:cursor-pointer
                     [&::-moz-range-thumb]:border-0
                     [&::-moz-range-thumb]:shadow-md
                     touch-manipulation"
          style={{
            background: `linear-gradient(to right, #2563eb 0%, #2563eb ${percentageComplete}%, #e5e7eb ${percentageComplete}%, #e5e7eb 100%)`,
          }}
        />
      </div>

      {/* Time Labels */}
      <div className="flex justify-between text-xs text-gray-500">
        <span>0:00</span>
        <span>{formatDuration(episodeDuration)}</span>
      </div>

      {/* Helper Text */}
      <p className="text-xs text-gray-600 italic">
        {selectedTime === episodeDuration
          ? 'Full episode will be summarized'
          : `Only the first ${formatDuration(selectedTime)} will be summarized (avoids spoilers)`}
      </p>
    </div>
  );
}
