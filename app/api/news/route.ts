import { NextResponse } from 'next/server';
import { fetchAllNews } from '@/utils/rss';

export async function GET() {
  try {
    const news = await fetchAllNews();
    return NextResponse.json(news);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}
