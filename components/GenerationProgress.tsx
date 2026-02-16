'use client';

import { Loader2 } from 'lucide-react';
import { ProcessingProgress } from '@/types';

interface GenerationProgressProps {
  progress: ProcessingProgress | null;
  isProcessing: boolean;
}

export function GenerationProgress({ progress, isProcessing }: GenerationProgressProps) {
  const steps = [
    { id: 'transcription', label: 'Listening' },
    { id: 'summarization', label: 'Summarizing' },
    { id: 'tts', label: 'Recording' },
  ];

  // Map backend step names to our visual step ids
  const mapStepToId = (step: string): string => {
    const lower = step.toLowerCase();
    if (lower.includes('transcri') || lower.includes('extract') || lower.includes('audio') || lower.includes('download')) return 'transcription';
    if (lower.includes('summar') || lower.includes('truncat')) return 'summarization';
    if (lower.includes('tts') || lower.includes('speech') || lower.includes('upload') || lower.includes('generat')) return 'tts';
    return 'transcription';
  };

  const currentStepId = progress ? mapStepToId(progress.step) : '';
  const currentStepIndex = steps.findIndex(s => s.id === currentStepId);
  const progressPercent = progress?.percentage ?? 0;

  if (!isProcessing && !progress) return null;

  return (
    <div className="rounded-lg bg-[#181818] p-6">
      <div className="flex items-center gap-3 mb-4">
        <Loader2 className="size-5 animate-spin text-[#1DB954]" />
        <h3 className="font-semibold">Recording Your Summary Episode</h3>
      </div>

      <div className="space-y-3">
        {steps.map((s, index) => {
          const isActive = currentStepId === s.id;
          const isCompleted = currentStepIndex > index;

          return (
            <div key={s.id} className="flex items-center gap-3">
              <div className={`flex size-8 shrink-0 items-center justify-center rounded-full border-2 ${
                isActive
                  ? 'border-[#1DB954] bg-[#1DB954]/10 text-[#1DB954]'
                  : isCompleted
                  ? 'border-[#1DB954] bg-[#1DB954] text-black'
                  : 'border-[#282828] text-[#6a6a6a]'
              }`}>
                {isCompleted ? (
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              <div className="flex-1">
                <p className={`text-base ${
                  isActive ? 'text-white font-medium' : isCompleted ? 'text-[#1DB954]' : 'text-[#6a6a6a]'
                }`}>
                  {s.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-[#282828]">
        <div className="h-full bg-[#1DB954] transition-all duration-500" style={{ width: `${progressPercent}%` }} />
      </div>

      {/* Safe to close message */}
      <div className="mt-4 flex items-center gap-2 text-sm text-[#b3b3b3]">
        <svg className="size-4 text-[#1DB954] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        You can safely close this tab. Your summary will be ready when you return.
      </div>
    </div>
  );
}
