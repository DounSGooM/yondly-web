import React, { useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Reveal } from '../components/Reveal';
import { AppShowcase } from '../sections/AppShowcase';
import styles from './Mission.module.css';

export const Mission: React.FC = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <>
            <Navbar />
            <main className={styles.pageContainer}>
                <section className={styles.hero}>
                    <Reveal>
                        <h1 className={styles.title}>
                            Réinventer le lien <br />
                            <span className={styles.highlight}>Au cœur de nos quartiers.</span>
                        </h1>
                    </Reveal>
                    <Reveal delay={0.2}>
                        <p className={styles.intro}>
                            Yondly est né d'un constat simple : nous sommes entourés de ressources incroyables, mais nous ne les voyons pas.
                            Notre mission est de connecter chaque voisin pour créer une communauté plus résiliente, solidaire et durable.
                        </p>
                    </Reveal>
                </section>

                <div className={styles.valuesGrid}>
                    <Reveal delay={0.1} fullHeight>
                        <div className={styles.valueCard}>
                            <span className={styles.icon}>🌍</span>
                            <h3 className={styles.valueTitle}>Hyper-Local</h3>
                            <p className={styles.valueDesc}>
                                Tout ce dont vous avez besoin se trouve à moins de 15 minutes.
                                Redécouvrons la puissance de la proximité.
                            </p>
                        </div>
                    </Reveal>
                    <Reveal delay={0.2} fullHeight>
                        <div className={styles.valueCard}>
                            <span className={styles.icon}>♻️</span>
                            <h3 className={styles.valueTitle}>Anti-Gaspillage</h3>
                            <p className={styles.valueDesc}>
                                Chaque objet ou aliment sauvé est une victoire.
                                Nous donnons aux surplus une seconde vie immédiate.
                            </p>
                        </div>
                    </Reveal>
                    <Reveal delay={0.3} fullHeight>
                        <div className={styles.valueCard}>
                            <span className={styles.icon}>🤝</span>
                            <h3 className={styles.valueTitle}>Lien Humain</h3>
                            <p className={styles.valueDesc}>
                                Derrière chaque échange, il y a une rencontre.
                                Nous remplaçons les transactions anonymes par des sourires.
                            </p>
                        </div>
                    </Reveal>
                </div>

                <section className={styles.visionSection}>
                    <div className={styles.visionContent}>
                        <Reveal direction="right">
                            <h2>Notre Vision pour 2030</h2>
                            <p>
                                Imaginez une ville où l'achat neuf est le dernier recours.
                                Où l'on demande d'abord à son voisin avant d'aller au supermarché.
                            </p>
                            <p>
                                Avec Yondly, nous construisons ce futur dès aujourd'hui.
                                En gamifiant l'écologie, nous rendons l'impact positif addictif et accessible à tous, sans culpabilisation.
                            </p>
                        </Reveal>
                    </div>
                    <div className={styles.visionImage}>
                        <Reveal delay={0.2} style={{ width: '100%', height: '100%' }}>
                            <img src="/assets/mission_vision.png" alt="Futuristic Green City Vision 2030" className={styles.visionImgTag} />
                        </Reveal>
                    </div>
                </section>
            </main>
            <AppShowcase />
            <Footer />
        </>
    );
};
