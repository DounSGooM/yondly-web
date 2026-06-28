import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Check, Leaf, Sparkles, ArrowRight } from 'lucide-react';
import WaitlistForm from '../shared/WaitlistForm';

const HeroSection = () => {
    return (
        <section className="hero-gradient relative min-h-screen flex items-center pt-24 pb-16 overflow-hidden">
            {/* Decorative blobs */}
            <div className="blob-glow top-[-6rem] right-[-4rem] w-[28rem] h-[28rem] bg-[rgba(143,236,120,0.18)]" />
            <div className="blob-glow bottom-[-8rem] left-[-6rem] w-[24rem] h-[24rem] bg-[rgba(76,123,75,0.12)]" />

            <div className="container-main w-full relative z-10">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div className="text-center lg:text-left">
                        {/* Announcement pill */}
                        <Link
                            to="/fonctionnalites"
                            className="announce-pill mb-6 animate-fade-in-up"
                        >
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-strong)] text-white text-xs font-semibold">
                                <Sparkles className="w-3 h-3" />
                                Nouveau
                            </span>
                            <span>Yondly Scan — l'IA estime tes objets en une photo</span>
                            <ArrowRight className="w-4 h-4 text-[var(--accent-strong)]" />
                        </Link>

                        <h1 className="heading-1 mb-6 animate-fade-in-up">
                            Donne une seconde vie à tout,{' '}
                            <span className="text-gradient-accent">près de chez toi</span>.
                        </h1>
                        <p className="body-large mb-8 animate-fade-in-up animation-delay-100">
                            Vends, loue, donne, échange ou rends service entre voisins et
                            commerçants locaux. Simple, sécurisé et anti-gaspi.
                        </p>

                        {/* Trust Badges */}
                        <div className="flex flex-wrap justify-center lg:justify-start gap-3 mb-8 animate-fade-in-up animation-delay-200">
                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-[var(--border-light)] text-sm font-medium text-[var(--text-body)]">
                                <Heart className="w-4 h-4 text-[var(--accent-strong)]" />
                                100% local
                            </span>
                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-[var(--border-light)] text-sm font-medium text-[var(--text-body)]">
                                <Check className="w-4 h-4 text-[var(--accent-strong)]" />
                                Paiements sécurisés
                            </span>
                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-[var(--border-light)] text-sm font-medium text-[var(--text-body)]">
                                <Leaf className="w-4 h-4 text-[var(--accent-strong)]" />
                                Anti-gaspi & circulaire
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
                            className="w-full h-auto max-w-lg mx-auto animate-float relative z-10"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;
