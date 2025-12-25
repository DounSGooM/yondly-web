
import React from 'react';
import styles from './CommunityStats.module.css';

export const CommunityStats: React.FC = () => {
    return (
        <div className={styles.statsContainer}>
            <div className={styles.statsBar}>
                <div className={styles.left}>
                    <span className={styles.label}>La communauté grandit vite ! 📈</span>
                    <div className={styles.avatars}>
                        <img src="https://i.pravatar.cc/100?img=12" alt="User" />
                        <img src="https://i.pravatar.cc/100?img=47" alt="User" />
                        <img src="https://i.pravatar.cc/100?img=11" alt="User" />
                        <div className={styles.youBadge}>You</div>
                    </div>
                </div>

                <div className={styles.right}>
                    <div className={styles.counter}>
                        <span className={styles.count}>1</span>
                        <span className={styles.subtext}>PIONNIERS INSCRITS</span>
                    </div>
                    <div className={styles.iconCircle}>
                        👥
                    </div>
                </div>
            </div>
        </div>
    );
};
