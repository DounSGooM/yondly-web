import React from 'react';
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Tracking from './components/shared/Tracking';
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
import BlogList from './pages/BlogList';
import BlogPost from './pages/BlogPost';
import Beta from './pages/Beta';
import Merci from './pages/Merci';
import MentionsLegales from './pages/MentionsLegales';
import Confidentialite from './pages/Confidentialite';
import Cookies from './pages/Cookies';

// Admin
import BlogAdmin from './pages/admin/BlogAdmin';
import BlogEditor from './pages/admin/BlogEditor';
import Login from './pages/admin/Login';
import PrivateRoute from './components/shared/PrivateRoute';

import { HelmetProvider } from 'react-helmet-async';

function App() {
  return (
    <div className="App">
      <HelmetProvider>
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

            {/* Blog Pages */}
            <Route path="/blog" element={<BlogList />} />
            <Route path="/blog/:slug" element={<BlogPost />} />

            {/* Beta / Waitlist */}
            <Route path="/beta" element={<Beta />} />
            <Route path="/merci" element={<Merci />} />

            {/* Legal Pages */}
            <Route path="/mentions-legales" element={<MentionsLegales />} />
            <Route path="/confidentialite" element={<Confidentialite />} />
            <Route path="/cookies" element={<Cookies />} />

            {/* Admin Routes */}
            <Route path="/admin/login" element={<Login />} />
            <Route path="/admin/blog" element={
              <PrivateRoute>
                <BlogAdmin />
              </PrivateRoute>
            } />
            <Route path="/admin/blog/new" element={
              <PrivateRoute>
                <BlogEditor />
              </PrivateRoute>
            } />
            <Route path="/admin/blog/edit/:id" element={
              <PrivateRoute>
                <BlogEditor />
              </PrivateRoute>
            } />
          </Routes>

          {/* Tracking & Cookie Consent */}
          <Tracking />
        </BrowserRouter>
      </HelmetProvider>
    </div>
  );
}

export default App;
