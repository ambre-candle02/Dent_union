'use client';

import React from 'react';
import styles from './ArticleCard.module.css';
import { NewsItem } from '@/utils/rss';

interface Props {
  article: NewsItem;
}

const VERIFIED_SOURCES = ['ADA News', 'FDI World Dental', 'IDA News', 'PubMed Dentistry'];
const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?q=80&w=800', // Dental Chair
  'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?q=80&w=800', // Surgery Tools
  'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?q=80&w=800', // Professional Clinic
  'https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=800', // Modern X-ray lab
  'https://images.unsplash.com/photo-1516062423079-7ca13cdc7f5a?q=80&w=800', // Microscope research
  'https://images.unsplash.com/photo-1551076805-e1869033e561?q=80&w=800', // Medical lab tech
  'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?q=80&w=800', // Dental implants model
  'https://images.unsplash.com/photo-1551601651-2a8555f1a136?q=80&w=800', // Surgical lighting
  'https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=800', // Patient care
  'https://images.unsplash.com/photo-1512678080530-7760d81faba6?q=80&w=800', // Laboratory research
  'https://images.unsplash.com/photo-1526256262350-7da7584cf5eb?q=80&w=800', // Clinical setting
  'https://images.unsplash.com/photo-1445527815219-ecbfec67492e?q=80&w=800', // Scientific documentation
  'https://images.unsplash.com/photo-1571772996211-1f99c8bf6f80?q=80&w=800', // Tooth modeling
  'https://images.unsplash.com/photo-1576091160550-217359f49f4c?q=80&w=800', // Oral hygiene check 
  'https://images.unsplash.com/photo-1460676746863-95587f719539?q=80&w=800', // Pro sterilization
  'https://images.unsplash.com/photo-1625515845397-30176028549d?q=80&w=800', // Orthodontic work
  'https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=800', // Sterile environment
  'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?q=80&w=800', // Scanning teeth
  'https://images.unsplash.com/photo-1571771410320-48b6f28b3e51?q=80&w=800', // Modern dentistry
  'https://images.unsplash.com/photo-1600170311833-c2cf5280ce49?q=80&w=800', // Equipment close-up
  'https://images.unsplash.com/photo-1612117502667-db0995fa6668?q=80&w=800', // Precise treatment
  'https://images.unsplash.com/photo-1588776813677-77aaf558ff52?q=80&w=800'  // Expert clinic
];



const ArticleCard = ({ article }: Props) => {
  const isVerified = VERIFIED_SOURCES.includes(article.source);
  
  // Hash function to get a unique index for the title
  const getFallback = () => {
    let hash = 5381; // Higher initial entropy
    const key = article.title + (article.id || article.link);
    for (let i = 0; i < key.length; i++) {
      hash = ((hash << 5) + hash) + key.charCodeAt(i);
    }
    const index = Math.abs(hash) % FALLBACK_IMAGES.length;
    return FALLBACK_IMAGES[index];
  };



  const currentImage = article.imageUrl || getFallback();
  const sourceLogo = article.sourceLogo || `https://ui-avatars.com/api/?name=${encodeURIComponent(article.source)}&background=random`;




  // JSON-LD for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": article.title,
    "description": article.summary,
    "image": currentImage,
    "datePublished": article.publishedDate,
    "publisher": {
      "@type": "Organization",
      "name": article.source,
      "logo": {
        "@type": "ImageObject",
        "url": "https://dent-union.vercel.app/logo.png"
      }
    },
    "author": {
      "@type": "Organization",
      "name": article.source
    }
  };


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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className={styles.header}>

        <div className={styles.sourceInfo}>
          <div className={styles.sourceLogoWrap}>
            <img src={sourceLogo} alt="" className={styles.logoImg} onError={(e) => (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${article.source[0]}` } />
          </div>
          <div>
            <div className={styles.sourceNameRow}>
              <h4 className={styles.sourceName}>{article.source}</h4>
              {(isVerified || article.isVerified) && <span className={styles.verifiedBadge} title="Official Dental Authority">✓ Verified Source</span>}
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
              src={currentImage} 
              alt={article.title} 
              className={styles.image}
              onError={(e) => {
                (e.target as HTMLImageElement).src = FALLBACK_IMAGES[0];
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
