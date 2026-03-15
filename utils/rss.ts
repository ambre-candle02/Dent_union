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

const DENTAL_MAGAZINE_KEYWORDS = [
  'clinical', 'research', 'journal', 'study', 'technology', 'treatment', 'implantology', 
  'pathology', 'radiology', 'surgery', 'orthodontics', 'periodontics', 'restorative', 
  'biotech', 'case report', 'evidence-based', 'guidelines', 'fda', 'famdent', 'jcd', 'ijdr'
];


const FEEDS = [
  // International Magazines & Journals
  { name: 'Nature: British Dental Journal', url: 'https://www.nature.com/bdj.rss', category: 'Research Updates' },
  { name: 'Dentistry Today Magazine', url: 'https://www.dentistrytoday.com/feed/', category: 'Latest Dental News' },
  { name: 'JADA Clinical Highlights', url: 'https://pubmed.ncbi.nlm.nih.gov/rss/search/1/P3k7uH5Zp4Nl5yW8v/', category: 'Research Updates' },
  { name: 'FDI Clinical Research', url: 'https://www.fdiworlddental.org/rss.xml', category: 'Global Dentistry' },
  
  // Indian Clinical & Association Feeds
  { name: 'IDA News (Official India)', url: 'https://ida.org.in/feed', category: 'Indian Dental News' },
  { name: 'India Clinical Dentistry Search', url: 'https://news.google.com/rss/search?q=clinical+dentistry+india&hl=en-IN&gl=IN&ceid=IN:en', category: 'Indian Dental News' },
  { name: 'Indian Journal of Dental Research', url: 'https://pubmed.ncbi.nlm.nih.gov/rss/search/1/P3k7uH5Zp4Nl5yW8v/?term=Indian+Journal+of+Dental+Research', category: 'Research Updates' },
  { name: 'NDTV Dental Health India', url: 'https://feeds.feedburner.com/ndtvhealth-latest', category: 'Indian Dental News' },
];


function isMagazineQuality(item: any): boolean {
  const content = `${item.title} ${item.description || item.content || ''}`.toLowerCase();
  // Filter for high-impact professional keywords
  return DENTAL_MAGAZINE_KEYWORDS.some(keyword => content.includes(keyword));
}



async function fetchFromNewsData(): Promise<NewsItem[]> {
  const apiKey = 'pub_11ccc59aed8b4c58bdd89cd6d8286e2f';
  // Focused on top Indian Magazines & Journals
  const url = `https://newsdata.io/api/1/latest?apikey=${apiKey}&q=(Famdent+OR+IJDR+OR+JCD+OR+"Indian+Journal+of+Dental+Research")+AND+dentistry&language=en`;

  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'success' && data.results) {
      return data.results
        .filter(isMagazineQuality)
        .map((article: any) => {
        let summary = article.description || article.content || 'Dental news update from global sources.';
        summary = summary.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();
        if (summary.length > 180) summary = summary.substring(0, 177) + '...';

        return {
          id: article.article_id,
          title: article.title || 'Global Dental News',
          summary: summary,
          link: article.link,
          source: article.source_id?.toUpperCase() || 'GLOBAL NEWS',
          publishedDate: article.pubDate || new Date().toISOString(),
          category: 'Latest Dental News',
          imageUrl: article.image_url,
          isVideo: false
        };
      });
    }
  } catch (err) {
    console.error('NewsData API Error:', err);
  }
  return [];
}

async function fetchFromRSS(feed: any): Promise<NewsItem[]> {
  const apiKey = 'qmsfgi1veiedlxio3jqifg4hg2pyinvlice7geib';
  const url = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}&api_key=${apiKey}&count=20`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'ok') {
      return data.items
        .filter(isMagazineQuality)
        .map((item: any) => {
        const link = item.link || '#';
        const isYouTube = link.includes('youtube.com') || link.includes('youtu.be') || feed.url.includes('youtube.com');
        const videoId = isYouTube ? extractYouTubeId(link) : undefined;
        
        let summary = item.description || item.content || 'Click to read full details...';
        summary = summary.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();
        if (summary.length > 180) summary = summary.substring(0, 177) + '...';

        return {
          id: item.guid || link,
          title: item.title?.trim() || 'Dental Update',
          summary: summary,
          link: link,
          source: feed.name,
          publishedDate: item.pubDate || new Date().toISOString(),
          category: feed.category,
          imageUrl: isYouTube && videoId
            ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` 
            : (item.thumbnail || item.enclosure?.link),
          isVideo: isYouTube && videoId !== undefined,
          videoId: videoId,
        };
      });
    }
  } catch (err) {
    console.error(`RSS2JSON Error [${feed.name}]:`, err);
  }
  return [];
}


async function fetchFromGNews(): Promise<NewsItem[]> {
  const apiKey = '33b834bdb3196ebaa8ec9941b32a07ac';
  // Target: Indian Dental Magazines + Peer Reviewed Content
  const url = `https://gnews.io/api/v4/search?q=("Famdent"+OR+"Dental+Practice+South+Asia"+OR+"IJDR")+AND+dentistry&lang=en&max=10&apikey=${apiKey}`;

  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.articles) {
      return data.articles
        .map((article: any) => {
          let summary = article.description || article.content || 'Clinical update from GNews research network.';
          summary = summary.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();
          if (summary.length > 180) summary = summary.substring(0, 177) + '...';

          return {
            id: article.url,
            title: article.title,
            summary: summary,
            link: article.url,
            source: article.source.name.toUpperCase() + ' (INDIA)',
            publishedDate: article.publishedAt,
            category: 'Indian Dental News',
            imageUrl: article.image,
            isVideo: false
          };
        });
    }
  } catch (err) {
    console.error('GNews API Error:', err);
  }
  return [];
}

export async function fetchAllNews(): Promise<NewsItem[]> {
  // Parallel fetch: RSS (via API) + NewsData API + GNews API
  const rssPromises = FEEDS.map(feed => fetchFromRSS(feed));
  const newsDataPromise = fetchFromNewsData();
  const gNewsPromise = fetchFromGNews();
  
  const allResults = await Promise.allSettled([...rssPromises, newsDataPromise, gNewsPromise]);
  
  const allItems: NewsItem[] = allResults.flatMap((result: any) => 
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
  // 1. Direct Enclosure
  if (item.enclosure && item.enclosure.url) return item.enclosure.url;
  
  // 2. Media Content (Standard RSS Media)
  if (item.mediaContent) {
    if (Array.isArray(item.mediaContent)) return item.mediaContent[0]?.$?.url;
    return item.mediaContent?.$?.url;
  }

  // 3. Media Group (Used by YouTube and some news feeds)
  if (item.mediaGroup && item.mediaGroup['media:thumbnail']) {
    const thumbs = item.mediaGroup['media:thumbnail'];
    return Array.isArray(thumbs) ? thumbs[0]?.$?.url : thumbs?.$?.url;
  }

  // 4. Scrape from content:encoded or common summary
  const content = (item.contentEncoded || '') + (item.content || '') + (item.contentSnippet || '');
  const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
  if (imgMatch && imgMatch[1] && !imgMatch[1].includes('feedburner')) {
    return imgMatch[1];
  }

  return undefined;
}




function extractYouTubeId(url: string): string | undefined {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  const id = (match && match[2].length === 11) ? match[2] : undefined;
  // Return undefined if not a valid ID format
  return id;
}

