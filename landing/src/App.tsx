import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { HowItWorks } from './pages/HowItWorks';
import { Mission } from './pages/Mission';
import { Merchant } from './pages/Merchant';
import { LegalMentions } from './pages/LegalMentions';
import { PrivacyPolicy } from './pages/PrivacyPolicy';

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/mission" element={<Mission />} />
          <Route path="/pro" element={<Merchant />} />
          <Route path="/legal" element={<LegalMentions />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
