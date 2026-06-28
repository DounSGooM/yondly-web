import React from 'react';
import { Camera, Sparkles, Gauge, Check } from 'lucide-react';
import { yondlyScanContent } from '../../data/mock';

const iconMap = { Camera, Sparkles, Gauge, Check };

const YondlyScanSection = () => {
    return (
        <section className="py-20 md:py-28 bg-gradient-to-br from-[rgba(76,123,75,0.08)] to-[rgba(31,84,33,0.05)]">
            <div className="container-main">
                <div className="max-w-2xl mx-auto text-center mb-12">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-wash)] text-[var(--accent-strong)] text-sm font-semibold mb-4">
                        <Sparkles className="w-4 h-4" />
                        {yondlyScanContent.badge}
                    </span>
                    <h2 className="heading-2 mb-4">{yondlyScanContent.title}</h2>
                    <p className="body-large">{yondlyScanContent.description}</p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
                    {yondlyScanContent.steps.map((step, idx) => {
                        const Icon = iconMap[step.icon] || Sparkles;
                        return (
                            <div
                                key={idx}
                                className="relative bg-white rounded-2xl p-6 border border-[var(--border-light)] text-center"
                            >
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-[var(--accent-strong)] text-white text-sm font-bold flex items-center justify-center">
                                    {idx + 1}
                                </div>
                                <div className="w-14 h-14 mx-auto rounded-2xl bg-[var(--accent-wash)] flex items-center justify-center mb-4 mt-2">
                                    <Icon className="w-7 h-7 text-[var(--accent-strong)]" />
                                </div>
                                <h3 className="font-semibold text-[var(--text-primary)] mb-1">{step.title}</h3>
                                <p className="text-sm text-[var(--text-secondary)]">{step.description}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default YondlyScanSection;
