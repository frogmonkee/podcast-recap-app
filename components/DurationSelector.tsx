'use client';

import { Clock } from 'lucide-react';

interface DurationSelectorProps {
  value: 1 | 5 | 10;
  onChange: (value: 1 | 5 | 10) => void;
  disabled?: boolean;
}

export function DurationSelector({ value, onChange, disabled }: DurationSelectorProps) {
  const options: { value: 1 | 5 | 10; label: string }[] = [
    { value: 1, label: 'Short' },
    { value: 5, label: 'Medium' },
    { value: 10, label: 'Long' },
  ];

  return (
    <div>
      <div className="grid grid-cols-3 gap-3">
        {options.map((d) => (
          <button
            key={d.value}
            onClick={() => onChange(d.value)}
            disabled={disabled}
            className={`rounded-md px-4 py-3 text-sm font-semibold transition-all ${
              value === d.value
                ? 'bg-[#1DB954] text-black'
                : 'bg-[#282828] text-white hover:bg-[#3e3e3e]'
            } disabled:opacity-50`}
          >
            {d.label}
          </button>
        ))}
      </div>
    </div>
  );
}
