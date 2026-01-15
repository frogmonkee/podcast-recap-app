// Core types and interfaces for the Podcast Summary App

export interface Episode {
  url: string;
  title: string;
  showName?: string;
  duration: number; // in seconds
  audioUrl?: string;
  transcript?: string;
  timestamp?: number; // in seconds, cutoff timestamp for final episode
}

export interface EpisodeMetadata {
  title: string;
  duration: number; // in seconds
  showName: string;
  description?: string;
  thumbnailUrl?: string;
  audioUrl?: string; // Direct audio file URL from Listen Notes
  audioFileSize?: number; // Audio file size in bytes
  listenNotesCallMade?: boolean; // Track if API call was made
}

export interface TranscriptResult {
  text: string;
  source: 'spotify' | 'rss' | 'youtube' | 'web' | 'whisper';
}

export interface CostBreakdown {
  transcription: number;
  summarization: number;
  tts: number;
  total: number;
}

export interface ProcessingProgress {
  step: string;
  episodeIndex?: number;
  totalEpisodes?: number;
  percentage: number;
  message: string;
}

export interface SummaryRequest {
  episodes: Episode[];
  targetDuration: 1 | 5 | 10; // minutes
  openaiApiKey: string;
  anthropicApiKey: string;
  listenNotesApiKey?: string;
}

export interface SummaryResult {
  audioUrl: string;
  summaryText: string;
  actualDuration: number; // in seconds
  targetDuration: number; // in seconds
  costBreakdown: CostBreakdown;
}

export interface BudgetInfo {
  monthlySpend: number;
  monthlyLimit: number;
  lastResetDate: string;
  perRequestLimit: number;
}

export interface ApiKeys {
  openai: string;
  anthropic: string;
  listenNotes?: string;
}
