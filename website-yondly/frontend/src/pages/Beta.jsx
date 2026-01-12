import React from 'react';
import { Link } from 'react-router-dom';
import { Rocket, Check } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import WaitlistForm from '../components/shared/WaitlistForm';

const Beta = () => {
  const benefits = [
    'Accès prioritaire à l\'app dès qu\'elle ouvre dans ta zone',
    'Contribue à façonner le produit avec tes retours',
    'Inscription 100% gratuite',
  ];

  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-24 relative overflow-hidden bg-gradient-to-br from-[var(--accent-wash)] via-white to-orange-50/50 min-h-[80vh] flex items-center">
        {/* Animated Background Shapes */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-[var(--accent-primary)] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

        {/* Floating Hero Illustration (Desktop) */}
        <div className="hidden lg:block absolute top-1/2 left-10 -translate-y-1/2 w-64 h-64 -z-0 opacity-10 md:opacity-100 md:relative md:w-auto md:h-auto md:z-auto">
          {/* This div is just a placeholder logic, simpler to put image in grid */}
        </div>

        <div className="container-main w-full relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--accent-wash)] text-[var(--accent-strong)] text-sm font-semibold mb-6 border border-[var(--accent-primary)]/20 shadow-sm animate-fade-in">
                <Rocket className="w-4 h-4" />
                Bêta privée
              </span>
              <h1 className="heading-1 mb-6 bg-clip-text text-transparent bg-gradient-to-r from-[var(--text-primary)] to-[var(--text-secondary)]">
                Rejoins la bêta <br />
                <span className="text-[var(--accent-primary)]">Yondly</span>
              </h1>
              <p className="body-large mb-8 text-[var(--text-secondary)] leading-relaxed relative z-10">
                Sois parmi les premiers à utiliser Yondly dans ta ville. Inscris-toi
                maintenant et on te préviendra dès que c'est dispo chez toi.
              </p>

              {/* Decorative Illustration behind text elements if needed, or just below */}
              <img
                src="/assets/hero_illustration.png"
                alt="Community"
                className="w-full max-w-sm mx-auto lg:mx-0 mb-8 rounded-2xl shadow-lg transform -rotate-2 hover:rotate-0 transition-transform duration-500"
              />

              <ul className="space-y-4 mb-8">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3 group">
                    <div className="w-6 h-6 rounded-full bg-[var(--accent-primary)] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md shadow-[var(--accent-primary)]/30 group-hover:scale-110 transition-transform duration-300">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-[var(--text-body)] font-medium">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-strong)] rounded-2xl blur opacity-20"></div>
              <Card className="border-white/50 bg-white/80 backdrop-blur-xl shadow-2xl relative overflow-hidden rounded-2xl">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-strong)]"></div>
                <CardContent className="p-8 sm:p-10">
                  <h2 className="heading-3 mb-2 text-center">Inscription à la bêta</h2>
                  <p className="text-[var(--text-secondary)] text-center mb-8">
                    Remplis le formulaire ci-dessous pour réserver ta place.
                  </p>
                  <WaitlistForm />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="py-24 bg-slate-50 text-center">
        <div className="container-main">
          <div className="max-w-5xl mx-auto">
            <h2 className="heading-2 mb-16">Comment ça se passe ?</h2>
            <div className="grid md:grid-cols-3 gap-8 relative">

              {/* Dashed Connection Line */}
              <div className="hidden md:block absolute top-[60px] left-[15%] right-[15%] h-0.5 border-t-2 border-dashed border-gray-300 -z-0 opacity-40" />

              {/* Step 1 */}
              <div className="relative group z-10">
                <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm hover:shadow-xl hover:shadow-[var(--accent-wash)] transition-all duration-300 hover:-translate-y-2 h-full text-center group-hover:border-[var(--accent-primary)]/50">
                  <div className="relative mb-8">
                    <div className="w-32 h-32 mx-auto rounded-full bg-white border border-gray-100 shadow-inner flex items-center justify-center relative z-10 group-hover:scale-110 transition-transform duration-300 overflow-hidden p-2">
                      <img src="/assets/feature_rent.png" alt="Inscris-toi" className="w-full h-full object-contain" />
                    </div>
                    <div className="absolute top-0 right-4 w-10 h-10 rounded-full bg-[var(--accent-primary)] flex items-center justify-center text-white font-bold text-lg shadow-md border-[3px] border-white">
                      1
                    </div>
                  </div>
                  <h4 className="heading-4 mb-3 group-hover:text-[var(--accent-primary)] transition-colors">Tu t'inscris</h4>
                  <p className="text-[var(--text-secondary)] leading-relaxed">
                    Laisse ton email et ta ville via le formulaire. C'est rapide et gratuit.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative group z-10 md:mt-0">
                <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm hover:shadow-xl hover:shadow-blue-100 transition-all duration-300 hover:-translate-y-2 h-full text-center group-hover:border-blue-300">
                  <div className="relative mb-8">
                    <div className="w-32 h-32 mx-auto rounded-full bg-white border border-gray-100 shadow-inner flex items-center justify-center relative z-10 group-hover:scale-110 transition-transform duration-300 overflow-hidden p-2">
                      <img src="/assets/feature_sell.png" alt="Contact" className="w-full h-full object-contain" />
                    </div>
                    <div className="absolute top-0 right-4 w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg shadow-md border-[3px] border-white">
                      2
                    </div>
                  </div>
                  <h4 className="heading-4 mb-3 group-hover:text-blue-600 transition-colors">On te contacte</h4>
                  <p className="text-[var(--text-secondary)] leading-relaxed">
                    On t'envoie ton lien d'accès personnel dès que la bêta ouvre dans ta zone.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative group z-10">
                <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm hover:shadow-xl hover:shadow-orange-100 transition-all duration-300 hover:-translate-y-2 h-full text-center group-hover:border-orange-300">
                  <div className="relative mb-8">
                    <div className="w-32 h-32 mx-auto rounded-full bg-white border border-gray-100 shadow-inner flex items-center justify-center relative z-10 group-hover:scale-110 transition-transform duration-300 overflow-hidden p-2">
                      <img src="/assets/feature_donate.png" alt="Test" className="w-full h-full object-contain" />
                    </div>
                    <div className="absolute top-0 right-4 w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-lg shadow-md border-[3px] border-white">
                      3
                    </div>
                  </div>
                  <h4 className="heading-4 mb-3 group-hover:text-orange-500 transition-colors">Tu testes</h4>
                  <p className="text-[var(--text-secondary)] leading-relaxed">
                    Tu télécharges l'app (iOS/Android) et tu commences à échanger avec tes voisins !
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Beta;
