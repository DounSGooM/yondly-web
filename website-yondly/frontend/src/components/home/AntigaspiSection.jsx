import React from 'react';
import { Leaf } from 'lucide-react';
import { antigaspiContent } from '../../data/mock';
import {
    PiggyBank,
    Package,
    Heart,
    ShoppingBag,
    Calendar,
    Gift,
    Star,
    Trophy,
    Crown,
    TrendingDown,
    MapPin,
    Store,
} from 'lucide-react';

const iconMap = {
    PiggyBank,
    Package,
    Heart,
    ShoppingBag,
    Calendar,
    Gift,
    Leaf,
    Star,
    Trophy,
    Crown,
    TrendingDown,
    MapPin,
    Store,
};

const AntigaspiSection = () => {
    return (
        <section className="py-20 md:py-28">
            <div className="container-main">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Image (Left on Desktop) */}
                    <div className="order-last lg:order-first relative">
                        <div className="bg-[var(--accent-wash)] rounded-3xl p-8 flex items-center justify-center min-h-[300px]">
                            <img
                                src="/assets/feature_antigaspi.png"
                                alt="Panier antigaspi rempli de produits frais"
                                className="w-full h-auto max-w-sm object-contain mix-blend-multiply hover:scale-105 transition-transform duration-500"
                            />
                        </div>
                        {/* Label Overlay */}
                        <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-[var(--border-light)] z-10">
                            <span className="text-sm font-bold text-[var(--accent-strong)] uppercase tracking-wide">
                                Bientôt disponible
                            </span>
                        </div>
                    </div>

                    {/* Content (Right on Desktop) */}
                    <div>
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-sm font-medium mb-4">
                            <Leaf className="w-4 h-4" />
                            {antigaspiContent.badge}
                        </span>
                        <h2 className="heading-2 mb-5 whitespace-pre-line">
                            {antigaspiContent.title}
                        </h2>
                        <p className="body-large mb-6">
                            {antigaspiContent.description}
                        </p>

                        <ul className="space-y-4 mb-8">
                            {antigaspiContent.features.map((feature, idx) => {
                                const Icon = iconMap[feature.icon];
                                return (
                                    <li key={idx} className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-full bg-[var(--bg-section)] flex items-center justify-center flex-shrink-0">
                                            <Icon className="w-5 h-5 text-[var(--accent-strong)]" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-[var(--text-primary)]">{feature.title}</h4>
                                            <p className="text-sm text-[var(--text-secondary)]">{feature.description}</p>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>

                        <div className="p-4 rounded-xl bg-[var(--bg-section)] border border-[var(--border-light)]">
                            <p className="text-sm text-[var(--text-muted)] italic text-center">
                                "{antigaspiContent.footerQuote}"
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AntigaspiSection;
