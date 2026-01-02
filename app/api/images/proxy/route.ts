import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(req: Request) {
  const search = new URL(req.url).searchParams;
  const url = search.get('url');
  if (!url) return NextResponse.json({ error: 'Missing url param' }, { status: 400 });
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return NextResponse.json({ error: 'Invalid URL protocol' }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400 });
  }

  try {
    // Special handling for Supabase storage URLs — create a signed URL server-side
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    let fetchUrl = url;

    try {
      const parsed = new URL(url);
      if (supabaseUrl && parsed.origin === new URL(supabaseUrl).origin && parsed.pathname.includes('/storage/v1/object/')) {
        // Extract the path after /storage/v1/object/
        const suffix = parsed.pathname.split('/storage/v1/object/')[1] || '';
        // suffix might be like: public/<bucket>/<path>
        const parts = suffix.split('/');
        // Remove 'public' prefix if present
        if (parts[0] === 'public') parts.shift();
        const bucket = parts.shift();
        const objectPath = parts.join('/');
        if (bucket && objectPath) {
          // Try to create a signed URL using admin client
          try {
            const { data, error } = await supabaseAdmin.storage.from(bucket).createSignedUrl(objectPath, 60);
            if (!error && data?.signedUrl) {
              fetchUrl = data.signedUrl;
            }
          } catch (e) {
            console.warn('Failed to create signed URL for supabase object, falling back to direct fetch', e);
          }
        }
      }
    } catch (e) {
      // ignore parsing errors and fallback to direct fetch
    }

    const res = await fetch(fetchUrl);
    if (!res.ok) return NextResponse.json({ error: 'Failed to fetch image' }, { status: 502 });
    const contentType = res.headers.get('content-type') || 'application/octet-stream';

    const arrayBuffer = await res.arrayBuffer();
    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400'
      }
    });
  } catch (err) {
    console.error('Image proxy error', err);
    return NextResponse.json({ error: 'Error proxying image' }, { status: 500 });
  }
}
