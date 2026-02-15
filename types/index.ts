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
  audioUrl?: string; // Audio file URL (if available)
  audioFileSize?: number; // Audio file size in bytes (if available)
}

export interface TranscriptResult {
  text: string;
  source: 'spotify' | 'rss' | 'youtube' | 'web' | 'whisper' | 'fireworks';
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
