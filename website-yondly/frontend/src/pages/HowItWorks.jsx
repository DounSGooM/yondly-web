import React from 'react';
import { Link } from 'react-router-dom';
import {
  Camera,
  MessageCircle,
  CreditCard,
  MapPin,
  Store,
  Users,
  Heart,
  ChevronRight,
  Check,
  ArrowRight,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import WaitlistForm from '../components/shared/WaitlistForm';

const HowItWorks = () => {
  const parcours = [
    {
      title: 'Parcours Particulier',
      description: 'Vends, donne ou loue tes objets en quelques clics.',
      icon: Users,
      steps: [
        {
          icon: Camera,
          title: 'Publie ton annonce',
          description: 'Prends quelques photos, ajoute un titre et un prix. 30 secondes chrono !',
        },
        {
          icon: MessageCircle,
          title: 'Discute avec les intéressés',
          description: 'Les voisins te contactent via la messagerie intégrée.',
        },
        {
          icon: CreditCard,
          title: 'Paiement sécurisé',
          description: "Pour les ventes et locations, le paiement passe par l'app.",
        },
        {
          icon: MapPin,
          title: 'Remise en main propre',
          description: "Vous vous retrouvez dans le quartier pour l'échange.",
        },
      ],
    },
    {
      title: 'Parcours Pro',
      description: 'Vends ou loue en local et touche de nouveaux clients.',
      icon: Store,
      steps: [
        {
          icon: Store,
          title: 'Crée ton profil Pro',
          description: 'Présente ton activité et ta zone de couverture.',
        },
        {
          icon: Camera,
          title: 'Publie tes offres',
          description: 'Produits, services, locations — tout est possible.',
        },
        {
          icon: Users,
          title: 'Touche le quartier',
          description: 'Les habitants autour de toi découvrent tes annonces.',
        },
        {
          icon: CreditCard,
          title: 'Gère simplement',
          description: 'Paiements sécurisés, suivi des commandes, tout en un.',
        },
      ],
    },
    {
      title: 'Parcours Don / Solidarité',
      description: 'Donne des objets ou de la nourriture à tes voisins.',
      icon: Heart,
      steps: [
        {
          icon: Camera,
          title: 'Publie ton don',
          description: 'Objets, vêtements, nourriture — tout ce qui peut servir.',
        },
        {
          icon: Users,
          title: 'Quelqu\'un te contacte',
          description: 'Un voisin intéressé t\'écrit via la messagerie.',
        },
        {
          icon: MapPin,
          title: 'Remise simple',
          description: 'Vous vous retrouvez pour le don. Pas de paiement.',
        },
        {
          icon: Heart,
          title: 'Impact positif',
          description: 'Tu fais plaisir et tu gagnes en réputation !',
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero */}
      <section className="pt-28 pb-16 hero-gradient">
        <div className="container-main">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="heading-1 mb-6">Comment ça marche ?</h1>
            <p className="body-large">
              Yondly est conçu pour être simple. Que tu sois particulier ou professionnel,
              voici comment ça fonctionne.
            </p>
          </div>
        </div>
      </section>

      {/* Parcours */}
      {parcours.map((p, pIndex) => {
        const ParcoursIcon = p.icon;
        const isEven = pIndex % 2 === 0;

        // Map icons to images
        let illustration = '/assets/how_it_works_particulier.png';
        if (pIndex === 1) illustration = '/assets/how_it_works_pro.png';
        if (pIndex === 2) illustration = '/assets/how_it_works_donation.png';

        return (
          <section
            key={p.title}
            className={`py-20 md:py-32 overflow-hidden ${pIndex % 2 === 1 ? 'bg-white' : 'section-bg'}`}
          >
            <div className="container-main">
              <div className={`flex flex-col lg:flex-row gap-16 items-center ${!isEven ? 'lg:flex-row-reverse' : ''}`}>

                {/* Text & Steps Side */}
                <div className="flex-1 w-full animate-fade-in-up">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-[var(--accent-wash)] flex items-center justify-center shadow-sm">
                      <ParcoursIcon className="w-7 h-7 text-[var(--accent-strong)]" />
                    </div>
                    <div>
                      <h2 className="heading-2 text-2xl md:text-3xl">{p.title}</h2>
                      <p className="text-[var(--text-secondary)]">{p.description}</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {p.steps.map((step, sIndex) => {
                      const StepIcon = step.icon;
                      return (
                        <Card
                          key={step.title}
                          className="card-hover border-[var(--border-light)] bg-white/80 backdrop-blur-sm transition-all duration-300 hover:border-[var(--accent-primary)] group"
                        >
                          <CardContent className="p-5 flex gap-5 items-start">
                            <div className="w-10 h-10 rounded-full bg-[var(--bg-section)] flex items-center justify-center flex-shrink-0 group-hover:bg-[var(--accent-primary)] transition-colors duration-300">
                              <span className="font-bold text-[var(--accent-strong)] group-hover:text-white transition-colors">{sIndex + 1}</span>
                            </div>
                            <div>
                              <h3 className="font-semibold text-[var(--text-primary)] mb-1 flex items-center gap-2">
                                {step.title}
                              </h3>
                              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                                {step.description}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>

                {/* Illustration Side */}
                <div className="flex-1 w-full relative perspective-1000 animate-fade-in-up animation-delay-200">
                  <div className="relative z-10 p-8">
                    <img
                      src={illustration}
                      alt={p.title}
                      className="w-full h-auto max-w-md mx-auto object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-700 ease-out animate-float"
                    />
                  </div>

                  {/* Decorative Elements */}
                  <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-br from-[var(--accent-primary)]/5 to-transparent rounded-full blur-3xl -z-10`} />
                </div>

              </div>
            </div>
          </section>
        );
      })}

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-[rgba(76,123,75,0.1)] to-[rgba(31,84,33,0.08)]">
        <div className="container-main">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="heading-2 mb-4">Prêt à essayer ?</h2>
            <p className="body-large mb-8">
              Rejoins la bêta et sois parmi les premiers à utiliser Yondly.
            </p>
            <div className="flex justify-center">
              <WaitlistForm compact />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HowItWorks;
