import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '../ui/accordion';
import { faqShort } from '../../data/mock';

const FaqSection = () => {
    return (
        <section className="py-20 md:py-28 section-bg">
            <div className="container-main">
                <div className="text-center mb-12">
                    <h2 className="heading-2 mb-4">Questions fréquentes</h2>
                    <p className="body-large max-w-2xl mx-auto">
                        Les réponses aux questions que tu te poses.
                    </p>
                </div>

                <div className="max-w-2xl mx-auto">
                    <Accordion type="single" collapsible className="space-y-3">
                        {faqShort.map((item) => (
                            <AccordionItem
                                key={item.id}
                                value={`item-${item.id}`}
                                className="bg-white rounded-xl border border-[var(--border-light)] px-6 overflow-hidden"
                            >
                                <AccordionTrigger className="text-left font-medium text-[var(--text-primary)] hover:no-underline py-5">
                                    {item.question}
                                </AccordionTrigger>
                                <AccordionContent className="text-[var(--text-secondary)] pb-5">
                                    {item.answer}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>

                <div className="text-center mt-8">
                    <Link to="/faq">
                        <Button variant="outline" className="btn-secondary">
                            Voir toutes les questions
                            <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default FaqSection;
