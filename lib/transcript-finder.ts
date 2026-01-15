// Transcript finder module - searches multiple sources for existing transcripts

import { TranscriptResult } from '@/types';

/**
 * Searches for existing transcript across multiple sources
 * Priority order: Spotify → RSS → YouTube → Web
 */
export async function findTranscript(
  spotifyUrl: string,
  episodeTitle: string,
  showName: string
): Promise<TranscriptResult | null> {
  // Priority 1: Check Spotify API for native transcripts
  try {
    const spotifyTranscript = await checkSpotifyTranscript(spotifyUrl);
    if (spotifyTranscript) {
      return { text: spotifyTranscript, source: 'spotify' };
    }
  } catch (error) {
    console.error('Spotify transcript check failed:', error);
  }

  // Priority 2: Check RSS feed for transcript links
  try {
    const rssTranscript = await checkRssFeed(spotifyUrl);
    if (rssTranscript) {
      return { text: rssTranscript, source: 'rss' };
    }
  } catch (error) {
    console.error('RSS transcript check failed:', error);
  }

  // Priority 3: Check YouTube for auto-captions
  try {
    const youtubeTranscript = await checkYouTube(showName, episodeTitle);
    if (youtubeTranscript) {
      return { text: youtubeTranscript, source: 'youtube' };
    }
  } catch (error) {
    console.error('YouTube transcript check failed:', error);
  }

  // Priority 4: Web search for public transcripts
  try {
    const webTranscript = await searchWebForTranscript(showName, episodeTitle);
    if (webTranscript) {
      return { text: webTranscript, source: 'web' };
    }
  } catch (error) {
    console.error('Web transcript search failed:', error);
  }

  // No transcript found
  return null;
}

/**
 * Check Spotify API for native transcript
 */
async function checkSpotifyTranscript(spotifyUrl: string): Promise<string | null> {
  try {
    // Extract episode ID from Spotify URL
    const episodeIdMatch = spotifyUrl.match(/\/episode\/([a-zA-Z0-9]+)/);
    if (!episodeIdMatch) return null;

    const episodeId = episodeIdMatch[1];

    // Use Spotify oEmbed API to get episode data
    const oEmbedUrl = `https://open.spotify.com/oembed?url=https://open.spotify.com/episode/${episodeId}`;
    const response = await fetch(oEmbedUrl);

    if (!response.ok) return null;

    const data = await response.json();

    // Check if Spotify provides transcript data in the oEmbed response
    // Note: As of 2024, Spotify has started rolling out transcripts for some podcasts
    // The transcript might be available via their Web API or in HTML content
    if (data.html) {
      // Some podcasts include transcript in embedded HTML
      const htmlContent = data.html;
      // Look for common transcript markers
      if (htmlContent.includes('transcript') || htmlContent.includes('Transcript')) {
        // This is a best-effort extraction - may need refinement
        console.log('Potential Spotify transcript found in HTML');
      }
    }

    // For now, Spotify transcripts aren't easily accessible via public API
    // Would need official Spotify Web API with proper OAuth setup
    return null;
  } catch (error) {
    console.error('Spotify transcript check error:', error);
    return null;
  }
}

/**
 * Check RSS feed for transcript links (Podcasting 2.0 spec)
 */
async function checkRssFeed(spotifyUrl: string): Promise<string | null> {
  try {
    // Extract episode ID
    const episodeIdMatch = spotifyUrl.match(/\/episode\/([a-zA-Z0-9]+)/);
    if (!episodeIdMatch) return null;

    const episodeId = episodeIdMatch[1];

    // Try to get RSS feed URL from Spotify oEmbed
    const oEmbedUrl = `https://open.spotify.com/oembed?url=https://open.spotify.com/episode/${episodeId}`;
    const oEmbedResponse = await fetch(oEmbedUrl);

    if (!oEmbedResponse.ok) return null;

    const oEmbedData = await oEmbedResponse.json();

    // Spotify oEmbed doesn't directly provide RSS feed
    // In production, would need to:
    // 1. Use Listen Notes API to find RSS feed
    // 2. Parse RSS XML for <podcast:transcript> tags or transcript URLs in description
    // 3. Download and extract transcript text

    // For MVP, RSS feed transcript extraction requires additional setup
    return null;
  } catch (error) {
    console.error('RSS feed transcript check error:', error);
    return null;
  }
}

/**
 * Check YouTube for auto-generated captions
 */
