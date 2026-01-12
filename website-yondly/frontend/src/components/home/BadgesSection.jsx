import React from 'react';
import { Card, CardContent } from '../ui/card';
import { badges } from '../../data/mock';

const BadgesSection = () => {
    return (
        <section className="py-20 md:py-28 section-bg">
            <div className="container-main">
                <div className="text-center mb-12">
                    <h2 className="heading-2 mb-4">Gagne en visibilité & confiance</h2>
                    <p className="body-large max-w-2xl mx-auto">
                        Plus tu aides et échanges, plus tu gagnes en réputation dans ta communauté.
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-4xl mx-auto">
                    {badges.map((badge) => {
                        return (
                            <Card
                                key={badge.id}
                                className="card-hover border-[var(--border-light)] bg-white"
                            >
                                <CardContent className="p-6 text-center">
                                    <div
                                        className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 bg-transparent`}
                                    >
                                        <img
                                            src={badge.image}
                                            alt={badge.name}
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                    <h4 className="font-semibold text-[var(--text-primary)] mb-1">
                                        {badge.name}
                                    </h4>
                                    <p className="text-xs text-[var(--text-muted)]">
                                        {badge.description}
                                    </p>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default BadgesSection;
