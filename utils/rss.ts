import Parser from 'rss-parser';

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

const parser = new Parser();

const FEEDS = [
  { name: 'ADA TV (Video)', url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UC3UBF_16dd2UncCoR0lCgKQ' },
  { name: 'Dentaltown News (Video)', url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCxpTLZhizevXl-vQ6ODEd0A' },
  { name: 'ScienceDaily Dentistry', url: 'https://www.sciencedaily.com/rss/health_medicine/dentistry.xml' },
  { name: 'Google Dental News', url: 'https://news.google.com/rss/search?q=dental+news&hl=en-US&gl=US&ceid=US:en' },
];

export async function fetchAllNews(): Promise<NewsItem[]> {
  const allItems: NewsItem[] = [];

  for (const feed of FEEDS) {
    try {
      const parsed = await parser.parseURL(feed.url);
      
      const items = parsed.items.map((item, index) => {
        const link = item.link || '#';
        const isYouTube = link.includes('youtube.com') || link.includes('youtu.be');
        const videoId = isYouTube ? extractYouTubeId(link) : undefined;

        return {
          id: item.guid || `${feed.name}-${index}-${Date.now()}`,
          title: item.title || 'No Title',
          summary: item.contentSnippet || item.content || 'Click to read more...',
          link: link,
          source: feed.name,
          publishedDate: item.pubDate || new Date().toISOString(),
          category: isYouTube ? 'Video News' : 'Dental News',
          imageUrl: isYouTube ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : extractImage(item),
          isVideo: isYouTube,
          videoId: videoId,
        };
      });

      allItems.push(...items);
    } catch (error) {
      console.error(`Error fetching feed ${feed.name}:`, error);
    }
  }

  // Fallback Mock Data if no feeds work
  if (allItems.length === 0) {
    return [
      {
        id: 'mock-1',
        title: 'New AI technology for Dental Implants',
        summary: 'Researchers have developed a new AI model that improves the success rate of dental implants by 20%. The study shows better osseointegration when AI-planned.',
        link: '#',
        source: 'Medical News Daily (Mocked)',
        publishedDate: new Date().toISOString(),
        category: 'Technology',
      },
      {
        id: 'mock-2',
        title: 'Global Dental Conference 2026 announced',
        summary: 'The biggest dental gathering of the year will focus on digital dentistry and 3D printing in Mumbai.',
        link: '#',
        source: 'DentUnion Events',
        publishedDate: new Date(Date.now() - 3600000).toISOString(),
        category: 'Events',
      }
    ];
  }

  // Sort by date descending
  return allItems.sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime());
}

function extractImage(item: any): string | undefined {
  if (item.enclosure && item.enclosure.url) return item.enclosure.url;
  
  // Try to find image in content
  const content = item.content || '';
  const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
  return imgMatch ? imgMatch[1] : undefined;
}

function extractYouTubeId(url: string): string | undefined {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : undefined;
}
