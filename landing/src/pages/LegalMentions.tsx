import React, { useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const LegalMentions: React.FC = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <>
            <Navbar />
            <main style={{ paddingTop: '100px', minHeight: '60vh', background: 'var(--color-bg)' }}>
                <div className="container" style={{ maxWidth: '800px', margin: '0 auto', color: 'var(--color-text-main)' }}>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>Mentions Légales</h1>

                    <section style={{ marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>1. Éditeur du site</h2>
                        <p>Le site Yondly est édité par la société Yondly SAS.</p>
                        <p>Siège social : 123 Avenue de l'Innovation, 75000 Paris, France.</p>
                        <p>RCS Paris B 123 456 789</p>
                        <p>Directeur de la publication : Équipe Yondly</p>
                    </section>

                    <section style={{ marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>2. Hébergement</h2>
                        <p>Le site est hébergé par Vercel Inc., 340 S Lemon Ave #4133 Walnut, CA 91789, USA.</p>
                    </section>

                    <section style={{ marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>3. Propriété intellectuelle</h2>
                        <p>L'ensemble de ce site relève de la législation française et internationale sur le droit d'auteur et la propriété intellectuelle. Tous les droits de reproduction sont réservés.</p>
                    </section>
                </div>
            </main>
            <Footer />
        </>
    );
};
