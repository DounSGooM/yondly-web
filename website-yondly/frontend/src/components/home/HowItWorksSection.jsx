import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { howItWorksSteps } from '../../data/mock';

const HowItWorksSection = () => {
    return (
        <section className="py-20 md:py-28 section-bg">
            <div className="container-main">
                <div className="text-center mb-12">
                    <h2 className="heading-2 mb-4">Comment ça marche ?</h2>
                    <p className="body-large max-w-2xl mx-auto">
                        3 étapes pour commencer à échanger.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto relative pt-8">

                    {/* Dashed Connection Line */}
                    <div className="hidden md:block absolute top-[160px] left-[15%] right-[15%] h-0.5 border-t-2 border-dashed border-gray-200 -z-10" />

                    {howItWorksSteps.map((step, index) => {
                        const images = [
                            "/assets/how_it_works_particulier.png",
                            "/assets/pro_clients.png",
                            "/assets/how_it_works_donation.png"
                        ];

                        return (
                            <div key={step.id} className="relative group">
                                <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-lg shadow-gray-100/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 h-full text-center group flex flex-col items-center">

                                    {/* Illustration area */}
                                    <div className="h-40 flex items-center justify-center mb-6">
                                        <img
                                            src={images[index]}
                                            alt={step.title}
                                            className="h-full w-auto object-contain drop-shadow-sm group-hover:scale-110 transition-transform duration-300"
                                        />
                                    </div>

                                    <div className="w-12 h-12 mx-auto rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center mb-4 relative z-10">
                                        <span className={`text-lg font-bold bg-clip-text text-transparent bg-gradient-to-br 
                                            ${index === 0 ? 'from-[var(--accent-primary)] to-[var(--accent-strong)]' :
                                                index === 1 ? 'from-blue-500 to-indigo-600' :
                                                    'from-orange-500 to-amber-600'}`}>
                                            {step.step}
                                        </span>
                                    </div>

                                    <h3 className="heading-3 mb-3">{step.title}</h3>
                                    <p className="text-[var(--text-secondary)] leading-relaxed">
                                        {step.description}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="text-center mt-12">
                    <Link to="/comment-ca-marche">
                        <Button variant="outline" className="btn-secondary">
                            En savoir plus
                            <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default HowItWorksSection;
