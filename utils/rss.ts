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
  'dentist', 'dental', 'implantology', 'orthodontics', 'periodontics', 'endodontics', 
  'oral surgery', 'prosthodontics', 'restorative dentistry', 'pedodontics', 'radiology',
  'stomatology', 'root canal', 'maxillofacial', 'clinical dentistry', 'dental research',
  'pathology', 'gingival', 'denture', 'famdent', 'jcd', 'ijdr', 'clinical case'
];

const BANNED_KEYWORDS = [
  'loan', 'insurance', 'marketing', 'stocks', 'price', 'dividend', 'opening ceremony', 
  'student', 'salary', 'recruitment', 'appointment', 'generic news', 'weather'
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
  const title = (item.title || '').toLowerCase();
  const desc = (item.description || item.content || '').toLowerCase();
  const content = `${title} ${desc}`;
  
  // 1. Must have at least one Dentist-Specific keyword
  const isDental = DENTAL_MAGAZINE_KEYWORDS.some(k => content.includes(k));
  
  // 2. Must NOT have any Banned/Junk keywords
  const isJunk = BANNED_KEYWORDS.some(k => content.includes(k));
  
  return isDental && !isJunk;
}




async function fetchFromNewsData(): Promise<NewsItem[]> {
  const apiKey = 'pub_11ccc59aed8b4c58bdd89cd6d8286e2f';
  // Focused on top Indian Magazines & Expert Scholar Statements
  const url = `https://newsdata.io/api/1/latest?apikey=${apiKey}&q=(Famdent+OR+IJDR+OR+JCD+OR+"Expert+Opinion"+OR+"Interview")+AND+dentistry&language=en`;


  
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
          imageUrl: extractImage(article) || getTopicImage(article.title),
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

          // 🚀 Use the deep extraction OR Topic-based fallback
          const genuineImage = extractImage(item) || getTopicImage(item.title);

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
              : genuineImage,
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
  // Target: Scholars, Professor Interviews and Clinical Perspective
  const url = `https://gnews.io/api/v4/search?q=("Expert+Opinion"+OR+"Interview"+OR+"Professor")+AND+dentistry&lang=en&max=10&apikey=${apiKey}`;


  
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
            imageUrl: extractImage(article) || getTopicImage(article.title),
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

// 🚀 DentUnion Topic-Based Fallback System
function getTopicImage(title: string): string {
  const t = title.toLowerCase();
  
  if (t.includes('implant')) return 'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?q=80&w=800'; // Implant model
  if (t.includes('ortho') || t.includes('braces') || t.includes('align')) return 'https://images.unsplash.com/photo-1625515845397-30176028549d?q=80&w=800'; // Orthodontic
  if (t.includes('surgery') || t.includes('maxillofacial')) return 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?q=80&w=800'; // Surgery
  if (t.includes('tech') || t.includes('digital') || t.includes('ai')) return 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=800'; // Modern Tech
  if (t.includes('research') || t.includes('journal') || t.includes('study')) return 'https://images.unsplash.com/photo-1516062423079-7ca13cdc7f5a?q=80&w=800'; // Lab Research
  if (t.includes('periodontic') || t.includes('gum') || t.includes('gingival')) return 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=800'; // Clinical care
  if (t.includes('endo') || t.includes('root canal')) return 'https://images.unsplash.com/photo-1612117502667-db0995fa6668?q=80&w=800'; // Endo/Canal
  
  return 'https://images.unsplash.com/photo-1588776813677-77aaf558ff52?q=80&w=800'; // Default High-Quality Clinic
}

function extractImage(item: any): string | undefined {
  // 1. Direct from API fields
  if (item.image && item.image !== "") return item.image;
  if (item.urlToImage && item.urlToImage !== "") return item.urlToImage;
  if (item.image_url && item.image_url !== "") return item.image_url;

  // 2. RSS Enclosure
  if (item.enclosure && item.enclosure.url) return item.enclosure.url;
  
  // 3. Media Content
  if (item.mediaContent) {
    if (Array.isArray(item.mediaContent)) return item.mediaContent[0]?.$?.url;
    return item.mediaContent?.$?.url;
  }

  // 4. Scrape from content
  const content = (item.contentEncoded || '') + (item.description || '') + (item.contentSnippet || '');
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

