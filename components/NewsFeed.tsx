'use client';

import React, { useEffect, useState } from 'react';
import ArticleCard from './ArticleCard';
import { NewsItem } from '@/utils/rss';
import styles from './NewsFeed.module.css';

interface Props {
  searchQuery: string;
}

const categories = ['All', 'Latest Dental News', 'Research Updates', 'Global Dentistry', 'Clinical Cases', 'Indian Dental News'];

const NewsFeed = ({ searchQuery }: Props) => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchNews = async () => {
    try {
      const res = await fetch('/api/news');
      const data = await res.json();
      setNews(data);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const filteredNews = news.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.source.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

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

      <div className={styles.categoryTabs}>
        {categories.map(cat => (
          <button 
            key={cat} 
            className={activeCategory === cat ? styles.activeTab : styles.tab}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className={styles.divider}>
        <hr />
        <span>Sort by: <b>Recent</b> • Updates: <b>Auto (Every 30m)</b> • Last Sync: <b>{lastUpdated}</b></span>
      </div>

      {filteredNews.length > 0 ? (
        filteredNews.map((item) => (
          <ArticleCard key={item.id} article={item} />
        ))
      ) : (
        <div className={styles.noResults}>
          <p>No dental news found for "{searchQuery}" in {activeCategory}.</p>
        </div>
      )}
    </div>
  );
};


export default NewsFeed;
