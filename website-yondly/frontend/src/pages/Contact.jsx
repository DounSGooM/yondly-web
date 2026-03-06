import React, { useState } from 'react';
import axios from 'axios';
import { Mail, MapPin, MessageSquare, Check, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import SEO from '../components/shared/SEO';

const API = 'http://localhost:8000/api'; // Hardcoded for local debug
// const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
// const API = `${BACKEND_URL}/api`;

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    rgpdConsent: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.name || !formData.message) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (!formData.rgpdConsent) {
      setError('Veuillez accepter la politique de confidentialité');
      return;
    }

    setIsSubmitting(true);

    try {
      await axios.post(`${API}/contact`, {
        name: formData.name,
        email: formData.email,
        subject: formData.subject || null,
        message: formData.message,
        rgpd_consent: formData.rgpdConsent,
      });
      setIsSubmitted(true);
    } catch (err) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Une erreur est survenue. Réessayez.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <SEO
        title="Contactez Yondly | Support & Partenariats"
        description="Besoin d'aide ou envie de devenir partenaire ? Contactez l'équipe Yondly. Nous répondons sous 48h."
        url="/contact"
        schema={{
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "Yondly",
          "contactPoint": {
            "@type": "ContactPoint",
            "email": "contact@yondly.com",
            "contactType": "customer service"
          }
        }}
      />
      <Header />

      {/* Hero */}
      {/* Hero */}
      <section className="pt-32 pb-24 relative overflow-hidden">
        {/* Dynamic Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 bg-gradient-to-b from-green-50/80 to-white" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-green-200/30 rounded-full blur-3xl animate-blob mix-blend-multiply filter" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-[var(--accent-wash)] rounded-full blur-3xl animate-blob animation-delay-200 mix-blend-multiply filter" />
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-green-100/30 rounded-full blur-3xl animate-blob animation-delay-400 mix-blend-multiply filter" />

        <div className="container-main relative z-10">
          <div className="max-w-3xl mx-auto text-center">

            {/* New Badge Element */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-green-100 shadow-sm mb-8 animate-fade-in-up">
              <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-pulse"></span>
              <span className="text-sm font-semibold text-[var(--accent-strong)] tracking-wide uppercase">On est à l'écoute</span>
            </div>

            <div className="flex justify-center mb-8 relative">
              <img
                src="/assets/contact_hero.png"
                alt="Illustration Contact"
                className="w-64 h-64 object-contain animate-float relative z-10 drop-shadow-xl"
              />
              {/* Glow behind image */}
              <div className="absolute inset-0 bg-gradient-to-tr from-green-200/20 to-transparent blur-2xl rounded-full transform scale-110 -z-10" />
            </div>

            <h1 className="heading-1 mb-6 text-5xl md:text-7xl bg-clip-text text-transparent bg-gradient-to-r from-[var(--text-primary)] via-[var(--accent-strong)] to-[var(--text-primary)] leading-tight">
              Contactez-nous
            </h1>
            <p className="body-large text-xl md:text-2xl text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
              Une question, une suggestion ou juste envie de dire bonjour ?<br />
              <span className="text-[var(--text-primary)] font-medium">L'équipe Yondly est là pour vous.</span>
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="pb-24">
        <div className="container-main">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 max-w-6xl mx-auto items-start">

            {/* Left Column: Info Cards (Bento) */}
            <div className="lg:col-span-5 space-y-6">

              <div className="flex justify-center mb-4">
                <img
                  src="/assets/contact_support.png"
                  alt="Support Yondly"
                  className="w-48 h-auto object-contain"
                />
              </div>

              <div className="bg-white rounded-3xl p-8 border border-[var(--border-light)] shadow-sm hover:shadow-md transition-all duration-300">
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-6">Nos coordonnées</h3>
                <div className="space-y-6">
                  <div className="flex items-center gap-4 group">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--accent-wash)] group-hover:bg-[var(--accent-primary)] group-hover:text-white transition-colors flex items-center justify-center flex-shrink-0 text-[var(--accent-strong)]">
                      <Mail className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--text-muted)] mb-1">Email</p>
                      <a href="mailto:contact@yondly.fr" className="text-lg font-semibold text-[var(--text-primary)] hover:text-[var(--accent-primary)] transition-colors">
                        contact@yondly.fr
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 group">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--accent-wash)] group-hover:bg-[var(--accent-primary)] group-hover:text-white transition-colors flex items-center justify-center flex-shrink-0 text-[var(--accent-strong)]">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--text-muted)] mb-1">QG</p>
                      <p className="text-lg font-semibold text-[var(--text-primary)]">
                        Poitiers
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Card */}
              <div className="bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-strong)] rounded-3xl p-8 text-white shadow-lg shadow-green-200 overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-1/3 -translate-y-1/3">
                  <svg className="w-48 h-48" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Suivez nos aventures</h3>
                <p className="text-green-50 mb-6 max-w-xs">
                  Rejoignez la communauté sur Instagram pour ne rien rater des nouveautés !
                </p>
                <a
                  href="#"
                  className="inline-flex items-center gap-2 bg-white text-[var(--accent-strong)] px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform shadow-md"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                  Suivre sur Instagram
                </a>
              </div>
            </div>

            {/* Right Column: Form */}
            <div className="lg:col-span-7">
              {isSubmitted ? (
                <Card className="border-[var(--accent-primary)] bg-[var(--accent-wash)] h-full flex items-center justify-center p-12">
                  <CardContent className="text-center">
                    <div className="w-20 h-20 rounded-full bg-[var(--accent-primary)] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-200">
                      <Check className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="heading-2 mb-3">Message bien reçu ! 🚀</h3>
                    <p className="text-lg text-[var(--text-secondary)]">
                      Merci de nous avoir écrit. On te répond très vite !
                      <br />
                      <span className="text-sm text-[var(--text-muted)] mt-2 block">
                        (Un email de confirmation t'a été envoyé)
                      </span>
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-0 shadow-2xl shadow-gray-200/50 bg-white/80 backdrop-blur-sm rounded-[2rem] overflow-hidden">
                  <CardContent className="p-8 md:p-10">
                    <h2 className="text-2xl font-bold mb-8 text-[var(--text-primary)]">Envoyez-nous un message</h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-sm font-semibold text-[var(--text-primary)] pl-1">Nom complet *</Label>
                          <Input
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="h-14 rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white transition-all"
                            placeholder="Jean Dupont"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-sm font-semibold text-[var(--text-primary)] pl-1">Email *</Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="h-14 rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white transition-all"
                            placeholder="jean@exemple.com"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="subject" className="text-sm font-semibold text-[var(--text-primary)] pl-1">Sujet</Label>
                        <Input
                          id="subject"
                          name="subject"
                          placeholder="De quoi souhaitez-vous parler ?"
                          value={formData.subject}
                          onChange={handleChange}
                          className="h-14 rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white transition-all"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message" className="text-sm font-semibold text-[var(--text-primary)] pl-1">Message *</Label>
                        <textarea
                          id="message"
                          name="message"
                          rows={6}
                          value={formData.message}
                          onChange={handleChange}
                          placeholder="Écris ton message ici..."
                          className="w-full rounded-xl px-4 py-3 border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-[var(--accent-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)] resize-none text-sm transition-all"
                          required
                        />
                      </div>

                      <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                        <Checkbox
                          id="rgpdConsent"
                          checked={formData.rgpdConsent}
                          onCheckedChange={(checked) =>
                            setFormData((prev) => ({ ...prev, rgpdConsent: checked }))
                          }
                          className="mt-1"
                        />
                        <Label
                          htmlFor="rgpdConsent"
                          className="text-sm text-[var(--text-secondary)] cursor-pointer leading-relaxed"
                        >
                          En soumettant ce formulaire, j'accepte que mes informations soient utilisées exclusivement dans le cadre de ma demande et de la relation commerciale éthique qui peut en découler.
                        </Label>
                      </div>

                      {error && (
                        <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm flex items-center gap-2">
                          <span className="font-bold">Erreur :</span> {error}
                        </div>
                      )}

                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn-primary w-full h-14 text-lg font-bold rounded-xl shadow-lg shadow-green-200/50 hover:shadow-green-300/50 transition-all transform hover:-translate-y-0.5"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                            Envoi en cours...
                          </>
                        ) : (
                          'Envoyer le message'
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;
