import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { episodeUrl } = await request.json();
    const listenNotesApiKey = process.env.LISTENNOTES_API_KEY;

    console.log('[Metadata API] Request for:', episodeUrl);
    console.log('[Metadata API] Listen Notes API key present:', !!listenNotesApiKey);

    if (!episodeUrl) {
      return new Response(JSON.stringify({ error: 'Episode URL is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate Spotify URL format
    if (!episodeUrl.includes('spotify.com/episode/')) {
      return new Response(JSON.stringify({ error: 'Invalid Spotify episode URL' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Step 1: Use Spotify oEmbed API (free, no auth required)
    const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(episodeUrl)}`;
    const oembedResponse = await fetch(oembedUrl);

    if (!oembedResponse.ok) {
      throw new Error('Failed to fetch episode metadata from Spotify oEmbed');
    }

    const oembedData = await oembedResponse.json();

    let title = oembedData.title || 'Unknown Episode';
    let showName = '';

    // Parse show name from title (Spotify format: "Episode • Show")
    if (title.includes(' • ')) {
      const parts = title.split(' • ');
      title = parts[0];
      showName = parts[1] || '';
    }

    // Initialize metadata with oEmbed data
    const metadata = {
      title,
      showName,
      duration: 3600, // Default to 1 hour - will be updated from Listen Notes if available
      description: '',
      thumbnailUrl: oembedData.thumbnail_url || '',
      audioUrl: undefined as string | undefined,
      audioFileSize: undefined as number | undefined,
    };

    // Step 2: If Listen Notes API key available, fetch duration and audio URL
    if (listenNotesApiKey) {
      try {
        // Search for episode by title on Listen Notes
        const searchUrl = `https://listen-api.listennotes.com/api/v2/search?q=${encodeURIComponent(
          title
        )}&type=episode&only_in=title`;

        console.log('[Listen Notes] Searching for episode:', title);
        const listenNotesResponse = await fetch(searchUrl, {
          headers: {
            'X-ListenAPI-Key': listenNotesApiKey,
          },
        });

        console.log('[Listen Notes] Response status:', listenNotesResponse.status);
        if (listenNotesResponse.ok) {
          const searchData = await listenNotesResponse.json();

          // Find best match by title similarity
          if (searchData.results && searchData.results.length > 0) {
            const match = searchData.results[0]; // Use first result (most relevant)
            console.log('[Listen Notes] Found match:', match.title_original, 'Duration:', match.audio_length_sec);

            // Update metadata with Listen Notes data
            metadata.duration = match.audio_length_sec || metadata.duration;
            metadata.audioUrl = match.audio || undefined;
            metadata.showName = match.podcast?.title_original || metadata.showName;
            metadata.description = match.description_original || metadata.description;

            // Use Listen Notes thumbnail if better quality
            if (match.thumbnail && match.thumbnail.length > metadata.thumbnailUrl.length) {
              metadata.thumbnailUrl = match.thumbnail;
            }

            // Fetch audio file size via HEAD request
            if (metadata.audioUrl) {
              try {
                const audioHeadResponse = await fetch(metadata.audioUrl, { method: 'HEAD' });
                const contentLength = audioHeadResponse.headers.get('content-length');
                if (contentLength) {
                  metadata.audioFileSize = parseInt(contentLength, 10);
                }
              } catch (error) {
                console.warn('Failed to fetch audio file size:', error);
              }
            }
          } else {
            console.log('[Listen Notes] No results found for:', title);
          }
        } else {
          const errorText = await listenNotesResponse.text();
          console.error('[Listen Notes] API error:', listenNotesResponse.status, errorText);
        }
      } catch (listenNotesError) {
        // Listen Notes failed, but we still have oEmbed data
        console.error('[Listen Notes] Exception:', listenNotesError);
      }
    } else {
      console.log('[Listen Notes] API key not configured, using oEmbed data only');
    }

    return new Response(JSON.stringify(metadata), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Metadata fetch error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch episode metadata',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
