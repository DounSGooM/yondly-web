import React, { useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Reveal } from '../components/Reveal';
import { AppShowcase } from '../sections/AppShowcase';
import styles from './Merchant.module.css';
import { Link } from 'react-router-dom';

export const Merchant: React.FC = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <>
            <Navbar />
            <main className={styles.pageContainer}>

                {/* Hero Section */}
                <section className={styles.hero}>
                    <div className={styles.heroContent}>
                        <Reveal>
                            <h1 className={styles.title}>
                                Développez votre commerce <br />
                                <span className={styles.highlight}>avec Yondly.</span>
                            </h1>
                        </Reveal>
                        <Reveal delay={0.2}>
                            <p className={styles.subtitle}>
                                Une solution tout-en-un pour valoriser vos stocks. Vente de seconde main, offre de location ou paniers anti-gaspillage : diversifiez vos revenus simplement.
                            </p>
                        </Reveal>
                        <Reveal delay={0.4}>
                            <Link to="/contact-pro" className={styles.ctaButton}>
                                Devenir Partenaire
                            </Link>
                        </Reveal>
                    </div>

                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                        <img
                            src="/assets/merchant_blank_bag.png"
                            alt="Intérieur Commerce Partenaire Yondly"
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                borderRadius: '24px',
                                filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.15))'
                            }}
                        />
                        <div className={styles.logoOverlay}>
                            <img
                                src="/assets/yondly_transparent.png"
                                alt="Logo Yondly"
                                className={styles.logoImage}
                            />
                            <span className={styles.bagText}>Panier Anti-Gaspi</span>
                        </div>
                    </div>
                </section>

                {/* Key Benefits */}
                <section className={styles.benefitsSection}>
                    <div className={styles.benefitsGrid}>
                        <Reveal delay={0.1} fullHeight>
                            <div className={styles.benefitCard}>
                                <span className={styles.benefitIcon}>🥗</span>
                                <h3 className={styles.benefitTitle}>Anti-Gaspillage</h3>
                                <p className={styles.benefitText}>
                                    Transformez vos invendus alimentaires en revenus. Proposez des paniers surprises et limitez vos pertes nettes.
                                </p>
                            </div>
                        </Reveal>
                        <Reveal delay={0.2} fullHeight>
                            <div className={styles.benefitCard}>
                                <span className={styles.benefitIcon}>♻️</span>
                                <h3 className={styles.benefitTitle}>Seconde Main & Destockage</h3>
                                <p className={styles.benefitText}>
                                    Vendez vos fins de série, retours clients ou articles d'occasion. Une nouvelle vie pour vos produits, une marge préservée pour vous.
                                </p>
                            </div>
                        </Reveal>
                        <Reveal delay={0.2} fullHeight>
                            <div className={styles.benefitCard}>
                                <span className={styles.benefitIcon}>🛠️</span>
                                <h3 className={styles.benefitTitle}>Location de Matériel</h3>
                                <p className={styles.benefitText}>
                                    Rentabilisez vos actifs dormants. Bricolage, jardinage, sport : proposez vos équipements à la location courte durée en toute sécurité.
                                </p>
                            </div>
                        </Reveal>
                        <Reveal delay={0.3} fullHeight>
                            <div className={styles.benefitCard}>
                                <span className={styles.benefitIcon}>📍</span>
                                <h3 className={styles.benefitTitle}>Visibilité Locale</h3>
                                <p className={styles.benefitText}>
                                    Attirez le quartier en magasin. Chaque offre postée sur Yondly est une publicité gratuite géolocalisée pour votre point de vente.
                                </p>
                            </div>
                        </Reveal>
                    </div>

                    <Reveal delay={0.4} width="100%">
                        <div className={styles.statsBar}>
                            <div className={styles.statItem}>
                                <span className={styles.statNumber}>+15%</span>
                                <span className={styles.statLabel}>Chiffre d'Affaires</span>
                            </div>
                            <div className={styles.statItem}>
                                <span className={styles.statNumber}>-100%</span>
                                <span className={styles.statLabel}>Gaspillage Alimentaire</span>
                            </div>
                            <div className={styles.statItem}>
                                <span className={styles.statNumber}>500+</span>
                                <span className={styles.statLabel}>Commerces Partenaires</span>
                            </div>
                        </div>
                    </Reveal>
                </section>

                <AppShowcase />
            </main>
            <Footer />
        </>
    );
};
