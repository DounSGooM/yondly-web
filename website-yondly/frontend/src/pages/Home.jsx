import React from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

// Home Sections
import HeroSection from '../components/home/HeroSection';
import WhyYondlySection from '../components/home/WhyYondlySection';
import HowItWorksSection from '../components/home/HowItWorksSection';
import FoodDonationSection from '../components/home/FoodDonationSection';
import AntigaspiSection from '../components/home/AntigaspiSection';
import FeaturesSection from '../components/home/FeaturesSection';
import BadgesSection from '../components/home/BadgesSection';
import ImpactSection from '../components/home/ImpactSection';
import ProsSection from '../components/home/ProsSection';
import TestimonialsSection from '../components/home/TestimonialsSection';
import FaqSection from '../components/home/FaqSection';
import CtaSection from '../components/home/CtaSection';

const Home = () => {
  return (
    <div className="min-h-screen">
      <Header />

      <HeroSection />

      <WhyYondlySection />

      <HowItWorksSection />

      <FoodDonationSection />

      <AntigaspiSection />

      <FeaturesSection />

      <BadgesSection />

      <ImpactSection />

      <ProsSection />

      <TestimonialsSection />

      <FaqSection />

      <CtaSection />

      <Footer />
    </div>
  );
};

export default Home;
