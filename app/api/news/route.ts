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
      console.log('🔄 DentUnion Sync: Initiating harvest...');
      try {
        const freshNews = await fetchAllNews();
        if (freshNews && freshNews.length > 0) {
          news = freshNews;
          // Try to write but don't crash if it's a read-only env (like Vercel)
          try {
            fs.writeFileSync(DB_PATH, JSON.stringify(freshNews, null, 2));
          } catch (e) {
            console.warn('⚠️ Cache Write Skipped');
          }
        }
      } catch (syncError) {
        console.error('❌ Sync Failed.');
      }
    }

    // Safety: If even after sync we have zero news, use a hardcoded reserve
    if (!news || news.length === 0) {
      news = [
        {
          id: 'initial-1',
          title: 'Artificial Intelligence in Modern Dentistry: Clinical Guidelines',
          summary: 'A comprehensive review of AI applications in radiographic interpretation and treatment planning.',
          link: 'https://pubmed.ncbi.nlm.nih.gov/',
          source: 'PubMed Dentistry',
          publishedDate: new Date().toISOString(),
          category: 'Research Updates'
        },
        {
          id: 'initial-2',
          title: 'Global Trends in Periodontal Research 2026',
          summary: 'ADA releases new insights into sustainable clinical practices and periodontal health.',
          link: 'https://www.ada.org',
          source: 'ADA News',
          publishedDate: new Date().toISOString(),
          category: 'Latest Dental News'
        }
      ];
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


