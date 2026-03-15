'use client';

import React, { useEffect, useState } from 'react';
import ArticleCard from './ArticleCard';
import { NewsItem } from '@/utils/rss';
import styles from './NewsFeed.module.css';

interface Props {
  searchQuery: string;
}

const NewsFeed = ({ searchQuery }: Props) => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNews = async () => {
    try {
      const res = await fetch('/api/news');
      const data = await res.json();
      setNews(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
    // Simulate real-time update every 5 minutes
    const interval = setInterval(fetchNews, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const filteredNews = news.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.source.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Fetching latest dental insights...</p>
      </div>
    );
  }

  return (
    <div className={styles.feed}>
      <div className={`${styles.createPost} card`}>
        <div className={styles.postRow}>
          <div className={styles.tinyAvatar}>DR</div>
          <button 
            className={styles.postPlaceholder}
            onClick={() => alert("Coming soon: Real-time case sharing and community posts!")}
          >
            Share a case study or research update...
          </button>
        </div>
        <div className={styles.postActions}>
          <button onClick={() => alert("Upload Case Images")}><span>📸</span> Photo</button>
          <button onClick={() => alert("Upload Clinical Video")}><span>🎥</span> Video</button>
          <button onClick={() => alert("Write Clinical Article")}><span>📄</span> Article</button>
        </div>
      </div>

      <div className={styles.divider}>
        <hr />
        <span>Sort by: <b>Recent</b></span>
      </div>

      {filteredNews.length > 0 ? (
        filteredNews.map((item) => (
          <ArticleCard key={item.id} article={item} />
        ))
      ) : (
        <div className={styles.noResults}>
          <p>No dental news found for "{searchQuery}". Try a different topic!</p>
        </div>
      )}
    </div>
  );
};

export default NewsFeed;
