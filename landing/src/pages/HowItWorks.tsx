import React, { useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Reveal } from '../components/Reveal';
import { AppShowcase } from '../sections/AppShowcase';
import styles from './HowItWorks.module.css';

const features = [
    {
        pill: "DONNER",
        type: "give",
        title: "Offrez une seconde vie aux aliments",
        image: "/assets/real_give.png",
        steps: [
            { icon: "📷", title: "Prendre une photo", desc: "Ouvrez l'app et capturez vos surplus alimentaires ou objets." },
            { icon: "📝", title: "Ajouter une description", desc: "Précisez la quantité et la date limite. La transparence crée la confiance." },
            { icon: "🤝", title: "Connecter & Donner", desc: "Un voisin réserve. Convenez d'un moment pour l'échange.", final: true }
        ]
    },
    {
        pill: "VENDRE",
        type: "sell",
        title: "Vendez vos objets inutilisés",
        image: "/assets/real_sell.png",
        steps: [
            { icon: "📱", title: "Photographier l'objet", desc: "Mettez en valeur ce que vous ne portez plus ou n'utilisez plus." },
            { icon: "🏷️", title: "Fixer un prix juste", desc: "Encouragez l'économie circulaire locale avec des prix attractifs." },
            { icon: "💶", title: "Rencontrer l'acheteur", desc: "Remise en main propre. Moins d'envois, moins de carbone.", final: true }
        ]
    },
    {
        pill: "LOUER",
        type: "rent",
        title: "Louez du matériel entre voisins",
        image: "/assets/real_rent.png",
        steps: [
            { icon: "🔍", title: "Proposer ou Chercher", desc: "Une perceuse, une tondeuse ? Louez au lieu d'acheter." },
            { icon: "📅", title: "Définir la durée", desc: "Choisissez vos dates via le calendrier intégré et validez." },
            { icon: "↩️", title: "Profiter & Rendre", desc: "Récupérez le matériel, faites vos travaux et rapportez-le.", final: true }
        ]
    },
    {
        pill: "GAGNER",
        type: "win",
        title: "Vos bonnes actions récompensées",
        image: "/assets/real_win.png",
        steps: [
            { icon: "🌱", title: "Agir pour la communauté", desc: "Chaque don, vente ou location calcule votre impact CO₂." },
            { icon: "🏅", title: "Grimper les échelons", desc: "Passez de Novice à Ambassadeur en accumulant du CO₂ évité." },
            { icon: "💎", title: "Avantages Exclusifs", desc: "Débloquez des réductions de frais de service.", final: true }
        ]
    }
];

export const HowItWorks: React.FC = () => {
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
                            Simple, Local et <br />
                            <span>Impactant.</span>
                        </h1>
                    </Reveal>
                    <Reveal delay={0.2}>
                        <p className={styles.subtitle}>
                            Yondly s'adapte à tous vos besoins. Que vous souhaitiez donner, vendre, louer ou simplement agir pour la planète.
                        </p>
                    </Reveal>
                </section>

                <div className={styles.stepsContainer}>
                    {features.map((feature, idx) => (
                        <Reveal key={idx} delay={idx * 0.1} fullHeight>
                            <div className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <span className={`${styles.pill} ${styles[feature.type]}`}>{feature.pill}</span>
                                    <img src={feature.image} alt={feature.title} className={styles.cardImage} />
                                </div>
                                <h3 className={styles.cardTitle}>{feature.title}</h3>

                                <div className={styles.flowSteps}>
                                    {feature.steps.map((step, sIdx) => (
                                        <div key={sIdx} className={styles.flowStep}>
                                            <div className={`${styles.stepIcon} ${step.final ? styles.final : ''}`}>
                                                {step.icon}
                                            </div>
                                            <div className={styles.stepInfo}>
                                                <div className={styles.stepTitle}>{step.title}</div>
                                                <div className={styles.stepDesc}>{step.desc}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </main>
            <AppShowcase />
            <Footer />
        </>
    );
};
