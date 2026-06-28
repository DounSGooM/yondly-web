import React from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

// Home Sections
import HeroSection from '../components/home/HeroSection';
import WhyYondlySection from '../components/home/WhyYondlySection';
import YondlyScanSection from '../components/home/YondlyScanSection';
import HowItWorksSection from '../components/home/HowItWorksSection';
import FoodDonationSection from '../components/home/FoodDonationSection';
import AntigaspiSection from '../components/home/AntigaspiSection';
import FeaturesSection from '../components/home/FeaturesSection';
import BadgesSection from '../components/home/BadgesSection';
import ImpactSection from '../components/home/ImpactSection';
import ProsSection from '../components/home/ProsSection';
import CollectivitesSection from '../components/home/CollectivitesSection';
import TestimonialsSection from '../components/home/TestimonialsSection';
import FaqSection from '../components/home/FaqSection';
import CtaSection from '../components/home/CtaSection';

import SEO from '../components/shared/SEO';

const Home = () => {
  return (
    <div className="min-h-screen">
      <SEO
        title="Yondly - L'application d'échange, vente et don entre voisins"
        description="Rejoignez Yondly pour donner une seconde vie à vos objets. Vente, don, et location entre particuliers et professionnels locaux. Anti-gaspi et économie circulaire."
        keywords="don, vente, location, voisins, anti-gaspi, local, application, yondly"
        schema={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Yondly",
          "url": "https://yondly.vercel.app",
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://yondly.vercel.app/search?q={search_term_string}",
            "query-input": "required name=search_term_string"
          }
        }}
      />
      <Header />

      <HeroSection />

      <WhyYondlySection />

      <YondlyScanSection />

      <HowItWorksSection />

      <FoodDonationSection />

      <AntigaspiSection />

      <FeaturesSection />

      <BadgesSection />

      <ImpactSection />

      <ProsSection />

      <CollectivitesSection />

      <TestimonialsSection />

      <FaqSection />

      <CtaSection />

      <Footer />
    </div>
  );
};

export default Home;
