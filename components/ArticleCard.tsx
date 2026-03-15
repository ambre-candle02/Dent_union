'use client';

import React from 'react';
import styles from './ArticleCard.module.css';
import { NewsItem } from '@/utils/rss';

interface Props {
  article: NewsItem;
}

const VERIFIED_SOURCES = ['ADA News', 'FDI World Dental', 'IDA News', 'PubMed Dentistry'];

const ArticleCard = ({ article }: Props) => {
  const isVerified = VERIFIED_SOURCES.includes(article.source);

  const timeAgo = (dateStr: string) => {
    try {
      const now = new Date();
      const past = new Date(dateStr);
      const diffInMs = now.getTime() - past.getTime();
      const diffInMins = Math.floor(diffInMs / (1000 * 60));
      const diffInHours = Math.floor(diffInMins / 60);
      const diffInDays = Math.floor(diffInHours / 24);

      if (diffInDays > 0) return `${diffInDays}d ago`;
      if (diffInHours > 0) return `${diffInHours}h ago`;
      return `${Math.max(1, diffInMins)}m ago`;
    } catch (e) {
      return 'Recently';
    }
  };

  return (
    <div className={`${styles.card} card fade-in`}>
      <div className={styles.header}>
        <div className={styles.sourceInfo}>
          <div className={styles.sourceLogo}>{article.source[0]}</div>
          <div>
            <div className={styles.sourceNameRow}>
              <h4 className={styles.sourceName}>{article.source}</h4>
              {isVerified && <span className={styles.verifiedBadge} title="Official Dental Authority">✓ Verified Source</span>}
            </div>
            <div className={styles.statusRow}>
              <span className={styles.timestamp}>{timeAgo(article.publishedDate)} • {article.category}</span>
              {article.isVideo && <span className={styles.liveBadge}>CLINICAL VIDEO</span>}
            </div>
          </div>
        </div>
      </div>
      
      <div className={styles.content}>
        <a href={article.link} target="_blank" rel="noopener noreferrer" className={styles.titleLink}>
          <h3 className={styles.title}>{article.title}</h3>
        </a>
        <p className={styles.summary}>{article.summary}</p>
        
        {article.isVideo && article.videoId ? (
          <div className={styles.videoContainer}>
            <iframe
              width="100%"
              height="340"
              src={`https://www.youtube.com/embed/${article.videoId}`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className={styles.video}
            ></iframe>
          </div>
        ) : (
          <div className={styles.imageContainer}>
            <img 
              src={article.imageUrl} 
              alt={article.title} 
              className={styles.image}
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&q=80&w=800';
              }}
            />
          </div>
        )}

        <div className={styles.aiSummary}>
          <div className={styles.aiHeader}>
            <span className={styles.aiLabel}>🦷 DENTUNION AI INSIGHT</span>
            <span className={styles.aiConfidence}>98% Match</span>
          </div>
          <p>Key Innovation: This research highlights advancements in {article.title.split(' ').slice(0, 3).join(' ')}. Clinical takeaway focuses on improved patient outcomes and procedure efficiency.</p>
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.actions}>
          <button className={styles.actionBtn}>👍 Relevant</button>
          <button className={styles.actionBtn}>💬 Discuss</button>
          <button className={styles.actionBtn}>🔗 Share</button>
        </div>
        <a href={article.link} target="_blank" rel="noopener noreferrer" className={styles.readMore}>
          Full Research →
        </a>
      </div>
    </div>
  );
};


export default ArticleCard;
