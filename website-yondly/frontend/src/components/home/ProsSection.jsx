import React from 'react';
import { Link } from 'react-router-dom';
import { Store, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

const ProsSection = () => {
    return (
        <section className="py-20 md:py-28 section-bg">
            <div className="container-main">
                <div className="text-center mb-12">
                    <h2 className="heading-2 mb-4">Pour les pros</h2>
                    <p className="body-large max-w-2xl mx-auto">
                        Yondly est aussi ouvert aux professionnels locaux.
                    </p>
                </div>

                <div className="max-w-md mx-auto">
                    <Card className="card-hover border-[var(--border-light)] bg-white overflow-hidden">
                        <CardContent className="p-8">
                            <div className="w-14 h-14 rounded-2xl bg-[var(--accent-wash)] flex items-center justify-center mb-5">
                                <Store className="w-7 h-7 text-[var(--accent-strong)]" />
                            </div>
                            <h3 className="heading-3 mb-3">Pros : vendez/louez localement</h3>
                            <p className="text-[var(--text-secondary)] mb-6">
                                Touche les habitants de ton quartier. Gère tes annonces simplement et
                                développe ta clientèle locale.
                            </p>
                            <Link to="/pros">
                                <Button variant="outline" className="btn-secondary">
                                    Devenir partenaire Pro
                                    <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
    );
};

export default ProsSection;
