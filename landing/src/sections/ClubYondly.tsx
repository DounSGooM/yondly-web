import React from 'react';
import styles from './ClubYondly.module.css';
import { Reveal } from '../components/Reveal';

export const ClubYondly: React.FC = () => {
    return (
        <section id="club" className={styles.clubSection}>
            <div className={`container ${styles.container}`}>
                <div className={styles.header}>
                    <Reveal width="100%">
                        <span className={styles.pill}>🌱 Gamification Nature</span>
                    </Reveal>
                    <Reveal delay={0.2} width="100%">
                        <h2 className={styles.title}>
                            Plus vous agissez,<br />
                            <span className={styles.highlight}>plus vous grandissez.</span>
                        </h2>
                    </Reveal>
                    <Reveal delay={0.3} width="100%">
                        <p className={styles.description}>
                            Chaque geste compte. Évoluez de la Graine à la Forêt en sauvant du CO₂ et débloquez des pouvoirs de curation exclusifs.
                        </p>
                    </Reveal>
                </div>

                <div className={styles.tiersGrid}>
                    {/* Level 1: Graine */}
                    <Reveal delay={0.4} direction="up" className={styles.novice} width="100%" fullHeight>
                        <div className={`${styles.tierCard} ${styles.novice}`}>
                            <div className={styles.iconWrapper}>🌱</div>
                            <h3>Graine</h3>
                            <span className={styles.subtitle}>LE DÉBUT</span>

                            <div className={styles.objectiveBox}>
                                <div className={styles.objectiveLabel}>🚀 DÉPART</div>
                                <div className={styles.objectiveValue}>✅ 0 kg CO₂</div>
                            </div>

                            <ul className={styles.benefits}>
                                <li>⭐️ Badge "Graine"</li>
                                <li>🎁 Accès au Market</li>
                            </ul>
                        </div>
                    </Reveal>

                    {/* Level 2: Pousse */}
                    <Reveal delay={0.5} direction="up" className={styles.bronze} width="100%" fullHeight>
                        <div className={`${styles.tierCard} ${styles.bronze}`}>
                            <div className={styles.iconWrapper}>🌿</div>
                            <h3>Pousse</h3>
                            <span className={styles.subtitle}>LA CROISSANCE</span>

                            <div className={styles.objectiveBox}>
                                <div className={styles.objectiveLabel}>🚀 OBJECTIF</div>
                                <div className={styles.objectiveValue}>✅ 100 kg CO₂</div>
                            </div>

                            <ul className={styles.benefits}>
                                <li>⭐️ Badge "Pousse"</li>
                                <li>🔔 Recherches Sauvegardées</li>
                                <li>📊 Dashboard Impact</li>
                            </ul>
                        </div>
                    </Reveal>

                    {/* Level 3: Arbre */}
                    <Reveal delay={0.6} direction="up" className={styles.silver} width="100%" fullHeight>
                        <div className={`${styles.tierCard} ${styles.silver}`}>
                            <div className={styles.iconWrapper}>🌳</div>
                            <h3>Arbre</h3>
                            <span className={styles.subtitle}>L'ENCRAGE</span>

                            <div className={styles.objectiveBox}>
                                <div className={styles.objectiveLabel}>🚀 OBJECTIF</div>
                                <div className={styles.objectiveValue}>✅ 500 kg CO₂</div>
                            </div>

                            <ul className={styles.benefits}>
                                <li>⭐️ Badge "Arbre"</li>
                                <li>🎯 Filtres Avancés</li>
                                <li className={styles.strongBenefit}>✨ Pages Inspirations</li>
                            </ul>
                        </div>
                    </Reveal>

                    {/* Level 4: Forêt */}
                    <Reveal delay={0.7} direction="up" className={styles.gold} width="100%" fullHeight allowOverflow>
                        <div className={`${styles.tierCard} ${styles.gold} ${styles.highlighted}`}>
                            <div className={styles.highlightBadge}>ULTIME</div>
                            <div className={styles.iconWrapper}>🌲</div>

                            <h3>Forêt</h3>
                            <span className={styles.subtitle}>L'IMPACT TOTAL</span>

                            <div className={styles.objectiveBox}>
                                <div className={styles.objectiveLabel}>🚀 OBJECTIF</div>
                                <div className={styles.objectiveValue}>📅 2.5 Tonnes</div>
                            </div>

                            <ul className={styles.benefits}>
                                <li className={styles.strongBenefit}>👑 Badge Prestige</li>
                                <li>💎 Curation Illimitée</li>
                                <li>🌍 Certificat Impact</li>
                            </ul>
                        </div>
                    </Reveal>
                </div>
            </div>
        </section>
    );
};
