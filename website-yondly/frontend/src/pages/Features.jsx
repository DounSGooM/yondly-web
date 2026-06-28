import React from 'react';
import {
  ShoppingBag,
  Calendar,
  Gift,
  Camera,
  MessageCircle,
  CreditCard,
  MapPin,
  Clock,
  Shield,
  Heart,
  Leaf,
  PiggyBank,
  Repeat,
  Hand,
  Sparkles,
  Recycle,
  Gauge,
  Store,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import WaitlistForm from '../components/shared/WaitlistForm';

const Features = () => {
  const detailedFeatures = [
    {
      key: 'scan',
      icon: Camera,
      color: 'from-[var(--accent-primary)] to-[var(--accent-strong)]',
      title: 'Yondly Scan',
      subtitle: 'La magie de l\'IA',
      description:
        "Photographie ton objet : l'IA l'identifie, estime son prix de revente et son impact carbone, puis te recommande la meilleure orientation. Chaque objet reçoit un Circular Score de 0 à 100. Ta fiche d'annonce est pré-remplie en quelques secondes.",
      image: '/assets/feature_sell.png',
      features: [
        {
          icon: Camera,
          title: 'Une simple photo',
          description: "L'IA reconnaît l'objet et son état.",
        },
        {
          icon: Sparkles,
          title: 'Fiche auto-générée',
          description: 'Catégorie, prix, description — pré-remplis.',
        },
        {
          icon: Gauge,
          title: 'Circular Score',
          description: 'Un score de circularité de 0 à 100 par objet.',
        },
        {
          icon: Recycle,
          title: 'Bonne orientation',
          description: 'Revente, don, réparation ou recyclage.',
        },
      ],
      examples: ['Mobilier', 'Électronique', 'Vêtements', 'Jouets', 'Électroménager'],
    },
    {
      key: 'vendre',
      icon: ShoppingBag,
      color: 'from-[var(--accent-primary)] to-[var(--accent-strong)]',
      title: 'Vendre',
      subtitle: 'Donne une seconde vie à tes objets',
      description:
        "Mets en vente rapidement et trouve des acheteurs dans ton quartier. Paiement sécurisé obligatoire via l'app.",
      image: '/assets/feature_sell.png',
      features: [
        {
          icon: Camera,
          title: 'Publication rapide',
          description: "Photos + description en moins d'une minute.",
        },
        {
          icon: MessageCircle,
          title: 'Chat intégré',
          description: "Négocie et organise l'échange directement dans l'app.",
        },
        {
          icon: CreditCard,
          title: 'Paiement sécurisé',
          description: 'Stripe Connect protège acheteurs et vendeurs.',
        },
        {
          icon: MapPin,
          title: 'Remise locale',
          description: "RDV dans le quartier pour l'échange.",
        },
      ],
      examples: ['Vélo', 'Poussette', 'Console de jeux', 'Meubles', 'Vêtements'],
    },
    {
      key: 'louer',
      icon: Calendar,
      color: 'from-[#60A5FA] to-[#3B82F6]',
      title: 'Louer',
      subtitle: 'Pourquoi acheter quand on peut louer ?',
      description:
        "Loue tes objets que tu n'utilises pas souvent, ou trouve ce dont tu as besoin temporairement près de chez toi.",
      image: '/assets/feature_rent.png',
      features: [
        {
          icon: Clock,
          title: 'Calendrier de disponibilité',
          description: 'Gère facilement quand tes objets sont louables.',
        },
        {
          icon: Shield,
          title: 'Caution sécurisée',
          description: 'Bientôt disponible pour te protéger.',
        },
        {
          icon: CreditCard,
          title: 'Paiement obligatoire',
          description: "Tout passe par l'app, pas de cash.",
        },
        {
          icon: MessageCircle,
          title: 'Organisation simple',
          description: 'Chat pour coordonner la remise et le retour.',
        },
      ],
      examples: ['Perceuse', 'Tondeuse', 'Appareil photo', 'Remorque', 'Tente'],
    },
    {
      key: 'donner',
      icon: Gift,
      color: 'from-[#F472B6] to-[#EC4899]',
      title: 'Donner',
      subtitle: 'Le geste qui fait du bien',
      description:
        'Donne ce dont tu ne te sers plus. Objets, vêtements, nourriture — aide tes voisins et fais de la place chez toi.',
      image: '/assets/feature_donate.png',
      features: [
        {
          icon: Heart,
          title: 'Don gratuit',
          description: 'Aucun frais, juste de la générosité.',
        },
        {
          icon: MessageCircle,
          title: 'Tu choisis',
          description: 'Premier arrivé ou tu sélectionnes le bénéficiaire.',
        },
        {
          icon: Shield,
          title: 'Respect & dignité',
          description: "Pas de jugement, juste de l'entraide.",
        },
        {
          icon: MapPin,
          title: 'Local',
          description: 'Évite le gaspillage, donne près de chez toi.',
        },
      ],
      examples: [
        'Jouets',
        'Vêtements enfants',
        'Livres',
        'Meubles',
        'Électroménager',
      ],
    },
    {
      key: 'echange',
      icon: Repeat,
      color: 'from-[#A78BFA] to-[#7C3AED]',
      title: 'Échanger',
      subtitle: 'Le troc nouvelle génération',
      description:
        "Troque tes objets contre d'autres, sans sortir un centime. Idéal pour les objets de valeur équivalente entre voisins.",
      image: '/assets/feature_donate.png',
      features: [
        {
          icon: Repeat,
          title: 'Proposer un échange',
          description: 'En un geste, depuis n\'importe quelle annonce.',
        },
        {
          icon: MessageCircle,
          title: 'Négociation simple',
          description: 'Mettez-vous d\'accord via le chat intégré.',
        },
        {
          icon: Shield,
          title: 'Entre voisins',
          description: 'Rencontres locales, en confiance.',
        },
        {
          icon: MapPin,
          title: 'Remise locale',
          description: 'RDV près de chez toi pour échanger.',
        },
      ],
      examples: ['Jeux vidéo', 'Livres', 'Vêtements', 'Plantes', 'Vinyles'],
    },
    {
      key: 'services',
      icon: Hand,
      color: 'from-[#22D3EE] to-[#0891B2]',
      title: 'Rendre service',
      subtitle: 'Le coup de main entre voisins',
      description:
        "Propose un service — gratuit ou rémunéré — ou trouve de l'aide près de chez toi : jardinage, cours de musique, bricolage, garde d'animaux… L'entraide qui renforce le quartier.",
      image: '/assets/partage_entraide_illustration.png',
      features: [
        {
          icon: Hand,
          title: 'Mille et un services',
          description: 'Bricolage, jardinage, cours, garde…',
        },
        {
          icon: MessageCircle,
          title: 'Contact direct',
          description: 'Échange avec tes voisins en un clic.',
        },
        {
          icon: Heart,
          title: 'Lien social',
          description: 'On se rend service, on se reconnecte.',
        },
        {
          icon: MapPin,
          title: 'Hyperlocal',
          description: 'Des voisins à quelques rues de toi.',
        },
      ],
      examples: ['Jardinage', 'Cours de guitare', 'Bricolage', 'Garde d\'animaux', 'Déménagement'],
    },
    {
      key: 'antigaspi',
      icon: Leaf,
      color: 'from-orange-400 to-orange-600',
      title: 'Anti-gaspi',
      subtitle: 'Qualité garantie',
      description:
        "Récupère des paniers d'invendus chez tes commerçants locaux à prix réduits, avec une transparence totale sur le contenu et une qualité garantie.",
      image: '/assets/feature_antigaspi.png',
      features: [
        {
          icon: ShoppingBag,
          title: 'Contenu transparent',
          description: 'Tu sais ce que contient le panier avant de réserver.',
        },
        {
          icon: Store,
          title: 'Commerçants fiables',
          description: 'Un badge "% de paniers conformes" basé sur les avis réels.',
        },
        {
          icon: PiggyBank,
          title: 'Prix mini',
          description: "Jusqu'à -70% sur de bons produits du jour.",
        },
        {
          icon: Heart,
          title: 'Remboursé si non conforme',
          description: 'Panier décevant ? Crédit Yondly automatique.',
        },
      ],
      examples: ['Fruits & Légumes', 'Boulangerie', 'Traiteur', 'Épicerie'],
    },
  ];

  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-20 hero-gradient">
        <div className="container-main">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="heading-1 mb-6 animate-fade-in-up">Fonctionnalités</h1>
            <p className="body-large animate-fade-in-up animation-delay-100">
              Découvre tout ce que tu peux faire avec Yondly : vendre, louer, donner ou
              sauver des paniers, toujours près de chez toi.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      {detailedFeatures.map((feature, index) => {
        const FeatureIcon = feature.icon;
        const isReversed = index % 2 === 1;

        return (
          <section
            key={feature.key}
            className={`py-20 md:py-28 ${index % 2 === 0 ? 'bg-white' : 'section-bg'
              }`}
          >
            <div className="container-main">
              <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                {/* Image Section */}
                <div
                  className={`relative ${isReversed ? 'lg:order-last' : 'lg:order-first'
                    }`}
                >
                  <div className="bg-[var(--accent-wash)] rounded-3xl p-8 md:p-12 flex items-center justify-center min-h-[300px] md:min-h-[400px]">
                    <img
                      src={feature.image}
                      alt={feature.title}
                      className="w-full h-auto max-w-sm object-contain mix-blend-multiply transition-transform duration-700 hover:scale-105 animate-float"
                    />
                  </div>
                </div>

                {/* Content Section */}
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-md`}
                    >
                      <FeatureIcon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-lg font-bold text-[var(--accent-strong)] uppercase tracking-wide opacity-80">
                      {feature.subtitle}
                    </span>
                  </div>

                  <h2 className="heading-2 mb-6">{feature.title}</h2>
                  <p className="body-large mb-8 text-[var(--text-secondary)]">
                    {feature.description}
                  </p>

                  {/* Feature Grid */}
                  <div className="grid sm:grid-cols-2 gap-6 mb-8">
                    {feature.features.map((f) => {
                      const FIcon = f.icon;
                      return (
                        <Card
                          key={f.title}
                          className="border-[var(--border-light)] bg-white/50 hover:bg-white transition-colors duration-300"
                        >
                          <CardContent className="p-5">
                            <div className="w-10 h-10 rounded-xl bg-[var(--accent-wash)] flex items-center justify-center mb-3">
                              <FIcon className="w-5 h-5 text-[var(--accent-strong)]" />
                            </div>
                            <h4 className="font-semibold text-[var(--text-primary)] mb-1">
                              {f.title}
                            </h4>
                            <p className="text-sm text-[var(--text-secondary)]">
                              {f.description}
                            </p>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Examples */}
                  {feature.examples && (
                    <div className="pt-6 border-t border-[var(--border-light)]">
                      <p className="text-sm font-medium text-[var(--text-muted)] mb-3 uppercase tracking-wider">
                        Exemples populaires :
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {feature.examples.map((example) => (
                          <span
                            key={example}
                            className="px-3 py-1.5 rounded-full bg-[var(--bg-page)] border border-[var(--border-light)] text-sm text-[var(--text-body)] font-medium"
                          >
                            {example}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        );
      })}

      {/* CTA Section */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-[rgba(76,123,75,0.1)] to-[rgba(31,84,33,0.08)]">
        <div className="container-main">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="heading-2 mb-4">Prêt à commencer ?</h2>
            <p className="body-large mb-8">
              Rejoins la bêta et découvre toutes ces fonctionnalités en avant-première.
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

export default Features;
