import React from 'react';
import { Card, CardContent } from '../ui/card';
import {
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
} from 'lucide-react';
import { whyYondlyCards } from '../../data/mock';

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

const WhyYondlySection = () => {
    return (
        <section className="py-20 md:py-28">
            <div className="container-main">
                <div className="text-center mb-12">
                    <h2 className="heading-2 mb-4">Une seule app, mille façons de mieux consommer</h2>
                    <p className="body-large max-w-2xl mx-auto">
                        Économise, désencombre et tisse du lien dans ton quartier — sans surconsommer.
                    </p>
                </div>

                <div className="grid md:grid-cols-12 gap-6">
                    {/* Card 1: Économiser - Spans 7 cols */}
                    <Card className="md:col-span-7 bg-gradient-to-br from-[var(--accent-wash)] to-white border-[var(--accent-primary)]/20 overflow-hidden group relative transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                        <CardContent className="p-8 h-full flex flex-col md:flex-row items-center gap-8 relative z-10">
                            <div className="flex-1 space-y-4">
                                <div className="w-16 h-16 rounded-2xl bg-white text-[var(--accent-primary)] flex items-center justify-center shadow-sm border border-[var(--accent-primary)]/10 group-hover:scale-110 transition-transform duration-300">
                                    <PiggyBank className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="heading-3 mb-3 text-[var(--accent-strong)]">Économiser</h3>
                                    <p className="text-[var(--text-secondary)] text-lg leading-relaxed">
                                        Achète d'occasion ou loue au lieu d'acheter neuf. Ton portefeuille te dira merci.
                                    </p>
                                </div>
                            </div>
                            <div className="md:w-1/2 flex justify-center">
                                <img
                                    src="/assets/feature_rent.png"
                                    alt="Économiser en louant"
                                    className="w-full max-w-[250px] object-contain drop-shadow-md transform group-hover:scale-105 transition-transform duration-500"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Card 2: Désencombrer - Spans 5 cols */}
                    <Card className="md:col-span-5 bg-gradient-to-br from-orange-50/50 to-white border-orange-100/50 overflow-hidden group relative transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                        <CardContent className="p-8 h-full flex flex-col justify-between relative z-10">
                            <div>
                                <div className="w-16 h-16 rounded-2xl bg-white text-orange-600 flex items-center justify-center mb-6 shadow-sm border border-orange-50 group-hover:scale-110 transition-transform duration-300">
                                    <Package className="w-8 h-8" />
                                </div>
                                <h3 className="heading-3 mb-3 text-orange-950">Désencombrer</h3>
                                <p className="text-gray-600 text-lg leading-relaxed mb-6">
                                    Vends ou donne ce qui t'encombre. Fais de la place, l'esprit léger.
                                </p>
                            </div>
                            <div className="flex justify-center mt-auto">
                                <img
                                    src="/assets/feature_donate_scene.png"
                                    alt="Donner ses objets"
                                    className="w-full max-w-[200px] object-contain drop-shadow-md transform group-hover:rotate-3 transition-transform duration-500"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Card 3: S'entraider - Spans full width (12 cols) */}
                    <Card className="md:col-span-12 bg-gradient-to-br from-blue-50/50 to-white border-blue-100/50 overflow-hidden group relative transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                        <CardContent className="p-10 flex flex-col md:flex-row items-center gap-12 relative z-10">
                            <div className="flex-1 max-w-2xl">
                                <div className="w-16 h-16 rounded-2xl bg-white text-blue-600 flex items-center justify-center shadow-sm border border-blue-50 group-hover:scale-110 transition-transform duration-300 mb-6">
                                    <Heart className="w-8 h-8" />
                                </div>
                                <h3 className="heading-3 text-blue-950 mb-4">S'entraider</h3>
                                <p className="text-gray-600 text-xl leading-relaxed">
                                    Donne, partage, connecte-toi avec tes voisins. C'est ça la vraie force du local : recréer du lien tout en se rendant service.
                                </p>
                            </div>
                            <div className="flex-1 flex justify-center md:justify-end">
                                <img
                                    src="/assets/partage_entraide_illustration.png"
                                    alt="Entraide entre voisins"
                                    className="w-full max-w-sm object-contain drop-shadow-xl transform group-hover:scale-105 transition-transform duration-500"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
    );
};

export default WhyYondlySection;
