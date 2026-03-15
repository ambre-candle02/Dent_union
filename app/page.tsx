'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import NewsFeed from '@/components/NewsFeed';
import styles from './page.module.css';

export default function Home() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [activeCategory, setActiveCategory] = React.useState('All');

  return (
    <main className={styles.main}>
      <Navbar onSearch={setSearchQuery} activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
      
      <div className={`${styles.content} container`}>
        <div className={styles.leftCol}>
          <Sidebar />
        </div>
        
        <div className={styles.centerCol}>
          <NewsFeed searchQuery={searchQuery} activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
        </div>

        
        <div className={styles.rightCol}>
          <div className={`${styles.trending} card`}>
            <h4>Trending Topics</h4>
            <ul>
              <li>#DentalAI</li>
              <li>#EndoModern</li>
              <li>#GlobalSurgery2026</li>
              <li>#Teledentistry</li>
            </ul>
          </div>
          
          <div className={`${styles.jobs} card`}>
            <h4>Dental Jobs Nearby</h4>
            <div className={styles.jobItem}>
              <h5>Senior Orthodontist</h5>
              <p>Apollo Dental • Bangalore</p>
            </div>
            <div className={styles.jobItem}>
              <h5>Dental Surgeon</h5>
              <p>Clove Dental • Delhi</p>
            </div>
            <button className={styles.viewJobs}>View all jobs</button>
          </div>
        </div>
      </div>
    </main>
  );
}
