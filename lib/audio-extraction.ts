// Audio extraction module - gets episode metadata and audio URLs

import { EpisodeMetadata } from '@/types';
import { extractSpotifyEpisodeId } from './utils';

/**
 * Fetches episode metadata from Spotify
 * This is a simplified version. In production, you'd use Spotify Web API
 * For MVP, we'll use a mock/placeholder that can be replaced with real implementation
 */
export async function fetchEpisodeMetadata(
  spotifyUrl: string
): Promise<EpisodeMetadata> {
  const episodeId = extractSpotifyEpisodeId(spotifyUrl);

  if (!episodeId) {
    throw new Error('Invalid Spotify episode URL');
  }

  // TODO: Implement real Spotify API call
  // For now, return mock data to allow development to continue
  // In production, this would be:
  // 1. Get Spotify access token (client credentials flow)
  // 2. Call GET https://api.spotify.com/v1/episodes/{id}
  // 3. Parse response for title, duration_ms, show.name, description

  throw new Error(
    'Spotify API integration not yet implemented. Please add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET to environment variables.'
  );

  // Example of what the real implementation would return:
  /*
  const response = await fetch(`https://api.spotify.com/v1/episodes/${episodeId}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  const data = await response.json();

  return {
    title: data.name,
    duration: Math.floor(data.duration_ms / 1000),
    showName: data.show.name,
    description: data.description
  };
  */
}

/**
 * Gets audio URL for a Spotify episode
 * First tries RSS feed extraction, falls back to Listen Notes API
 */
export async function getAudioUrl(
  spotifyUrl: string,
  listenNotesApiKey?: string
): Promise<string> {
  const episodeId = extractSpotifyEpisodeId(spotifyUrl);

  if (!episodeId) {
    throw new Error('Invalid Spotify episode URL');
  }

  // TODO: Implement real audio extraction
  // Step 1: Try to get RSS feed URL from Spotify API
  // Step 2: Parse RSS feed XML to find audio URL
  // Step 3: If fails, fall back to Listen Notes API

  throw new Error(
    'Audio extraction not yet implemented. This requires Spotify API + RSS parsing or Listen Notes API.'
  );

  // Example of what the real implementation would do:
  /*
  try {
    // Get RSS feed URL from Spotify
    const rssUrl = await getRssFeedUrl(episodeId);

    // Parse RSS feed
    const audioUrl = await parseRssFeedForAudio(rssUrl, episodeId);

    if (audioUrl) {
      return audioUrl;
    }
  } catch (error) {
    console.error('RSS extraction failed:', error);
  }

  // Fallback to Listen Notes
  if (listenNotesApiKey) {
    const response = await fetch(
      `https://listen-api.listennotes.com/api/v2/episodes/${episodeId}`,
      {
        headers: { 'X-ListenAPI-Key': listenNotesApiKey }
      }
    );

    const data = await response.json();
    return data.audio;
  }

  throw new Error('Could not extract audio URL');
  */
}

/**
 * Helper function to get Spotify access token (client credentials)
 * This would be used by fetchEpisodeMetadata
 */
async function getSpotifyAccessToken(
  clientId: string,
  clientSecret: string
): Promise<string> {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();
  return data.access_token;
}
