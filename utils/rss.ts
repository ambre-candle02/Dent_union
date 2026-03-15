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
  },
  customFields: {
    item: [
      ['media:content', 'mediaContent'],
      ['media:group', 'mediaGroup'],
      ['content:encoded', 'contentEncoded'],
    ],
  },
});

const DENTAL_KEYWORDS = [
  'dental', 'dentist', 'dentistry', 'tooth', 'teeth', 'implant', 'ortho', 'periodontal', 
  'clinic', 'oral', 'cavity', 'molar', 'gingival', 'denture', 'root canal', 'maxillofacial',
  'stomatology', 'orthodontic', 'endodontic', 'surgeon', 'clinical'
];

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1445527815219-ecbfec67492e?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=800'
];

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

function isDentalRelated(item: any): boolean {
  const content = `${item.title} ${item.contentSnippet || item.content || item.contentEncoded || ''}`.toLowerCase();
  return DENTAL_KEYWORDS.some(keyword => content.includes(keyword));
}

export async function fetchAllNews(): Promise<NewsItem[]> {
  const feedPromises = FEEDS.map(async (feed: any) => {
    try {
      const parsed = await parser.parseURL(feed.url);
      return parsed.items
        .filter(isDentalRelated)
        .map((item: any, index: number) => {
          const link = item.link || item.guid || '#';
          const isYouTube = link.includes('youtube.com') || link.includes('youtu.be') || feed.url.includes('youtube.com');
          const videoId = isYouTube ? extractYouTubeId(link) : undefined;

          let summary = item.contentSnippet || item.contentEncoded || item.content || 'Click to read full details...';
          summary = summary.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();
          if (summary.length > 250) summary = summary.substring(0, 247) + '...';

          return {
            id: item.guid || link,
            title: item.title?.trim() || 'Dental Update',
            summary: summary,
            link: link,
            source: feed.name,
            publishedDate: item.pubDate || new Date().toISOString(),
            category: feed.category,
            imageUrl: isYouTube && videoId
              ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` 
              : extractImage(item) || FALLBACK_IMAGES[index % FALLBACK_IMAGES.length],
            isVideo: isYouTube && videoId !== undefined,
            videoId: videoId,
          };
        });
    } catch (error) {
      console.warn(`Feed Error [${feed.name}]:`, error);
      return [];
    }
  });

  const results = await Promise.allSettled(feedPromises);
  const allItems: NewsItem[] = results.flatMap((result: any) => 
    result.status === 'fulfilled' ? result.value : []
  );


  const seenLinks = new Set<string>();
  const seenTitles = new Set<string>();
  
  const uniqueItems = allItems.filter(item => {
    const normalizedTitle = item.title.toLowerCase().trim();
    const normalizedLink = item.link.split('?')[0].split('#')[0];
    if (seenLinks.has(normalizedLink) || seenTitles.has(normalizedTitle)) return false;
    seenLinks.add(normalizedLink);
    seenTitles.add(normalizedTitle);
    return true;
  });

  return uniqueItems.sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime()).slice(0, 50);
}

function extractImage(item: any): string | undefined {
  if (item.enclosure && item.enclosure.url) return item.enclosure.url;
  
  const content = (item.content || '') + (item.contentEncoded || '') + (item.contentSnippet || '');
  const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
  if (imgMatch) return imgMatch[1];

  if (item.mediaContent) {
    if (Array.isArray(item.mediaContent)) return item.mediaContent[0]?.$?.url;
    return item.mediaContent?.$?.url;
  }

  return undefined;
}



function extractYouTubeId(url: string): string | undefined {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : undefined;
}

