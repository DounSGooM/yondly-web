import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

const Merci = () => {
  return (
    <div className="min-h-screen">
      <Header />

      <section className="pt-28 pb-20 hero-gradient min-h-[80vh] flex items-center">
        <div className="container-main w-full">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-strong)] flex items-center justify-center mx-auto mb-8 shadow-xl">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>

            <h1 className="heading-1 mb-6">Merci pour ton inscription !</h1>

            <p className="body-large mb-8">
              Tu es maintenant sur la liste d'attente. On te contactera dès que la bêta
              ouvre dans ta zone.
            </p>

            <div className="bg-white rounded-2xl border border-[var(--border-light)] p-6 mb-8 text-left">
              <h3 className="font-semibold text-[var(--text-primary)] mb-4">
                En attendant, tu peux :
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[var(--accent-wash)] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-[var(--accent-strong)]">
                      1
                    </span>
                  </div>
                  <span className="text-[var(--text-body)]">
                    Parler de Yondly autour de toi (plus on est de voisins, mieux c'est !)
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[var(--accent-wash)] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-[var(--accent-strong)]">
                      2
                    </span>
                  </div>
                  <span className="text-[var(--text-body)]">
                    Nous suivre sur les réseaux pour les actus
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[var(--accent-wash)] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-[var(--accent-strong)]">
                      3
                    </span>
                  </div>
                  <span className="text-[var(--text-body)]">
                    Vérifier tes spams au cas où (on ne sait jamais)
                  </span>
                </li>
              </ul>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/">
                <Button className="btn-primary">
                  Retour à l'accueil
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link to="/faq">
                <Button variant="outline" className="btn-secondary">
                  Consulter la FAQ
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Merci;
