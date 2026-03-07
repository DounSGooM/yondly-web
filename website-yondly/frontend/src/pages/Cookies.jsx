import React from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';



// Cookies Page Component
const Cookies = () => {
  return (
    <div className="min-h-screen">
      <Header />

      <section className="pt-28 pb-20">
        <div className="container-main">
          <div className="max-w-3xl mx-auto">
            <h1 className="heading-1 mb-8">Politique de cookies</h1>

            <div className="prose prose-lg max-w-none text-[var(--text-body)]">

              <h2 className="heading-3 mt-8 mb-4">Qu'est-ce qu'un cookie ?</h2>
              <p className="mb-6">
                Un cookie est un petit fichier texte déposé sur votre appareil lors de
                votre visite sur un site. Il permet au site de mémoriser certaines
                informations pour faciliter votre navigation.
              </p>

              <h2 className="heading-3 mt-8 mb-4">Cookies utilisés sur Yondly</h2>

              <h3 className="text-lg font-semibold mt-6 mb-3">Cookies essentiels</h3>
              <p className="mb-4">
                Ces cookies sont nécessaires au fonctionnement du site et ne peuvent pas
                être désactivés.
              </p>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li>
                  <strong>yondly_cookie_consent</strong> : Mémorise votre choix concernant
                  les cookies
                </li>
              </ul>

              <h3 className="text-lg font-semibold mt-6 mb-3">Cookies d'analyse (optionnels)</h3>
              <p className="mb-6">
                Si nous utilisons des outils d'analytics à l'avenir, ils seront listés
                ici et soumis à votre consentement.
              </p>

              <h2 className="heading-3 mt-8 mb-4">Gérer vos préférences</h2>
              <p className="mb-4">
                Vous pouvez à tout moment modifier vos préférences en matière de cookies :
              </p>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li>Via le bandeau de consentement lors de votre première visite</li>
                <li>En supprimant les cookies de votre navigateur</li>
                <li>En nous contactant directement</li>
              </ul>

              <h2 className="heading-3 mt-8 mb-4">Durée de conservation</h2>
              <p className="mb-6">
                Les cookies essentiels sont conservés pendant 13 mois maximum, conformément
                aux recommandations de la CNIL.
              </p>

              <h2 className="heading-3 mt-8 mb-4">En savoir plus</h2>
              <p className="mb-6">
                Pour en savoir plus sur les cookies et la protection de vos données,
                consultez le site de la CNIL : <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-[var(--accent-strong)] hover:underline">www.cnil.fr</a>
              </p>

              <p className="text-sm text-[var(--text-muted)] mt-8">
                Dernière mise à jour : Août 2025
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Cookies;
