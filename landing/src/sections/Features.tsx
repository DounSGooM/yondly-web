import React from 'react';
import { FeatureCard } from '../components/FeatureCard';
import { CommunityStats } from '../components/CommunityStats';
import { Reveal } from '../components/Reveal';
import styles from './Features.module.css';

export const Features: React.FC = () => {
    return (
        <section id="features" className={styles.features}>
            <div className={styles.statsWrapperCenter}>
                <Reveal direction="down" width="100%" className={styles.revealCenter} allowOverflow={true}>
                    <CommunityStats />
                </Reveal>
            </div>

            <div className={`container ${styles.container}`}>
                <div className={styles.header}>
                    <Reveal width="100%">
                        <h2 className={styles.title}>Tout faire avec Yondly</h2>
                    </Reveal>
                    <Reveal delay={0.4} width="100%">
                        <p className={styles.subtitle}>
                            Une seule application pour donner, vendre, louer et s'inspirer. Simplifiez votre quotidien tout en agissant pour la planète.
                        </p>
                    </Reveal>
                </div>

                <div className={styles.grid}>
                    <Reveal delay={0.2} direction="left" width="100%" fullHeight>
                        <FeatureCard
                            imageSrc="/assets/feature_antigaspi.png"
                            title="Anti-Gaspillage & CO₂"
                            description="Sauvez des paniers. Chaque don calcule votre impact CO₂ évité grâce à notre IA."
                        />
                    </Reveal>

                    <Reveal delay={0.3} direction="left" width="100%" fullHeight>
                        <FeatureCard
                            imageSrc="/assets/feature_sale.png"
                            title="Achat & Vente"
                            description="Videz vos placards. Transactions sécurisées via Stripe et remise en main propre."
                        />
                    </Reveal>

                    <Reveal delay={0.4} direction="right" width="100%" fullHeight>
                        <FeatureCard
                            imageSrc="/assets/feature_rent.png"
                            title="Location entre voisins"
                            description="Louez une perceuse ou une raclette. Pourquoi acheter quand on peut louer ?"
                            badge="ÉCONOMIE"
                        />
                    </Reveal>

                    <Reveal delay={0.5} direction="right" width="100%" fullHeight>
                        <FeatureCard
                            imageSrc="/assets/feature_antigaspi.png"
                            title="Pages Inspirations"
                            description="Découvrez les pépites dénichées par nos experts 'Arbre' et partagez vos listes."
                            badge="NOUVEAU ✨"
                        />
                    </Reveal>
                </div>
            </div>
        </section>
    );
};
