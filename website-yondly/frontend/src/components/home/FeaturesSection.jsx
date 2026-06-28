import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Calendar, Gift, Check, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { featuresData } from '../../data/mock';
import {
    PiggyBank,
    Package,
    Heart,
    Leaf,
    Star,
    Trophy,
    Crown,
    TrendingDown,
    MapPin,
    Store,
    Repeat,
    Hand,
} from 'lucide-react';

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
    Repeat,
    Hand,
};

const imageMap = {
    vendre: '/assets/feature_sell.png',
    louer: '/assets/feature_rent.png',
    donner: '/assets/feature_donate.png',
};

const FeaturesSection = () => {
    return (
        <section className="py-20 md:py-28">
            <div className="container-main">
                <div className="text-center mb-12">
                    <h2 className="heading-2 mb-4">Ce que tu peux faire sur Yondly</h2>
                    <p className="body-large max-w-2xl mx-auto">
                        Vendre, louer, donner, échanger ou rendre service — tout est possible près de chez toi.
                    </p>
                </div>

                <Tabs defaultValue="vendre" className="max-w-4xl mx-auto">
                    <TabsList className="flex flex-wrap justify-center gap-1 mb-8 h-auto p-1 bg-[var(--bg-section)] rounded-full mx-auto w-fit">
                        {Object.entries(featuresData).map(([key, feature]) => {
                            const TabIcon = iconMap[feature.icon];
                            return (
                                <TabsTrigger
                                    key={key}
                                    value={key}
                                    className="rounded-full py-2.5 px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                                >
                                    {TabIcon && <TabIcon className="w-4 h-4 mr-2" />}
                                    {feature.title}
                                </TabsTrigger>
                            );
                        })}
                    </TabsList>

                    {Object.entries(featuresData).map(([key, feature]) => {
                        const IconComponent = iconMap[feature.icon];
                        const imageUrl = imageMap[key];

                        return (
                            <TabsContent key={key} value={key} className="animate-fade-in-up">
                                <Card className="border-[var(--border-light)] overflow-hidden">
                                    <CardContent className="p-0">
                                        <div className="grid md:grid-cols-2">
                                            <div className="p-8 flex flex-col justify-center">
                                                <div className="w-16 h-16 rounded-2xl bg-[var(--accent-wash)] flex items-center justify-center flex-shrink-0 mb-6">
                                                    <IconComponent className="w-8 h-8 text-[var(--accent-strong)]" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="heading-3 mb-2">{feature.title}</h3>
                                                    <p className="text-[var(--text-secondary)] mb-4">
                                                        {feature.description}
                                                    </p>
                                                    <ul className="space-y-2 mb-4">
                                                        {feature.bullets.map((bullet, idx) => (
                                                            <li
                                                                key={idx}
                                                                className="flex items-center gap-2 text-[var(--text-body)]"
                                                            >
                                                                <Check className="w-4 h-4 text-[var(--accent-strong)]" />
                                                                {bullet}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                    <div className="flex flex-wrap gap-2">
                                                        <span className="text-sm text-[var(--text-muted)]">
                                                            Exemples :
                                                        </span>
                                                        {feature.examples.map((example, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="text-sm px-3 py-1 rounded-full bg-[var(--bg-section)] text-[var(--text-body)]"
                                                            >
                                                                {example}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="bg-[var(--bg-section)] flex items-center justify-center p-8 min-h-[300px]">
                                                {imageUrl ? (
                                                    <img
                                                        src={imageUrl}
                                                        alt={feature.title}
                                                        className="w-full h-auto max-w-xs object-contain mix-blend-multiply"
                                                    />
                                                ) : (
                                                    <div className="w-32 h-32 rounded-3xl bg-[var(--accent-wash)] flex items-center justify-center">
                                                        <IconComponent className="w-16 h-16 text-[var(--accent-strong)]" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        );
                    })}
                </Tabs>

                <div className="text-center mt-8">
                    <Link to="/fonctionnalites">
                        <Button variant="outline" className="btn-secondary">
                            Voir toutes les fonctionnalités
                            <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default FeaturesSection;
