import React from 'react';
import { Hero } from '../sections/Hero';
import { Features } from '../sections/Features';
import { ClubYondly } from '../sections/ClubYondly';
import { AppShowcase } from '../sections/AppShowcase';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const Home: React.FC = () => {
    return (
        <>
            <Navbar />
            <main>
                <Hero />
                <Features />
                <ClubYondly />
                <AppShowcase />
            </main>
            <Footer />
        </>
    );
};
