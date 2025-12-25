
import React, { useEffect, useState } from 'react';
import styles from './Hero.module.css';
import { Reveal } from '../components/Reveal';

export const Hero: React.FC = () => {
    const [count, setCount] = useState(0);
    const [targetCount, setTargetCount] = useState(1542); // Default fallback

    useEffect(() => {
        // Fetch real stats
        fetch('http://localhost:8000/api/stats/public-summary')
            .then(res => res.json())
            .then(data => {
                if (data.total_users) {
                    setTargetCount(data.total_users);
                }
            })
            .catch(err => console.error("Failed to fetch stats", err));
    }, []);

    useEffect(() => {
        let start = 0;
        const duration = 2000; // 2 seconds animation
        const increment = targetCount / (duration / 16); // 60fps

        const timer = setInterval(() => {
            start += increment;
            if (start >= targetCount) {
                setCount(targetCount);
                clearInterval(timer);
            } else {
                setCount(Math.floor(start));
            }
        }, 16);

        return () => clearInterval(timer);
    }, [targetCount]);

    return (
        <section className={styles.heroSection}>
            <div className={`container ${styles.container}`}>
                <div className={styles.heroCard}>
                    <div className={styles.heroOverlay}>

                        <div className={styles.badgesContainer}>
                            <Reveal delay={0.1}>
                                <div className={styles.badgeGreen}>
                                    <span>Déjà {count.toLocaleString()} membres inscrits</span>
                                </div>
                            </Reveal>
                            <Reveal delay={0.2}>
                                <div className={styles.badgePurple}>
                                    Offre de bienvenue : +100 Points
                                </div>
                            </Reveal>
                        </div>

                        <Reveal delay={0.3}>
                            <h1 className={styles.title}>
                                Moins de Gaspillage.<br />
                                <span className={styles.highlight}>Plus de Récompenses.</span>
                            </h1>
                        </Reveal>

                        <Reveal delay={0.4}>
                            <p className={styles.subtitle}>
                                Rejoignez Yondly, la première plateforme tout-en-un pour vendre, louer et donner.
                                Transformez vos objets en pouvoir d'achat.
                            </p>
                        </Reveal>

                        <Reveal delay={0.5} width="100%">
                            <div className={styles.ctaForm}>
                                <div className={styles.inputWrapper}>
                                    <span className={styles.inputIcon}>✉️</span>
                                    <input
                                        type="email"
                                        placeholder="Entrez votre email..."
                                        className={styles.emailInput}
                                    />
                                </div>
                                <button className={styles.submitButton}>
                                    Je rejoins & gagne
                                </button>
                            </div>
                        </Reveal>

                        <Reveal delay={0.6}>
                            <div className={styles.socialProof}>
                                ⭐️ Recommandé par 98% de nos utilisateurs
                            </div>
                        </Reveal>

                    </div>
                </div>
            </div>
        </section>
    );
};
