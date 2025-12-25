import React, { useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const PrivacyPolicy: React.FC = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <>
            <Navbar />
            <main style={{ paddingTop: '100px', minHeight: '60vh', background: 'var(--color-bg)' }}>
                <div className="container" style={{ maxWidth: '800px', margin: '0 auto', color: 'var(--color-text-main)' }}>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>Politique de Confidentialité</h1>

                    <section style={{ marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>1. Collecte des données</h2>
                        <p>Yondly collecte les données nécessaires au bon fonctionnement du service (création de compte, gamification, localisation pour les échanges).</p>
                    </section>

                    <section style={{ marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>2. Utilisation des données</h2>
                        <p>Vos données sont utilisées pour :</p>
                        <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
                            <li>Gérer votre compte et vos transactions.</li>
                            <li>Calculer votre impact CO₂ (Gamification).</li>
                            <li>Améliorer nos services.</li>
                        </ul>
                    </section>

                    <section style={{ marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>3. Partage</h2>
                        <p>Nous ne vendons pas vos données personnelles. Elles peuvent être partagées avec des tiers de confiance (ex: Stripe pour les paiements) uniquement dans le cadre de l'exécution du service.</p>
                    </section>
                </div>
            </main>
            <Footer />
        </>
    );
};
