
import React from 'react';
import styles from './FeatureCard.module.css';

interface FeatureCardProps {
    imageSrc: string;
    title: string;
    description: string;
    badge?: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ imageSrc, title, description, badge }) => {
    return (
        <div className={styles.card}>
            <div className={styles.imageWrapper}>
                <img src={imageSrc} alt={title} className={styles.image} />
                {badge && <span className={styles.badge}>{badge}</span>}
            </div>
            <div className={styles.content}>
                <h3 className={styles.title}>{title}</h3>
                <p className={styles.description}>{description}</p>
            </div>
        </div>
    );
};
