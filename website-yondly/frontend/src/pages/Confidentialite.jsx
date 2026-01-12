import React from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

const Confidentialite = () => {
  return (
    <div className="min-h-screen">
      <Header />

      <section className="pt-28 pb-20">
        <div className="container-main">
          <div className="max-w-3xl mx-auto">
            <h1 className="heading-1 mb-8">Politique de confidentialité</h1>

            <div className="prose prose-lg max-w-none text-[var(--text-body)]">

              <h2 className="heading-3 mt-8 mb-4">1. Introduction</h2>
              <p className="mb-6">
                Yondly s'engage à protéger la vie privée de ses utilisateurs. Cette
                politique explique comment nous collectons, utilisons et protégeons vos
                données personnelles conformément au Règlement Général sur la Protection
                des Données (RGPD).
              </p>

              <h2 className="heading-3 mt-8 mb-4">2. Données collectées</h2>
              <p className="mb-4">Dans le cadre de la waitlist (bêta), nous collectons :</p>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li>Adresse email (obligatoire)</li>
                <li>Ville (optionnel)</li>
                <li>Statut (particulier, pro)</li>
                <li>Commentaires libres (optionnel)</li>
              </ul>

              <h2 className="heading-3 mt-8 mb-4">3. Finalités du traitement</h2>
              <p className="mb-4">Vos données sont utilisées pour :</p>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li>Vous informer de l'ouverture de la bêta dans votre zone</li>
                <li>Vous envoyer des actualités sur Yondly (avec votre consentement)</li>
                <li>Améliorer notre service grâce à vos retours</li>
              </ul>

              <h2 className="heading-3 mt-8 mb-4">4. Base légale</h2>
              <p className="mb-6">
                Le traitement de vos données repose sur votre consentement explicite,
                recueilli lors de votre inscription à la waitlist.
              </p>

              <h2 className="heading-3 mt-8 mb-4">5. Durée de conservation</h2>
              <p className="mb-6">
                Vos données sont conservées jusqu'à la fin de la période de bêta ou jusqu'à
                ce que vous demandiez leur suppression.
              </p>

              <h2 className="heading-3 mt-8 mb-4">6. Vos droits</h2>
              <p className="mb-4">Conformément au RGPD, vous disposez des droits suivants :</p>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li>Droit d'accès à vos données</li>
                <li>Droit de rectification</li>
                <li>Droit à l'effacement ("droit à l'oubli")</li>
                <li>Droit à la portabilité</li>
                <li>Droit d'opposition</li>
                <li>Droit de retirer votre consentement à tout moment</li>
              </ul>
              <p className="mb-6">
                Pour exercer ces droits, contactez-nous à : contact@yondly.fr
              </p>

              <h2 className="heading-3 mt-8 mb-4">7. Sécurité des données</h2>
              <p className="mb-6">
                Nous mettons en œuvre des mesures techniques et organisationnelles
                appropriées pour protéger vos données contre tout accès non autorisé,
                modification, divulgation ou destruction.
              </p>

              <h2 className="heading-3 mt-8 mb-4">8. Partage des données</h2>
              <p className="mb-6">
                Vos données ne sont jamais vendues à des tiers. Elles peuvent être
                partagées avec nos prestataires techniques (hébergement, envoi d'emails)
                dans le strict respect de la confidentialité.
              </p>

              <h2 className="heading-3 mt-8 mb-4">9. Contact</h2>
              <p className="mb-6">
                Pour toute question concernant cette politique :<br />
                Email : contact@yondly.fr<br />
                Adresse : [Adresse postale]
              </p>

              <h2 className="heading-3 mt-8 mb-4">10. Réclamations</h2>
              <p className="mb-6">
                Si vous estimez que le traitement de vos données constitue une violation
                du RGPD, vous avez le droit d'introduire une réclamation auprès de la CNIL
                (Commission Nationale de l'Informatique et des Libertés).
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

export default Confidentialite;
