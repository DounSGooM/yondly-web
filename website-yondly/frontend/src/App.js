import React from 'react';
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CookieBanner } from './pages/Cookies';
import ScrollToTop from './components/layout/ScrollToTop';

// Pages
import Home from './pages/Home';
import HowItWorks from './pages/HowItWorks';
import Features from './pages/Features';
import FoodDonation from './pages/FoodDonation';
import Security from './pages/Security';
import Pros from './pages/Pros';
import FAQ from './pages/FAQ';
import Contact from './pages/Contact';
import Beta from './pages/Beta';
import Merci from './pages/Merci';
import MentionsLegales from './pages/MentionsLegales';
import Confidentialite from './pages/Confidentialite';
import Cookies from './pages/Cookies';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          {/* Main Pages */}
          <Route path="/" element={<Home />} />
          <Route path="/comment-ca-marche" element={<HowItWorks />} />
          <Route path="/fonctionnalites" element={<Features />} />
          <Route path="/don-alimentaire" element={<FoodDonation />} />
          <Route path="/securite" element={<Security />} />

          {/* Partner Pages */}
          <Route path="/pros" element={<Pros />} />
          <Route path="/pros" element={<Pros />} />

          {/* Support Pages */}
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contact" element={<Contact />} />

          {/* Beta / Waitlist */}
          <Route path="/beta" element={<Beta />} />
          <Route path="/merci" element={<Merci />} />

          {/* Legal Pages */}
          <Route path="/mentions-legales" element={<MentionsLegales />} />
          <Route path="/confidentialite" element={<Confidentialite />} />
          <Route path="/cookies" element={<Cookies />} />
        </Routes>

        {/* Cookie Banner */}
        <CookieBanner />
      </BrowserRouter>
    </div>
  );
}

export default App;
