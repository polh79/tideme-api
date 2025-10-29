import { NextRequest, NextResponse } from 'next/server';
import { getFromCache } from '@/lib/cache';

export async function GET(request: NextRequest) {
  const portId = request.nextUrl.searchParams.get('portId') || 'biarritz';
  const cacheKey = `port:${portId}:tides`;

  const data = await getFromCache<any>(cacheKey);

  if (!data) {
    return NextResponse.json({ error: 'No cache data found', portId, cacheKey });
  }

  const now = new Date();

  return NextResponse.json({
    portId,
    cacheKey,
    currentTime: now.toISOString(),
    fetchedAt: data.fetchedAt,
    tidesCount: data.tides.length,
    tides: data.tides.map((t: any) => ({
      time: t.time,
      height: t.height,
      type: t.type,
      isPast: new Date(t.time) < now,
    })),
  });
}
