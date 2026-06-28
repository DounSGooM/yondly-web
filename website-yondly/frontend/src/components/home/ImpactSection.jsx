import React from 'react';
import { Leaf, MapPin, Heart, ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';

const ImpactSection = () => {
    return (
        <section className="py-24 relative overflow-hidden bg-gradient-to-br from-green-50 via-green-50/30 to-white">
            {/* Decorative Background Elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-green-200/20 rounded-full blur-3xl -mr-40 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-100/30 rounded-full blur-3xl -ml-20 -mb-20"></div>

            <div className="container-main relative z-10">
                <div className="grid lg:grid-cols-2 gap-12 items-center">

                    {/* Text Content */}
                    <div className="text-center lg:text-left order-2 lg:order-1">
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-[var(--accent-strong)] text-sm font-semibold mb-6 border border-[var(--accent-primary)]/20">
                            <Leaf className="w-4 h-4" />
                            Impact Positif
                        </span>

                        <h2 className="heading-2 mb-6">
                            Petit geste, <br />
                            <span className="text-[var(--accent-strong)]">
                                grand impact sur la planète.
                            </span>
                        </h2>

                        <p className="body-large text-[var(--text-secondary)] mb-8 max-w-lg mx-auto lg:mx-0">
                            Yondly n'est pas qu'une application de vente. C'est un mouvement pour réduire le gaspillage, consommer mieux et recréer du lien au coeur des quartiers.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
                            <div className="bg-white p-4 rounded-2xl shadow-sm border border-green-100">
                                <div className="text-3xl font-bold text-[var(--accent-strong)] mb-1">~15kg</div>
                                <div className="text-sm text-gray-600 font-medium">CO₂ évités/objet</div>
                            </div>
                            <div className="bg-white p-4 rounded-2xl shadow-sm border border-green-100">
                                <div className="text-3xl font-bold text-[var(--accent-strong)] mb-1">&lt; 2km</div>
                                <div className="text-sm text-gray-600 font-medium">Distance moyenne</div>
                            </div>
                            <div className="bg-white p-4 rounded-2xl shadow-sm border border-green-100">
                                <div className="text-3xl font-bold text-[var(--accent-strong)] mb-1">100%</div>
                                <div className="text-sm text-gray-600 font-medium">Local & Humain</div>
                            </div>
                        </div>

                        <div className="flex justify-center lg:justify-start">
                            <a href="/beta">
                                <Button className="rounded-full px-8 py-6 text-lg bg-[var(--accent-strong)] hover:opacity-90 text-white shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all">
                                    Rejoindre le mouvement
                                    <ArrowRight className="ml-2 w-5 h-5" />
                                </Button>
                            </a>
                        </div>
                    </div>

                    {/* Illustration */}
                    <div className="order-1 lg:order-2 flex justify-center lg:justify-end relative">
                        <div className="relative z-10 animate-float">
                            <img
                                src="/assets/rule_impact.png"
                                alt="Impact Écologique Yondly"
                                className="w-full max-w-lg object-contain drop-shadow-2xl"
                            />
                        </div>
                        {/* Circle behind image */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-emerald-100/50 rounded-full blur-xl -z-10"></div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ImpactSection;
