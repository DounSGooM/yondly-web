import React from 'react';
import { Heart, Check, Leaf } from 'lucide-react';
import WaitlistForm from '../shared/WaitlistForm';

const HeroSection = () => {
    return (
        <section className="hero-gradient min-h-screen flex items-center pt-24 pb-16">
            <div className="container-main w-full">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div className="text-center lg:text-left">
                        <h1 className="heading-1 mb-6 animate-fade-in-up">
                            Acheter, vendre, donner et louer{' '}
                            <span className="text-[var(--accent-strong)]">près de chez toi</span>.
                        </h1>
                        <p className="body-large mb-8 animate-fade-in-up animation-delay-100">
                            Yondly connecte les voisins (et les pros locaux) pour faire circuler les
                            objets et s'entraider, simplement.
                        </p>

                        {/* Trust Badges */}
                        <div className="flex flex-wrap justify-center lg:justify-start gap-3 mb-8 animate-fade-in-up animation-delay-200">
                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-[var(--border-light)] text-sm font-medium text-[var(--text-body)]">
                                <Heart className="w-4 h-4 text-[var(--accent-strong)]" />
                                Local & humain
                            </span>
                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-[var(--border-light)] text-sm font-medium text-[var(--text-body)]">
                                <Check className="w-4 h-4 text-[var(--accent-strong)]" />
                                Paiements sécurisés
                            </span>
                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-[var(--border-light)] text-sm font-medium text-[var(--text-body)]">
                                <Leaf className="w-4 h-4 text-[var(--accent-strong)]" />
                                Impact positif
                            </span>
                        </div>

                        {/* Waitlist Form */}
                        <div className="flex justify-center lg:justify-start mb-4 animate-fade-in-up animation-delay-300">
                            <WaitlistForm compact />
                        </div>

                        <p className="text-sm text-[var(--text-muted)] animate-fade-in-up animation-delay-300">
                            Bêta sur iOS et Android • Quelques villes en priorité • Inscription gratuite
                        </p>
                    </div>

                    {/* Hero Image */}
                    <div className="hidden lg:block relative animate-fade-in-up animation-delay-200">
                        <img
                            src="/assets/hero_illustration.png"
                            alt="Voisins échangeant des objets"
                            className="w-full h-auto max-w-lg mx-auto animate-float"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;