async function checkYouTube(showName: string, episodeTitle: string): Promise<string | null> {
  try {
    // Many podcasts also upload to YouTube with auto-generated captions
    // Search query: "{showName} {episodeTitle}"
    const searchQuery = `${showName} ${episodeTitle}`;

    // Note: This requires YouTube Data API key and youtube-transcript package
    // For MVP, we'll skip this to avoid additional API key requirements
    // In production, this would:
    // 1. Search YouTube for matching video
    // 2. Use youtube-transcript to extract captions
    // 3. Return caption text

    console.log(`YouTube transcript search skipped for: ${searchQuery}`);
    return null;
  } catch (error) {
    console.error('YouTube transcript check error:', error);
    return null;
  }
}

/**
 * Search web for publicly available transcripts
 */
async function searchWebForTranscript(
  showName: string,
  episodeTitle: string
): Promise<string | null> {
  try {
    // Many popular podcasts publish transcripts on their websites
    // Common patterns:
    // - Behind the Bastards: iheartpodcasts.com has transcripts
    // - Lex Fridman: lexfridman.com/podcast-title has transcripts
    // - NPR podcasts: npr.org often includes transcripts

    // Try common podcast transcript URL patterns
    const searchPatterns = [
      // Try podcast website transcript pages
      `${showName.toLowerCase().replace(/\s+/g, '-')}-transcript`,
      `${episodeTitle.toLowerCase().replace(/\s+/g, '-')}-transcript`,
    ];

    // Check if show name matches known podcasts with public transcripts
    const lowerShowName = showName.toLowerCase();

    // Behind the Bastards - iHeart Podcasts
    if (lowerShowName.includes('behind the bastards')) {
      const transcript = await fetchBehindTheBastardsTranscript(episodeTitle);
      if (transcript) return transcript;
    }

    // Lex Fridman Podcast
    if (lowerShowName.includes('lex fridman')) {
      const transcript = await fetchLexFridmanTranscript(episodeTitle);
      if (transcript) return transcript;
    }

    // This Week in Tech and TWiT network
    if (lowerShowName.includes('twit') || lowerShowName.includes('this week in tech')) {
      const transcript = await fetchTWiTTranscript(episodeTitle);
      if (transcript) return transcript;
    }

    // For other podcasts, would need web scraping or search API
    return null;
  } catch (error) {
    console.error('Web transcript search error:', error);
    return null;
  }
}

/**
 * Fetch transcript from Behind the Bastards (iHeart Podcasts)
 */
async function fetchBehindTheBastardsTranscript(episodeTitle: string): Promise<string | null> {
  try {
    // Behind the Bastards episodes are available on iheart.com
    // They often have transcripts available via a "Transcript" link
    console.log(`Searching for Behind the Bastards transcript: ${episodeTitle}`);

    // Would need to:
    // 1. Search iheart.com for episode URL
    // 2. Look for transcript link on episode page
    // 3. Extract transcript text

    // For MVP, return null (requires web scraping)
    return null;
  } catch (error) {
    console.error('Behind the Bastards transcript fetch error:', error);
    return null;
  }
}

/**
 * Fetch transcript from Lex Fridman Podcast
 */
async function fetchLexFridmanTranscript(episodeTitle: string): Promise<string | null> {
  try {
    // Lex Fridman publishes transcripts on lexfridman.com
    console.log(`Searching for Lex Fridman transcript: ${episodeTitle}`);

    // Would need to:
    // 1. Search lexfridman.com for episode page
    // 2. Extract transcript from page HTML
    // 3. Return transcript text

    // For MVP, return null (requires web scraping)
    return null;
  } catch (error) {
    console.error('Lex Fridman transcript fetch error:', error);
    return null;
  }
}

/**
 * Fetch transcript from TWiT Network podcasts
 */
async function fetchTWiTTranscript(episodeTitle: string): Promise<string | null> {
  try {
    // TWiT network provides transcripts for many shows
    console.log(`Searching for TWiT transcript: ${episodeTitle}`);

    // Would need to:
    // 1. Search twit.tv for episode URL
    // 2. Extract transcript link
    // 3. Return transcript text

    // For MVP, return null (requires web scraping)
    return null;
  } catch (error) {
    console.error('TWiT transcript fetch error:', error);
    return null;
  }
}

/**
 * Quick check if transcript likely exists (for cost estimation)
 * Doesn't actually fetch the transcript, just checks availability
 */
export async function quickTranscriptCheck(spotifyUrl: string): Promise<boolean> {
  // For cost estimation, quickly check if transcript sources are available
  // Without downloading the full transcript

  try {
    // Check if Spotify provides transcript metadata
    const spotifyCheck = await checkSpotifyTranscript(spotifyUrl);
    if (spotifyCheck) return true;

    // For MVP, assume no transcripts available (worst case for cost estimation)
    // In production, would check RSS feed and common transcript sources
    return false;
  } catch (error) {
    return false;
  }
}
