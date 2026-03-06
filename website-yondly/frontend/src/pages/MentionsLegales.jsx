import React from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

const MentionsLegales = () => {
  return (
    <div className="min-h-screen">
      <Header />

      <section className="pt-28 pb-20">
        <div className="container-main">
          <div className="max-w-3xl mx-auto">
            <h1 className="heading-1 mb-8">Mentions légales</h1>

            <div className="prose prose-lg max-w-none text-[var(--text-body)]">

              <h2 className="heading-3 mt-8 mb-4">Éditeur du site</h2>
              <p className="mb-6">
                Le site Yondly est édité par l'équipe du projet Yondly.<br />
                En cours de constitution.<br />
                Email : contact@yondly.fr
              </p>

              <h2 className="heading-3 mt-8 mb-4">Directeur de la publication</h2>
              <p className="mb-6">
                L'équipe Yondly
              </p>

              <h2 className="heading-3 mt-8 mb-4">Hébergement</h2>
              <p className="mb-6">
                Le site est hébergé par :<br />
                Infomaniak Network SA<br />
                Rue Eugène-Marziano 25<br />
                1227 Les Acacias, Genève, Suisse<br />
                support@infomaniak.com
              </p>

              <h2 className="heading-3 mt-8 mb-4">Propriété intellectuelle</h2>
              <p className="mb-6">
                L'ensemble du contenu de ce site (textes, images, vidéos, logos, etc.) est
                protégé par le droit d'auteur. Toute reproduction, représentation,
                modification, publication ou adaptation de tout ou partie des éléments du
                site est interdite sans autorisation préalable.
              </p>

              <h2 className="heading-3 mt-8 mb-4">Limitation de responsabilité</h2>
              <p className="mb-6">
                Yondly s'efforce de fournir des informations aussi précises que possible.
                Toutefois, elle ne pourra être tenue responsable des omissions, des
                inexactitudes et des carences dans la mise à jour.
              </p>

              <h2 className="heading-3 mt-8 mb-4">Droit applicable</h2>
              <p className="mb-6">
                Le présent site et ses mentions légales sont soumis au droit français. En
                cas de litige, les tribunaux français seront seuls compétents.
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

export default MentionsLegales;
