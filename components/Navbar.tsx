'use client';

import React from 'react';
import styles from './Navbar.module.css';

interface Props {
  onSearch: (query: string) => void;
}

const Navbar = ({ onSearch }: Props) => {
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
          <a href="#" className={styles.active}>Home</a>
          <a href="#">Dental News</a>
          <a href="#">Clinical Research</a>
          <a href="#">Dental Journals</a>
          <a href="#">Education</a>
          <a href="#">Jobs</a>
          <a href="#">Events</a>
        </div>

        <div className={styles.profile}>
          <div className={styles.avatar}>DR</div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
