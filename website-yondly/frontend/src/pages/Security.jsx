import React from 'react';
import { Link } from 'react-router-dom';
import {
  CreditCard,
  UserCheck,
  Shield,
  MessageCircle,
  MapPin,
  AlertTriangle,
  Lock,
  Eye,
  Check,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import WaitlistForm from '../components/shared/WaitlistForm';
import { securityFeatures } from '../data/mock';

const iconMap = {
  CreditCard,
  UserCheck,
  Shield,
  MessageCircle,
  MapPin,
  AlertTriangle,
};

const Security = () => {
  const handoffTips = [
    'Privilégie les lieux publics et passants (café, place, entrée de magasin)',
    'Préviens quelqu\'un de ton entourage du rendez-vous',
    'Évite les heures tardives ou les endroits isolés',
    'Vérifie l\'objet avant de confirmer la transaction',
    'En cas de doute, n\'hésite pas à annuler',
  ];

  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-20 relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-green-50/50">
        {/* Animated Background Shapes */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[500px] h-[500px] bg-[var(--accent-primary)] opacity-5 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[400px] h-[400px] bg-blue-200 opacity-20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>

        <div className="container-main relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--accent-wash)] text-[var(--accent-strong)] text-sm font-semibold mb-6 border border-[var(--accent-primary)]/20 shadow-sm animate-fade-in">
                <Shield className="w-4 h-4" />
                Confiance & Sérénité
              </span>
              <h1 className="heading-1 mb-6 text-[var(--text-primary)] leading-tight animate-fade-in-up">
                Ta sécurité est <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-strong)]">notre priorité absolue</span>
              </h1>
              <p className="body-large mb-8 text-[var(--text-secondary)] animate-fade-in-up animation-delay-100">
                Chez Yondly, chaque échange est protégé. Nous avons mis en place des outils puissants pour que tu puisses acheter, vendre et donner l'esprit tranquille.
              </p>

              <div className="flex flex-wrap justify-center lg:justify-start gap-4 animate-fade-in-up animation-delay-200">
                <Card className="px-6 py-4 bg-white/80 border-white shadow-sm flex items-center gap-3 rounded-2xl">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                    <Check className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-gray-900">Vérifié</div>
                    <div className="text-xs text-gray-500">Profils & Annonces</div>
                  </div>
                </Card>
                <Card className="px-6 py-4 bg-white/80 border-white shadow-sm flex items-center gap-3 rounded-2xl">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-gray-900">Sécurisé</div>
                    <div className="text-xs text-gray-500">Paiements Stripe</div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Hero Illustration */}
            <div className="relative hidden lg:flex justify-center animate-float">
              <img
                src="/assets/rule_security.png"
                alt="Sécurité Yondly"
                className="w-full h-auto max-w-lg object-contain drop-shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Security Features Grid */}
      <section className="py-24 bg-white">
        <div className="container-main">
          <div className="text-center mb-16">
            <h2 className="heading-2 mb-4">Les piliers de la confiance</h2>
            <p className="body-large max-w-2xl mx-auto text-[var(--text-secondary)]">
              Un écosystème conçu pour éliminer les risques et favoriser les bonnes rencontres.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {securityFeatures.map((feature, index) => {
              const FeatureIcon = iconMap[feature.icon];
              return (
                <Card
                  key={feature.id}
                  className="group bg-white border border-gray-100 hover:border-[var(--accent-primary)]/30 hover:shadow-xl transition-all duration-300 rounded-[2rem] overflow-hidden"
                >
                  <CardContent className="p-8">
                    <div className="w-14 h-14 rounded-2xl bg-[var(--accent-wash)] group-hover:bg-[var(--accent-primary)] transition-colors duration-300 flex items-center justify-center mb-6">
                      <FeatureIcon className="w-7 h-7 text-[var(--accent-strong)] group-hover:text-white transition-colors duration-300" />
                    </div>
                    <h3 className="heading-3 mb-3 text-[var(--text-primary)]">
                      {feature.title}
                    </h3>
                    <p className="text-[var(--text-secondary)] leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Payment Focus */}
      <section className="py-24 section-bg relative overflow-hidden">
        <div className="container-main">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <Card className="bg-white border-none shadow-2xl rounded-[2.5rem] overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                <CardContent className="p-10">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
                      <Shield className="w-8 h-8 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Protection Yondly</h3>
                      <p className="text-blue-600 font-medium">Powered by Stripe Connect</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
                      <Lock className="w-6 h-6 text-green-600 mt-1 shrink-0" />
                      <div>
                        <h4 className="font-bold text-gray-900 mb-1">Fonds Cantonés</h4>
                        <p className="text-sm text-gray-600">L'argent est bloqué jusqu'à la validation de la transaction par les deux parties.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
                      <Eye className="w-6 h-6 text-indigo-600 mt-1 shrink-0" />
                      <div>
                        <h4 className="font-bold text-gray-900 mb-1">Traçabilité Totale</h4>
                        <p className="text-sm text-gray-600">Chaque transaction est enregistrée et sécurisée. Zéro arnaque au "virement fantôme".</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-gray-100">
                    <p className="text-xs text-center text-gray-400">
                      Transactions sécurisées via Stripe • Frais transparents
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="order-1 lg:order-2">
              <span className="inline-block px-4 py-2 rounded-full bg-blue-100 text-blue-700 font-bold text-sm mb-6">
                💳 Paiement 100% Sécurisé
              </span>
              <h2 className="heading-2 mb-6">L'argent ne change de main que quand vous êtes satisfait.</h2>
              <p className="body-large text-[var(--text-secondary)] mb-8">
                Fini les chèques en bois ou les espèces douteuses. Avec Yondly, le paiement est intégré et sécurisé.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-lg text-gray-700">
                  <span className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold">✓</span>
                  Pas d'échange d'espèces
                </li>
                <li className="flex items-center gap-3 text-lg text-gray-700">
                  <span className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold">✓</span>
                  Remboursement garanti si problème
                </li>
                <li className="flex items-center gap-3 text-lg text-gray-700">
                  <span className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold">✓</span>
                  Protection acheteur & vendeur
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Handoff Tips - Checklist */}
      <section className="py-24 bg-white">
        <div className="container-main">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-2 rounded-full bg-orange-100 text-orange-700 font-bold text-sm mb-6">
                🤝 Rencontre
              </span>
              <h2 className="heading-2 mb-4">La remise en main propre idéale</h2>
              <p className="body-large text-[var(--text-secondary)]">
                Quelques règles simples pour que tout se passe bien.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Illustration Side */}
              <div className="bg-orange-50 rounded-[2rem] p-8 flex items-center justify-center min-h-[300px]">
                <img
                  src="/assets/rule_respect.png"
                  alt="Respect et rencontre"
                  className="w-full max-w-xs object-contain drop-shadow-xl"
                />
              </div>

              {/* Checklist Side */}
              <div className="space-y-4">
                {handoffTips.map((tip, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-orange-200 hover:bg-orange-50/30 transition-all duration-300 group cursor-default">
                    <div className="w-10 h-10 rounded-full bg-white border-2 border-orange-100 group-hover:border-orange-400 flex items-center justify-center text-orange-500 font-bold shadow-sm transition-colors">
                      {index + 1}
                    </div>
                    <p className="font-medium text-gray-700 group-hover:text-gray-900">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Moderation Hero */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-white to-blue-50 -z-10"></div>
        <div className="container-main relative z-10 text-center">
          <div className="w-20 h-20 bg-[var(--accent-wash)] rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-sm border border-[var(--accent-primary)]/10">
            <Eye className="w-10 h-10 text-[var(--accent-strong)]" />
          </div>
          <h2 className="heading-2 mb-6 text-[var(--text-primary)]">Modération Active 7j/7</h2>
          <p className="body-large max-w-2xl mx-auto mb-12 text-[var(--text-secondary)]">
            Une équipe humaine (pas des robots) vérifie les annonces et réagit aux signalements pour garder la communauté saine.
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" className="rounded-full px-8 bg-[var(--accent-strong)] text-white hover:bg-[var(--accent-dark)] shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Signaler un problème
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Security;
