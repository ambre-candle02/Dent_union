'use client';

import React from 'react';
import styles from './Navbar.module.css';

interface Props {
  onSearch: (query: string) => void;
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

const Navbar = ({ onSearch, activeCategory, onCategoryChange }: Props) => {
  return (
    <nav className={styles.nav}>
      <div className={`${styles.container} container`}>
        <div className={styles.logo}>
          <span className={styles.dent}>Dent</span><span className={styles.union}>Union</span>
        </div>
        <div className={styles.search}>
          <input 
            type="text" 
            placeholder="Search for news, research, or peers..." 
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
        <div className={styles.links}>
          <a href="#" className={activeCategory === 'All' ? styles.active : ''} onClick={() => onCategoryChange('All')}>Home</a>
          <a href="#" className={activeCategory === 'Dental Magazines' ? styles.active : ''} onClick={() => onCategoryChange('Dental Magazines')}>Magazines</a>
          <a href="#" className={activeCategory === 'Clinical Research' ? styles.active : ''} onClick={() => onCategoryChange('Clinical Research')}>Clinical Research</a>
          <a href="#" className={activeCategory === 'Education' ? styles.active : ''} onClick={() => onCategoryChange('Education')}>Education</a>
          <a href="#" className={activeCategory === 'Jobs' ? styles.active : ''} onClick={() => onCategoryChange('Jobs')}>Jobs</a>
          <a href="#" className={activeCategory === 'Events' ? styles.active : ''} onClick={() => onCategoryChange('Events')}>Events</a>
        </div>


        <div className={styles.profile}>
          <div className={styles.avatar}>DR</div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
