import React from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Leaf, MapPin, ShieldCheck, Building2, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { collectivitesContent } from '../../data/mock';

const iconMap = { BarChart3, Leaf, MapPin, ShieldCheck };

const CollectivitesSection = () => {
    return (
        <section className="py-20 md:py-28 section-bg">
            <div className="container-main">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                    {/* Content */}
                    <div>
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-wash)] text-[var(--accent-strong)] text-sm font-semibold mb-4">
                            <Building2 className="w-4 h-4" />
                            {collectivitesContent.badge}
                        </span>
                        <h2 className="heading-2 mb-5">{collectivitesContent.title}</h2>
                        <p className="body-large mb-8 text-[var(--text-secondary)]">
                            {collectivitesContent.description}
                        </p>
                        <Link to="/contact">
                            <Button className="btn-primary">
                                Demander une démo
                                <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </Link>
                    </div>

                    {/* Feature grid */}
                    <div className="grid sm:grid-cols-2 gap-5">
                        {collectivitesContent.features.map((f, idx) => {
                            const Icon = iconMap[f.icon] || BarChart3;
                            return (
                                <div
                                    key={idx}
                                    className="bg-white rounded-2xl p-5 border border-[var(--border-light)]"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-[var(--accent-wash)] flex items-center justify-center mb-3">
                                        <Icon className="w-5 h-5 text-[var(--accent-strong)]" />
                                    </div>
                                    <h4 className="font-semibold text-[var(--text-primary)] mb-1">{f.title}</h4>
                                    <p className="text-sm text-[var(--text-secondary)]">{f.description}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CollectivitesSection;
