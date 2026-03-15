'use client';

import React from 'react';
import styles from './Sidebar.module.css';

const Sidebar = () => {
  return (
    <div className={styles.sidebar}>
      <div className={`${styles.profileCard} card`}>
        <div className={styles.banner}></div>
        <div className={styles.avatarLarge}>DR</div>
        <div className={styles.profileInfo}>
          <h3>Dr. Amit Sharma</h3>
          <p>Endodontist | BDS, MDS</p>
        </div>
        <div className={styles.stats}>
          <div className={styles.statLine}>
            <span>Profile views</span>
            <span className={styles.statVal}>124</span>
          </div>
          <div className={styles.statLine}>
            <span>Post impressions</span>
            <span className={styles.statVal}>1.2K</span>
          </div>
        </div>
      </div>

      <div className={`${styles.quickLinks} card`}>
        <h4>My Shortcuts</h4>
        <ul>
          <li><span>📚</span> Saved Journals</li>
          <li><span>💼</span> Job Alerts</li>
          <li><span>📅</span> Upcoming Webinars</li>
          <li><span>🧬</span> Research Groups</li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
