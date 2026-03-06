import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Star } from 'lucide-react';
import { testimonials } from '../../data/mock';

const TestimonialsSection = () => {
    return (
        <section className="py-20 md:py-28">
            <div className="container-main">
                <div className="text-center mb-12">
                    <h2 className="heading-2 mb-4">Ils nous font confiance</h2>
                    <p className="body-large max-w-2xl mx-auto">
                        Des voisins comme toi qui ont déjà testé Yondly.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {testimonials.map((testimonial) => (
                        <Card
                            key={testimonial.id}
                            className="card-hover border-[var(--border-light)] bg-white"
                        >
                            <CardContent className="p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-strong)] flex items-center justify-center text-white font-semibold">
                                        {testimonial.avatar}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-[var(--text-primary)]">
                                            {testimonial.name}
                                        </p>
                                        <p className="text-sm text-[var(--text-muted)]">
                                            {testimonial.location}
                                        </p>
                                    </div>
                                </div>
                                <p className="text-[var(--text-body)] leading-relaxed">
                                    "{testimonial.content}"
                                </p>
                                <div className="flex gap-1 mt-4">
                                    {[...Array(testimonial.rating)].map((_, i) => (
                                        <Star
                                            key={i}
                                            className="w-4 h-4 fill-[#FBBF24] text-[#FBBF24]"
                                        />
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default TestimonialsSection;
