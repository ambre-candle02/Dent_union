import { NextResponse } from 'next/server';
import { fetchAllNews, NewsItem } from '@/utils/rss';

import fs from 'fs';
import path from 'path';

// "Database" file path
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'news.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export async function GET() {
  try {
    let news: NewsItem[] = [];
    let cacheExists = fs.existsSync(DB_PATH);
    let shouldUpdate = false;

    if (cacheExists) {
      const stats = fs.statSync(DB_PATH);
      const mtime = stats.mtime.getTime();
      const now = Date.now();
      
      // Serve cache immediately, but check if we need to refresh (every 30 mins)
      const fileData = fs.readFileSync(DB_PATH, 'utf-8');
      news = JSON.parse(fileData);

      if (now - mtime > 30 * 60 * 1000) {
        shouldUpdate = true;
      }
    } else {
      shouldUpdate = true;
    }

    if (shouldUpdate) {
      console.log('🔄 DentUnion Sync: Initiating authentic dental record harvest...');
      const startTime = Date.now();
      
      try {
        const freshNews = await fetchAllNews();
        if (freshNews.length > 0) {
          fs.writeFileSync(DB_PATH, JSON.stringify(freshNews, null, 2));
          news = freshNews;
          console.log(`✅ Sync Success: ${freshNews.length} articles updated in ${Date.now() - startTime}ms`);
        } else {
          console.warn('⚠️ Sync Alert: No new dental articles found. Keeping stable cache.');
        }
      } catch (syncError) {
        console.error('❌ Sync Critical Failure: Check RSS Sources or Network. Serving stable cache.');
        console.error('Stack:', syncError instanceof Error ? syncError.message : syncError);
      }
    }


    return NextResponse.json(news);
  } catch (error) {
    console.error('🔥 Critical API Error:', error);
    // Even if everything fails, try to read the file one last time
    try {
      if (fs.existsSync(DB_PATH)) {
        const fileData = fs.readFileSync(DB_PATH, 'utf-8');
        return NextResponse.json(JSON.parse(fileData));
      }
    } catch (f) { /* ignore */ }
    
    return NextResponse.json({ error: 'System busy. Please try later.' }, { status: 500 });
  }
}


