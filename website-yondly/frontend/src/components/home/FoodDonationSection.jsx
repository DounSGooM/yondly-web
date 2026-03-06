import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { Button } from '../ui/button';

const FoodDonationSection = () => {
    return (
        <section className="py-20 md:py-28 bg-gradient-to-br from-[rgba(76,123,75,0.08)] to-[rgba(31,84,33,0.05)] overflow-hidden">
            <div className="container-main">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div>
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-wash)] text-[var(--accent-strong)] text-sm font-medium mb-4">
                            <Heart className="w-4 h-4" />
                            Solidarité locale
                        </span>
                        <h2 className="heading-2 mb-6">
                            Le don alimentaire,<br />version voisinage.
                        </h2>
                        <p className="body-large mb-8">
                            Parfois, ce dont on a besoin n'est pas un objet. Yondly
                            permet aussi de partager simplement : un panier de
                            légumes, un plat cuisiné, des denrées avant péremption.
                            L'entraide au quotidien, dans la dignité.
                        </p>

                        <div className="flex flex-wrap gap-4">
                            <Link to="/beta">
                                <Button className="btn-primary">
                                    Rejoindre la bêta
                                </Button>
                            </Link>
                        </div>
                    </div>

                    <div className="relative flex justify-center lg:justify-end py-10">
                        {/* Card Main */}
                        <div className="relative z-10 bg-white rounded-3xl p-6 shadow-xl border border-[var(--border-light)] text-center max-w-sm w-full mx-auto animate-fade-in-up overflow-hidden">
                            <div className="w-full aspect-square rounded-2xl overflow-hidden mb-4">
                                <img
                                    src="/assets/partage_entraide_illustration.png"
                                    alt="Voisins partageant un panier de légumes"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <h3 className="heading-3 mb-2">Partage & Entraide</h3>
                            <p className="text-[var(--text-secondary)]">L'entraide entre voisins, simplement.</p>
                        </div>

                        {/* Floating 3D Icons */}
                        <div className="absolute top-0 right-10 lg:right-0 animate-float animation-delay-100 z-20">
                            <div className="w-20 h-20 bg-white rounded-2xl shadow-lg p-3 flex items-center justify-center transform rotate-12">
                                <img src="/assets/icon_carrot_3d.png" alt="Carrot" className="w-full h-full object-contain" />
                            </div>
                        </div>

                        <div className="absolute bottom-10 left-0 lg:left-10 animate-float animation-delay-300 z-20">
                            <div className="w-16 h-16 bg-white rounded-2xl shadow-lg p-2.5 flex items-center justify-center transform -rotate-6">
                                <img src="/assets/icon_apple_3d.png" alt="Apple" className="w-full h-full object-contain" />
                            </div>
                        </div>

                        <div className="absolute top-1/2 -translate-y-1/2 -left-4 lg:-left-8 animate-float animation-delay-200 z-0">
                            <div className="w-14 h-14 bg-white rounded-2xl shadow-lg p-2 flex items-center justify-center transform -rotate-12">
                                <img src="/assets/icon_baguette_3d.png" alt="Baguette" className="w-full h-full object-contain" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FoodDonationSection;
