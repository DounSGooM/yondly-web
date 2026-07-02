import React, { useState } from 'react';
import axios from 'axios';
import {
  Store,
  Users,
  Smartphone,
  TrendingUp,
  Check,
  ChevronRight,
  Loader2,
  Building,
  Briefcase,
  Heart,
  Sprout,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { cities } from '../data/mock';
import SEO from '../components/shared/SEO';

const API = '/mail.php';

const Pros = () => {
  const [formData, setFormData] = useState({
    name: '',
    business: '',
    city: '',
    email: '',
    phone: '',
    message: '',
    rgpdConsent: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Benefits with illustrations
  const benefits = [
    {
      image: '/assets/pro_visibility.png',
      title: 'Visibilité locale',
      description: 'Fais-toi connaître des habitants de ton quartier et de ta ville.',
    },
    {
      image: '/assets/pro_clients.png',
      title: 'Nouveaux clients',
      description: 'Attire une communauté engagée qui préfère acheter local.',
    },
    {
      image: '/assets/pro_management.png',
      title: 'Gestion simple',
      description: 'Une interface intuitive pour gérer tes annonces et tes ventes.',
    },
    {
      image: '/assets/pro_zerowaste.png',
      title: 'Zéro stock perdu',
      description: 'Écoule tes invendus et valorise tes surplus via des dons ou offres.',
    },
  ];

  // Use cases with colors
  const useCases = [
    {
      icon: Store,
      emoji: '🏪',
      title: 'Commerçants',
      description: 'Épiceries, boulangeries, fromageries...',
      features: ['Écouler les invendus', 'Promotions locales', 'Visibilité quartier'],
      color: 'bg-green-100 text-green-700',
      borderColor: 'group-hover:border-green-300',
      iconBg: 'bg-green-100 text-green-700',
    },
    {
      icon: Briefcase,
      emoji: '🔧',
      title: 'Artisans',
      description: 'Créations locales et artisanat',
      features: ['Louer du matériel', 'Vendre des créations', 'Trouver des clients'],
      color: 'bg-orange-100 text-orange-700',
      borderColor: 'group-hover:border-orange-300',
      iconBg: 'bg-orange-100 text-orange-700',
    },
    {
      icon: Sprout,
      emoji: '🥕',
      title: 'Producteurs',
      description: 'Maraîchers, fermes urbaines, initiatives locales...',
      features: ['Écouler les surplus', 'Réduire les pertes', 'Valoriser les invendus'],
      color: 'bg-blue-100 text-blue-700',
      borderColor: 'group-hover:border-blue-300',
      iconBg: 'bg-blue-100 text-blue-700',
    },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.name || !formData.business) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (!formData.rgpdConsent) {
      setError('Veuillez accepter la politique de confidentialité');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await axios.post(API, {
        type: 'partner',
        name: formData.name,
        business: formData.business,
        city: formData.city || null,
        email: formData.email,
        phone: formData.phone || null,
        message: formData.message || null,
        rgpd_consent: formData.rgpdConsent,
      });
      if (!res.data?.success) {
        setError(res.data?.message || 'Une erreur est survenue. Réessayez.');
        return;
      }
      setIsSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Une erreur est survenue. Réessayez.');
    } finally {
      setIsSubmitting(false);
    }
  };



  return (
    <div className="min-h-screen">
      <SEO
        title="Boostez votre commerce local & réduisez le gaspillage | Yondly Pro"
        description="Espace Pro Yondly : Vendez vos invendus, louez votre matériel et touchez une clientèle locale engagée. Inscription gratuite pour commerçants et artisans."
        keywords="pro, commerçants, artisans, invendus, anti-gaspi, visibilité locale, yondly"
        url="/pros"
        image="/assets/pro_hero_flat.png"
        schema={{
          "@context": "https://schema.org",
          "@type": "Service",
          "serviceType": "Plateforme locale pour professionnels",
          "provider": {
            "@type": "Organization",
            "name": "Yondly"
          },
          "areaServed": "France",
          "description": "Solution pour écouler les invendus et gagner en visibilité locale."
        }}
      />
      <Header />

      {/* Hero with Illustration */}
      {/* Hero with Illustration */}
      <section className="pt-32 pb-24 relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-green-50/50 min-h-[85vh] flex items-center">
        {/* Animated Background Shapes */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[500px] h-[500px] bg-[var(--accent-primary)] opacity-5 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[400px] h-[400px] bg-blue-200 opacity-20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>

        <div className="container-main relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Content */}
            <div className="text-center lg:text-left">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--accent-wash)] text-[var(--accent-strong)] text-sm font-semibold mb-8 border border-[var(--accent-primary)]/20 shadow-sm animate-fade-in">
                <Store className="w-4 h-4" />
                Espace Pro
              </span>
              <h1 className="heading-1 mb-6 text-[var(--text-primary)] leading-tight">
                Boostez votre activité <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-strong)]">locale et circulaire</span>
              </h1>
              <p className="body-large mb-10 max-w-lg mx-auto lg:mx-0 text-[var(--text-secondary)] text-lg leading-relaxed">
                Rejoignez le réseau Yondly. Vendez vos invendus, louez votre matériel et touchez une nouvelle clientèle engagée dans votre quartier.
              </p>

              {/* Quick Stats */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-8 mb-10">
                <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-full bg-[var(--accent-wash)] flex items-center justify-center text-[var(--accent-primary)]">
                    <Building className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-gray-900 text-lg">100+</div>
                    <div className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-medium">Commerces</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-full bg-[var(--accent-wash)] flex items-center justify-center text-[var(--accent-primary)]">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-gray-900 text-lg">10 K+</div>
                    <div className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-medium">Utilisateurs</div>
                  </div>
                </div>
              </div>

              <a href="#devenir-partenaire">
                <Button className="bg-[var(--accent-strong)] text-white hover:bg-[var(--accent-dark)] font-bold text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  Devenir partenaire gratuitement
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </a>
            </div>

            {/* Hero Illustration */}
            <div className="relative hidden lg:flex justify-center perspective-1000">
              <div className="relative transform rotate-y-12 hover:rotate-0 transition-transform duration-700 ease-out">
                <div className="relative z-10 bg-white p-4 rounded-[32px] shadow-2xl border-4 border-white/50">
                  <img
                    src="/assets/pro_hero_flat.png"
                    alt="Commerce local Yondly"
                    className="w-full h-auto max-w-md object-contain rounded-2xl p-4"
                  />
                  {/* Overlay gradient not needed for light mode */}
                </div>

                {/* Floating Elements */}
                <div className="absolute -top-10 -right-10 bg-white rounded-2xl shadow-xl p-5 border border-gray-100 animate-float z-20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">+30%</div>
                      <div className="text-xs text-gray-500 font-medium">de chiffre d'affaires</div>
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-8 -left-8 bg-white rounded-2xl shadow-xl p-5 border border-gray-100 animate-float animation-delay-2000 z-20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                      <Heart className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">4.9/5</div>
                      <div className="text-xs text-gray-500 font-medium">Satisfaction client</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits with Illustrations */}
      <section className="py-24 bg-gray-50/50 relative overflow-hidden">
        <div className="container-main">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white text-[var(--accent-primary)] text-sm font-semibold mb-6 border border-[var(--accent-primary)]/20 shadow-sm">
              ✨ Avantages
            </span>
            <h2 className="heading-2 mb-6">Pourquoi rejoindre Yondly ?</h2>
            <p className="body-large max-w-2xl mx-auto text-[var(--text-secondary)]">
              Des outils simples et puissants conçus spécifiquement pour les acteurs de l'économie locale.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <Card
                key={benefit.title}
                className="group border-0 bg-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 rounded-[2rem] overflow-hidden relative"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-strong)] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <CardContent className="p-8 text-center h-full flex flex-col items-center relative z-10">
                  <div className="w-24 h-24 mb-6 rounded-3xl bg-gradient-to-br from-[var(--accent-wash)] to-white flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm border border-[var(--accent-primary)]/10">
                    <img
                      src={benefit.image}
                      alt={benefit.title}
                      className="w-16 h-16 object-contain drop-shadow-sm"
                    />
                  </div>
                  <h3 className="font-bold text-xl text-[var(--accent-strong)] mb-3">
                    {benefit.title}
                  </h3>
                  <p className="text-[var(--text-secondary)] leading-relaxed text-sm">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-24 bg-white">
        <div className="container-main">
          <div className="text-center mb-20">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold mb-6 border border-blue-100 shadow-sm">
              🎯 Cible
            </span>
            <h2 className="heading-2 mb-6">Yondly est fait pour vous</h2>
            <p className="body-large max-w-2xl mx-auto text-[var(--text-secondary)]">
              Une solution modulable qui s'adapte à votre métier pour développer votre activité locale.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {useCases.map((useCase, index) => (
              <Card
                key={useCase.title}
                className="border border-gray-100 bg-white shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden group rounded-[2rem] hover:-translate-y-2"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <CardContent className="p-0 h-full flex flex-col">
                  {/* Colored Header */}
                  <div className={`p-8 ${useCase.color.split(' ')[0]} bg-opacity-30 relative overflow-hidden`}>
                    {/* Decorative circle */}
                    <div className={`absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white opacity-20`}></div>

                    <div className={`w-20 h-20 rounded-2xl bg-white shadow-lg flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition-transform duration-300 relative z-10`}>
                      {useCase.emoji}
                    </div>
                    <h3 className="font-bold text-2xl mb-2 text-gray-900 relative z-10">
                      {useCase.title}
                    </h3>
                    <p className="text-sm text-gray-700 font-medium relative z-10">
                      {useCase.description}
                    </p>
                  </div>

                  {/* Content */}
                  <div className="p-8 flex-grow">
                    <ul className="space-y-5">
                      {useCase.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-4 text-[var(--text-secondary)] group/item">
                          <div className={`w-6 h-6 rounded-full ${useCase.color} bg-opacity-20 flex items-center justify-center flex-shrink-0`}>
                            <Check className={`w-3.5 h-3.5 ${useCase.color.split(' ')[1]}`} />
                          </div>
                          <span className="font-medium group-hover/item:text-gray-900 transition-colors">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Form */}
      <section id="devenir-partenaire" className="py-24 relative">
        {/* Decorative background */}
        <div className="absolute inset-0 bg-gradient-to-t from-green-50/50 to-white -z-10"></div>

        <div className="container-main">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-10">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-800 text-sm font-semibold mb-4 border border-green-200">
                📝 Inscription
              </span>
              <h2 className="heading-2 mb-4">Devenir partenaire</h2>
              <p className="body-large text-[var(--text-secondary)]">
                Remplissez le formulaire et nous vous recontacterons sous 48h.
              </p>
            </div>

            {isSubmitted ? (
              <Card className="border-green-200 bg-green-50/50 shadow-xl overflow-hidden relative">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-green-300 rounded-full opacity-20 filter blur-xl"></div>

                <CardContent className="p-12 text-center relative z-10">
                  <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-200">
                    <Check className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="heading-3 mb-3 text-green-900">Demande envoyée ! 🎉</h3>
                  <p className="text-green-700 text-lg">
                    Merci pour votre intérêt. Notre équipe vous recontactera très vite.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 bg-white/80 backdrop-blur-xl shadow-2xl relative overflow-hidden rounded-3xl ring-1 ring-black/5">
                {/* Accent Line */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-strong)]"></div>

                <CardContent className="p-8 md:p-10">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-base font-medium">Nom *</Label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          className="h-14 rounded-xl text-base bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                          placeholder="Votre nom"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="business" className="text-base font-medium">Activité *</Label>
                        <Input
                          id="business"
                          name="business"
                          placeholder="Ex: Boulangerie, Plombier..."
                          value={formData.business}
                          onChange={handleChange}
                          className="h-14 rounded-xl text-base bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-base font-medium">Ville</Label>
                      <Select
                        value={formData.city}
                        onValueChange={(value) =>
                          setFormData((prev) => ({ ...prev, city: value }))
                        }
                      >
                        <SelectTrigger className="h-14 rounded-xl text-base bg-gray-50 border-gray-200 focus:bg-white transition-colors">
                          <SelectValue placeholder="Sélectionnez votre ville" />
                        </SelectTrigger>
                        <SelectContent>
                          {cities.map((city) => (
                            <SelectItem key={city} value={city}>
                              {city}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-base font-medium">Email *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          className="h-14 rounded-xl text-base bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                          placeholder="vous@exemple.com"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-base font-medium">Téléphone</Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleChange}
                          className="h-14 rounded-xl text-base bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                          placeholder="06 XX XX XX XX"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-base font-medium">Message</Label>
                      <textarea
                        id="message"
                        name="message"
                        rows={4}
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Parlez-nous de votre activité..."
                        className="w-full rounded-xl px-4 py-4 border border-gray-200 bg-gray-50 focus:bg-white focus:border-[var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 resize-none text-base transition-all"
                      />
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-green-50/50 rounded-xl border border-green-100">
                      <Checkbox
                        id="rgpdConsent"
                        checked={formData.rgpdConsent}
                        onCheckedChange={(checked) =>
                          setFormData((prev) => ({ ...prev, rgpdConsent: checked }))
                        }
                        className="mt-0.5 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                      />
                      <Label
                        htmlFor="rgpdConsent"
                        className="text-sm text-gray-600 cursor-pointer leading-relaxed"
                      >
                        J'accepte d'être contacté par Yondly et j'ai lu la{' '}
                        <a
                          href="/confidentialite"
                          className="underline hover:text-green-700 font-medium transition-colors"
                        >
                          politique de confidentialité
                        </a>{' '}
                        *
                      </Label>
                    </div>

                    {error && (
                      <div className="text-red-600 text-sm bg-red-50 p-4 rounded-xl border border-red-200 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-16 text-lg bg-[var(--accent-strong)] hover:bg-[var(--accent-dark)] shadow-lg shadow-green-200 transition-all duration-300 transform hover:scale-[1.01]"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          Envoi en cours...
                        </>
                      ) : (
                        <>
                          Envoyer ma demande
                          <ChevronRight className="w-5 h-5 ml-2" />
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Pros;
