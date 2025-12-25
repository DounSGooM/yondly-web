import React from 'react';
import styles from './AppShowcase.module.css';
import { Reveal } from '../components/Reveal';
import { AppleLogo, GooglePlayLogo } from '../components/StoreIcons';

export const AppShowcase: React.FC = () => {
    return (
        <section className={styles.showcaseSection}>
            <div className={`container ${styles.container}`}>
                <div className={styles.content}>
                    <Reveal direction="right">
                        <h2 className={styles.title}>
                            Tout Yondly dans<br />
                            <span className={styles.highlight}>votre poche.</span>
                        </h2>
                    </Reveal>

                    <Reveal delay={0.3}>
                        <p className={styles.description}>
                            Accédez à la carte des objets, au fil d'actualité de votre quartier et suivez vos échanges en temps réel.
                            Disponible sur iOS et Android.
                        </p>
                    </Reveal>

                    <Reveal delay={0.5}>
                        <div className={styles.downloadButtons}>
                            <button className={styles.storeButton}>
                                <AppleLogo className={styles.icon} />
                                App Store
                            </button>
                            <button className={`${styles.storeButton} ${styles.google}`}>
                                <GooglePlayLogo className={styles.icon} />
                                Google Play
                            </button>
                        </div>
                    </Reveal>
                </div>

                <div className={styles.imageWrapper}>
                    <Reveal delay={0.4} direction="left">
                        <img src="/assets/app_mockup_profile.png" alt="Yondly Mobile App Profile" className={styles.mockup} />
                    </Reveal>
                    <div className={styles.blob}></div>
                </div>
            </div>
        </section>
    );
};
