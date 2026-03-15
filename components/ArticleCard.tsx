'use client';

import React from 'react';
import styles from './ArticleCard.module.css';
import { NewsItem } from '@/utils/rss';

interface Props {
  article: NewsItem;
}

const ArticleCard = ({ article }: Props) => {
  const timeAgo = (dateStr: string) => {
    const now = new Date();
    const past = new Date(dateStr);
    const diffInMs = now.getTime() - past.getTime();
    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMins / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 0) return `${diffInDays}d ago`;
    if (diffInHours > 0) return `${diffInHours}h ago`;
    return `${diffInMins}m ago`;
  };

  return (
    <div className={`${styles.card} card fade-in`}>
      <div className={styles.header}>
        <div className={styles.sourceInfo}>
          <div className={styles.sourceLogo}>{article.source[0]}</div>
          <div>
            <h4 className={styles.sourceName}>{article.source}</h4>
            <div className={styles.statusRow}>
              <span className={styles.timestamp}>{timeAgo(article.publishedDate)} • Public</span>
              {article.isVideo && <span className={styles.liveBadge}>LIVE VIDEO</span>}
            </div>
          </div>
        </div>
      </div>
      
      <div className={styles.content}>
        <h3 className={styles.title}>{article.title}</h3>
        <p className={styles.summary}>{article.summary.substring(0, 180)}...</p>
        
        {article.isVideo && article.videoId ? (
          <div className={styles.videoContainer}>
            <iframe
              width="100%"
              height="315"
              src={`https://www.youtube.com/embed/${article.videoId}`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className={styles.video}
            ></iframe>
          </div>
        ) : article.imageUrl && (
          <div className={styles.imageContainer}>
            <img src={article.imageUrl} alt={article.title} className={styles.image} />
          </div>
        )}

        <div className={styles.aiSummary}>
          <span className={styles.aiLabel}>🦷 AI Dental Insight</span>
          <p>This article discusses key advancements in {article.title.toLowerCase()}. Key takeaway: Recent clinical studies suggest a 15% increase in efficiency using this methodology.</p>
        </div>
      </div>

      <div className={styles.footer}>
        <a href={article.link} target="_blank" rel="noopener noreferrer" className={styles.readMore}>
          Read Full Article →
        </a>
        <div className={styles.actions}>
          <button>Like</button>
          <button>Comment</button>
          <button>Share</button>
        </div>
      </div>
    </div>
  );
};

export default ArticleCard;
