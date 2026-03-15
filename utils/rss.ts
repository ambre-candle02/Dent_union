import Parser from 'rss-parser';
import fs from 'fs';
import path from 'path';

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  link: string;
  source: string;
  publishedDate: string;
  category: string;
  imageUrl?: string;
  isVideo?: boolean;
  videoId?: string;
}

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  }
});

const FEEDS = [
  { name: 'ADA News', url: 'https://www.ada.org/en/publications/ada-news/rss', category: 'Latest Dental News' },
  { name: 'FDI World Dental', url: 'https://www.fdiworlddental.org/rss.xml', category: 'Global Dentistry' },
  { name: 'IDA News', url: 'https://ida.org.in/feed', category: 'Indian Dental News' },
  { name: 'PubMed Dentistry', url: 'https://pubmed.ncbi.nlm.nih.gov/rss/search/1/?term=dentistry', category: 'Research Updates' },
  { name: 'Dental Tribune', url: 'https://www.dental-tribune.com/feed/', category: 'Global Dentistry' },
  { name: 'Medical Xpress Dentistry', url: 'https://medicalxpress.com/rss-feed/dentistry-news/', category: 'Research Updates' },
  { name: 'India Dental News', url: 'https://news.google.com/rss/search?q=dentistry+news+india&hl=en-IN&gl=IN&ceid=IN:en', category: 'Indian Dental News' },
  { name: 'ADA TV (Video)', url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UC3UBF_16dd2UncCoR0lCgKQ', category: 'Clinical Cases' },
];

const DENTAL_KEYWORDS = [
  'dental', 'dentist', 'dentistry', 'tooth', 'teeth', 'implant', 'ortho', 'periodontal', 
  'clinic', 'oral', 'cavity', 'molar', 'gingival', 'denture', 'root canal', 'maxillofacial',
  'stomatology', 'orthodontic', 'endodontic'
];

const DEFAULT_DENTAL_IMAGE = 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&q=80&w=800&h=500';

function isDentalRelated(item: any): boolean {
  const content = `${item.title} ${item.contentSnippet || item.content || ''}`.toLowerCase();
  return DENTAL_KEYWORDS.some(keyword => content.includes(keyword));
}

export async function fetchAllNews(): Promise<NewsItem[]> {
  const feedPromises = FEEDS.map(async (feed) => {
    try {
      const parsed = await parser.parseURL(feed.url);
      return parsed.items
        .filter(isDentalRelated)
        .map((item, index) => {
          const link = item.link || item.guid || '#';
          const isYouTube = link.includes('youtube.com') || link.includes('youtu.be');
          const videoId = isYouTube ? extractYouTubeId(link) : undefined;

          // Clean summary: remove HTML tags and truncate
          let summary = item.contentSnippet || item.content || 'No description available.';
          summary = summary.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();
          if (summary.length > 250) summary = summary.substring(0, 247) + '...';

          return {
            id: item.guid || link,
            title: item.title?.trim() || 'No Title',
            summary: summary,
            link: link,
            source: feed.name,
            publishedDate: item.pubDate || new Date().toISOString(),
            category: feed.category,
            imageUrl: isYouTube 
              ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` 
              : extractImage(item) || DEFAULT_DENTAL_IMAGE,
            isVideo: isYouTube,
            videoId: videoId,
          };
        });
    } catch (error) {
      console.warn(`Feed Error [${feed.name}]:`, error instanceof Error ? error.message : error);
      return [];
    }
  });

  const results = await Promise.allSettled(feedPromises);
  const allItems: NewsItem[] = results.flatMap(result => 
    result.status === 'fulfilled' ? result.value : []
  );

  // Strict Deduplication: Link & Title (Case Insensitive)
  const seenLinks = new Set<string>();
  const seenTitles = new Set<string>();
  
  const uniqueItems = allItems.filter(item => {
    const normalizedTitle = item.title.toLowerCase().trim();
    const normalizedLink = item.link.split('?')[0].split('#')[0]; // Remove query/hash for link check

    if (seenLinks.has(normalizedLink) || seenTitles.has(normalizedTitle)) {
      return false;
    }
    seenLinks.add(normalizedLink);
    seenTitles.add(normalizedTitle);
    return true;
  });

  // Sort by date descending
  const sortedItems = uniqueItems.sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime());

  // Limit to 100 items for the "Database"
  return sortedItems.slice(0, 100);
}

function extractImage(item: any): string | undefined {
  if (item.enclosure && item.enclosure.url) return item.enclosure.url;
  
  const content = item.content || '';
  const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
  if (imgMatch) return imgMatch[1];

  // Higher quality media extraction
  if (item.mediaContent && item.mediaContent.$ && item.mediaContent.$.url) return item.mediaContent.$.url;
  if (item['media:content'] && item['media:content'].$ && item['media:content'].$.url) return item['media:content'].$.url;

  return undefined;
}


function extractYouTubeId(url: string): string | undefined {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : undefined;
}

