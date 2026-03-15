import Parser from 'rss-parser';
import fs from 'fs';
import path from 'path';

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  link: string;
  source: string;
  sourceLogo?: string;
  publishedDate: string;
  category: string;
  imageUrl?: string;
  isVideo?: boolean;
  videoId?: string;
  isVerified?: boolean;
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
  // 📚 Dental Journals (High Authority)
  { name: 'Nature: British Dental Journal', url: 'https://www.nature.com/bdj.rss', category: 'Dental Journals' },
  { name: 'Journal of Dental Research', url: 'https://pubmed.ncbi.nlm.nih.gov/rss/search/1/P3k7uH5Zp4Nl5yW8v/?term=Journal+of+Dental+Research', category: 'Dental Journals' },
  { name: 'Dentistry Today', url: 'https://www.dentistrytoday.com/feed/', category: 'Dental Journals' },
  
  // 🔬 Clinical Research & Advances
  { name: 'PubMed: Clinical Dentistry', url: 'https://pubmed.ncbi.nlm.nih.gov/rss/search/1/?term=clinical+dentistry+case+reports', category: 'Clinical Research' },
  { name: 'ADA Research News', url: 'https://www.ada.org/en/publications/ada-news/rss', category: 'Clinical Research' },
  { name: 'International Association for Dental Research', url: 'https://www.iadr.org/RSS.xml', category: 'Clinical Research' },
  
  // 🎓 Education & Resources
  { name: 'NIDCR: Dental Education', url: 'https://www.nidcr.nih.gov/news-events/rss', category: 'Education' },
  { name: 'WHO Oral Health Updates', url: 'https://www.who.int/rss-feeds/news-english.xml', category: 'Education' },
  
  // 💼 Dental Jobs (Global & India)
  { name: 'Dental Tribune Jobs', url: 'https://www.dental-tribune.com/jobs/feed/', category: 'Jobs' },
  
  // 🎤 Events & Webinars
  { name: 'FDI World Dental Events', url: 'https://www.fdiworlddental.org/rss.xml', category: 'Events' },
  { name: 'ADA Conferences', url: 'https://www.ada.org/en/publications/ada-news/rss', category: 'Events' },

  // 🇮🇳 Indian Professional Focus
  { name: 'IDA Official (India)', url: 'https://ida.org.in/feed', category: 'Indian Dental News' },
  { name: 'Indian Journal of Dental Research', url: 'https://pubmed.ncbi.nlm.nih.gov/rss/search/1/P3k7uH5Zp4Nl5yW8v/?term=Indian+Journal+of+Dental+Research', category: 'Indian Dental News' },
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
        .map((article: any, i: number) => {
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
          imageUrl: extractImage(article) || getTopicImage(article.title, i),
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
        .map((item: any, i: number) => {
          const link = item.link || '#';
          const isYouTube = link.includes('youtube.com') || link.includes('youtu.be') || feed.url.includes('youtube.com');
          const videoId = isYouTube ? extractYouTubeId(link) : undefined;
          
          let summary = item.description || item.content || 'Click to read full details...';
          summary = summary.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();
          if (summary.length > 180) summary = summary.substring(0, 177) + '...';

          // Use the deep extraction OR Topic-based fallback with sequential diversity
          const genuineImage = extractImage(item) || getTopicImage(item.title, i);


          return {
          id: item.guid || link,
          title: item.title?.trim() || 'Dental Update',
          summary: summary,
          link: link,
          source: feed.name,
          sourceLogo: `https://www.google.com/s2/favicons?sz=64&domain=${new URL(link).hostname}`,
          publishedDate: item.pubDate || new Date().toISOString(),
          category: feed.category,
          imageUrl: isYouTube && videoId
            ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` 
            : genuineImage,
          isVideo: isYouTube && videoId !== undefined,
          videoId: videoId,
          isVerified: true
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
        .map((article: any, i: number) => {
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
            imageUrl: extractImage(article) || getTopicImage(article.title, i),
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

// 🚀 DentUnion Topic-Based Fallback System (With Diversity logic)
const TOPIC_GALLERY: Record<string, string[]> = {
  implant: [
    'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?q=80&w=800',
    'https://images.unsplash.com/photo-1551601651-2a8555f1a136?q=80&w=800',
    'https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=800'
  ],
  ortho: [
    'https://images.unsplash.com/photo-1625515845397-30176028549d?q=80&w=800',
    'https://images.unsplash.com/photo-1612117502667-db0995fa6668?q=80&w=800'
  ],
  surgery: [
    'https://images.unsplash.com/photo-1551076805-e1869033e561?q=80&w=800',
    'https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=800'
  ],
  research: [
    'https://images.unsplash.com/photo-1516062423079-7ca13cdc7f5a?q=80&w=800',
    'https://images.unsplash.com/photo-1512678080530-7760d81faba6?q=80&w=800',
    'https://images.unsplash.com/photo-1445527815219-ecbfec67492e?q=80&w=800'
  ],
  default: [
    'https://images.unsplash.com/photo-1588776813677-77aaf558ff52?q=80&w=800',
    'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?q=80&w=800',
    'https://images.unsplash.com/photo-1600170311833-c2cf5280ce49?q=80&w=800'
  ]
};

function getTopicImage(title: string, index: number = 0): string {
  const t = title.toLowerCase();
  let key = 'default';
  
  if (t.includes('implant')) key = 'implant';
  else if (t.includes('ortho') || t.includes('braces')) key = 'ortho';
  else if (t.includes('surgery')) key = 'surgery';
  else if (t.includes('research') || t.includes('journal')) key = 'research';

  const images = TOPIC_GALLERY[key];
  return images[index % images.length];
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

