import React from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  Users,
  Shield,
  Leaf,
  Check,
  ChevronRight,
  AlertCircle,
  Apple,
  Utensils,
  Package,
  Croissant,
  Camera,
  MessageCircle,
  HandHeart,
  Sparkles,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import WaitlistForm from '../components/shared/WaitlistForm';
import SEO from '../components/shared/SEO';

const FoodDonation = () => {
  const howItWorks = [
    {
      step: '1',
      title: 'Tu as un surplus ?',
      description:
        'Fruits du jardin, plats cuisinés en trop, épicerie avant péremption...',
      icon: Package,
      emoji: '📦',
    },
    {
      step: '2',
      title: 'Publie-le sur Yondly',
      description:
        'Photo, description, et indique quand tu es disponible pour la remise.',
      icon: Camera,
      emoji: '📸',
    },
    {
      step: '3',
      title: 'Un voisin te contacte',
      description:
        "Vous échangez via la messagerie et vous retrouvez dans le quartier.",
      icon: MessageCircle,
      emoji: '💬',
    },
    {
      step: '4',
      title: 'Le don se fait',
      description:
        "Simple, humain, sans jugement. Et tu contribues à moins de gaspillage.",
      icon: HandHeart,
      emoji: '🤝',
    },
  ];

  const foodTypes = [
    {
      image: '/assets/food_fruits_legumes.png',
      title: 'Fruits & légumes',
      description: 'Du jardin ou du marché, trop mûrs ou en surplus',
    },
    {
      image: '/assets/food_epicerie.png',
      title: 'Épicerie',
      description: 'Produits secs avant date de péremption',
    },
    {
      image: '/assets/food_pain.png',
      title: 'Pain & viennoiseries',
      description: 'Du jour, à consommer rapidement',
    },
  ];

  const rules = [
    {
      image: '/assets/rule_respect.png',
      title: 'Respect & dignité',
      description:
        "On donne avec bienveillance. Pas de jugement, pas de questions déplacées.",
    },
    {
      image: '/assets/rule_security.png',
      title: 'Sécurité alimentaire',
      description:
        "Assure-toi que ce que tu donnes est consommable et stocké correctement.",
    },
    {
      image: '/assets/rule_communication.png',
      title: 'Communication claire',
      description:
        "Indique bien ce que tu donnes, les quantités et les dates limites si besoin.",
    },
    {
      image: '/assets/rule_impact.png',
      title: 'Impact positif',
      description:
        "Chaque don, même petit, contribue à réduire le gaspillage alimentaire.",
    },
  ];

  return (
    <div className="min-h-screen">
      <SEO
        title="Lutte contre le gaspillage alimentaire & Don gratuit | Yondly"
        description="Donnez vos surplus alimentaires à vos voisins ou associations. Luttez contre le gaspillage simplement et gratuitement avec Yondly."
        keywords="don alimentaire, anti-gaspi, nourriture, gratuit, associations, yondly"
        url="/don-alimentaire"
        schema={{
          "@context": "https://schema.org",
          "@type": "HowTo",
          "name": "Comment donner de la nourriture sur Yondly",
          "step": [
            { "@type": "HowToStep", "text": "Prenez une photo de vos surplus." },
            { "@type": "HowToStep", "text": "Publiez votre annonce gratuitement." },
            { "@type": "HowToStep", "text": "Un voisin vient récupérer le don." }
          ]
        }}
      />
      <Header />

      {/* Hero */}
      <section className="pt-28 pb-16 bg-gradient-to-br from-[rgba(76,123,75,0.15)] to-[rgba(31,84,33,0.08)] overflow-hidden">
        <div className="container-main">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in-up">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--accent-wash)] text-[var(--accent-strong)] text-sm font-medium mb-6 shadow-sm">
                <Heart className="w-4 h-4" />
                Solidarité locale
              </span>
              <h1 className="heading-1 mb-6">
                Le don alimentaire,<br />
                <span className="text-[var(--accent-strong)]">version voisinage.</span>
              </h1>
              <p className="body-large mb-8 text-[var(--text-secondary)]">
                Parfois, ce dont on a besoin n'est pas un objet. Yondly permet aussi de
                partager simplement : un panier de légumes, un plat cuisiné, des denrées
                avant péremption. <strong>L'entraide au quotidien, dans la dignité.</strong>
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/beta">
                  <Button className="btn-primary text-lg px-8 py-4 shadow-lg hover:shadow-xl transition-all">
                    Rejoindre la bêta
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="relative animate-fade-in-up animation-delay-200">
              {/* Main Card with Illustration */}
              <div className="relative z-10 bg-white rounded-3xl shadow-2xl overflow-hidden max-w-md mx-auto border border-[var(--border-light)]">
                <div className="aspect-square">
                  <img
                    src="/assets/partage_entraide_illustration.png"
                    alt="Voisins partageant un panier de légumes"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white/90 to-transparent p-6 text-center">
                  <h3 className="text-xl font-bold text-[var(--text-primary)] mb-1">Partage & Entraide</h3>
                  <p className="text-[var(--text-secondary)]">L'entraide entre voisins, simplement.</p>
                </div>
              </div>

              {/* Floating 3D Icons */}
              <div className="absolute -top-4 -right-4 w-20 h-20 z-20 rounded-2xl bg-white shadow-xl flex items-center justify-center rotate-6 animate-float">
                <span className="text-4xl">🥕</span>
              </div>
              <div className="absolute -bottom-6 -left-6 w-16 h-16 z-20 rounded-2xl bg-white shadow-xl flex items-center justify-center -rotate-6 animate-float" style={{ animationDelay: '0.5s' }}>
                <span className="text-3xl">🍎</span>
              </div>
              <div className="absolute top-1/3 -left-10 w-14 h-14 z-20 rounded-2xl bg-white shadow-xl flex items-center justify-center rotate-12 animate-float" style={{ animationDelay: '1s' }}>
                <span className="text-2xl">🥖</span>
              </div>

              {/* Decorative blobs */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-[rgba(76,123,75,0.2)] to-transparent rounded-full blur-3xl"></div>
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-gradient-to-br from-[rgba(76,123,75,0.15)] to-transparent rounded-full blur-2xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Antigaspi Stats Section */}
      <section className="py-20 bg-white">
        <div className="container-main">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Illustration */}
            <div className="relative order-2 lg:order-1">
              <div className="bg-gradient-to-br from-[rgba(76,123,75,0.1)] to-[rgba(76,123,75,0.05)] rounded-3xl p-8 md:p-12 flex items-center justify-center min-h-[350px]">
                <img
                  src="/assets/feature_antigaspi.png"
                  alt="Lutte contre le gaspillage alimentaire"
                  className="w-full h-auto max-w-sm object-contain mix-blend-multiply transition-transform duration-700 hover:scale-105 animate-float"
                />
              </div>
              {/* Stats badges */}
              <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-lg px-4 py-3 border border-green-100 animate-bounce-subtle">
                <div className="text-2xl font-bold text-[var(--accent-strong)]">4M</div>
                <div className="text-xs text-gray-500">tonnes/an</div>
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-lg px-4 py-3 border border-green-100 animate-bounce-subtle" style={{ animationDelay: '0.5s' }}>
                <div className="text-2xl font-bold text-[var(--accent-strong)]">-30%</div>
                <div className="text-xs text-gray-500">de gaspillage</div>
              </div>
            </div>

            {/* Content */}
            <div className="order-1 lg:order-2">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[rgba(76,123,75,0.15)] text-[var(--accent-strong)] text-sm font-semibold mb-6">
                <AlertCircle className="w-4 h-4" />
                Lutte Anti-gaspi
              </span>
              <h2 className="heading-2 mb-6">Pourquoi le don alimentaire ?</h2>
              <div className="space-y-6 text-[var(--text-body)]">
                <p className="body-large">
                  En France, on gaspille <strong className="text-[var(--text-primary)]">4 millions de tonnes</strong> de nourriture
                  chaque année. Dans le même temps, des millions de personnes peinent à se
                  nourrir correctement.
                </p>
                <p className="body-large">
                  Yondly n'est pas une plateforme de charité impersonnelle. C'est un outil
                  pour <strong className="text-[var(--text-primary)]">connecter des voisins</strong>. Celui qui a un surplus de tomates avec celle
                  qui sait en faire une super sauce. Le boulanger qui a des invendus avec la
                  famille à côté.
                </p>
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-[var(--accent-wash)] border border-[var(--accent-primary)]/20">
                  <Sparkles className="w-8 h-8 text-[var(--accent-strong)]" />
                  <p className="font-semibold text-[var(--accent-strong)]">
                    Simple, humain, local. C'est ça l'esprit Yondly.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Food Types Section */}
      <section className="py-20 section-bg">
        <div className="container-main">
          <div className="text-center mb-12">
            <h2 className="heading-2 mb-4">Qu'est-ce qu'on peut donner ?</h2>
            <p className="body-large max-w-2xl mx-auto">
              Tout ce qui est encore bon à manger et que tu ne peux pas consommer.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {foodTypes.map((type, index) => (
              <Card
                key={type.title}
                className="card-hover border-[var(--border-light)] bg-white group overflow-hidden"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-8 text-center">
                  <div className="w-40 h-40 mx-auto mb-6 rounded-3xl bg-[var(--surface-soft)] flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform duration-300 shadow-sm">
                    <img
                      src={type.image}
                      alt={type.title}
                      className="w-36 h-36 object-contain"
                    />
                  </div>
                  <h3 className="font-semibold text-lg text-[var(--text-primary)] mb-2">
                    {type.title}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {type.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="container-main">
          <div className="text-center mb-12">
            <h2 className="heading-2 mb-4">Comment ça fonctionne ?</h2>
            <p className="body-large max-w-2xl mx-auto">
              Donner n'a jamais été aussi simple. En 4 étapes, ton surplus trouve preneur.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto relative">
            {/* Connection line */}
            <div className="hidden md:block absolute top-16 left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-[var(--accent-primary)] via-[var(--accent-strong)] to-[var(--accent-primary)]"></div>

            {howItWorks.map((step, index) => {
              const StepIcon = step.icon;
              return (
                <div key={step.step} className="relative">
                  <Card className="card-hover border-[var(--border-light)] bg-white h-full overflow-hidden group">
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-strong)] text-white text-2xl font-bold flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300 relative z-10">
                        <span className="text-3xl">{step.emoji}</span>
                      </div>
                      <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[var(--accent-wash)] flex items-center justify-center text-sm font-bold text-[var(--accent-strong)]">
                        {step.step}
                      </div>
                      <h3 className="font-semibold text-[var(--text-primary)] mb-2">
                        {step.title}
                      </h3>
                      <p className="text-sm text-[var(--text-secondary)]">
                        {step.description}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Rules & Guidelines */}
      <section className="py-20 section-bg">
        <div className="container-main">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--accent-wash)] text-[var(--accent-strong)] text-sm font-medium mb-4">
              <Shield className="w-4 h-4" />
              Bonnes pratiques
            </span>
            <h2 className="heading-2 mb-4">Les règles du don</h2>
            <p className="body-large max-w-2xl mx-auto">
              Pour que le don alimentaire reste une expérience positive pour tous.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {rules.map((rule, index) => (
              <Card
                key={rule.title}
                className="card-hover border-[var(--border-light)] bg-white group overflow-hidden"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6">
                  <div className="w-28 h-28 mx-auto mb-4 rounded-2xl bg-[var(--surface-soft)] flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform duration-300">
                    <img
                      src={rule.image}
                      alt={rule.title}
                      className="w-24 h-24 object-contain"
                    />
                  </div>
                  <h3 className="font-semibold text-[var(--text-primary)] mb-2 text-center">
                    {rule.title}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] text-center">
                    {rule.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-[rgba(76,123,75,0.15)] to-[rgba(31,84,33,0.1)]">
        <div className="container-main">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-3 mb-6">
              <span className="text-5xl animate-bounce-subtle">🥕</span>
              <span className="text-4xl animate-bounce-subtle" style={{ animationDelay: '0.2s' }}>🍎</span>
              <span className="text-5xl animate-bounce-subtle" style={{ animationDelay: '0.4s' }}>🥖</span>
            </div>
            <h2 className="heading-2 mb-4">Envie de partager ?</h2>
            <p className="body-large mb-8">
              Rejoins la bêta et commence à donner (ou recevoir) dans ton quartier.
              <br />
              <strong>Ensemble, réduisons le gaspillage alimentaire.</strong>
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

export default FoodDonation;
