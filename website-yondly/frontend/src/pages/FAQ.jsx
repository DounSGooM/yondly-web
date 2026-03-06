import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ChevronRight, Search, MessageCircle, Mail } from 'lucide-react';
import { Button } from '../components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../components/ui/accordion';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import WaitlistForm from '../components/shared/WaitlistForm';
import { faqFull } from '../data/mock';

const FAQ = () => {
  // Group FAQs by category with icons
  const categories = [
    {
      name: 'Général',
      icon: '🌱',
      description: 'Les bases pour bien démarrer',
      questions: faqFull.filter((q) => [1, 4, 5, 6, 7].includes(q.id)),
    },
    {
      name: 'Paiement & Transactions',
      icon: '💳',
      description: 'Tout sur les paiements sécurisés',
      questions: faqFull.filter((q) => [2, 9, 14].includes(q.id)),
    },
    {
      name: 'Sécurité & Confiance',
      icon: '🛡️',
      description: 'Ta sécurité, notre priorité',
      questions: faqFull.filter((q) => [3, 13, 15].includes(q.id)),
    },
    {
      name: 'Fonctionnalités',
      icon: '⚡',
      description: 'Location, don alimentaire et plus',
      questions: faqFull.filter((q) => [8, 10].includes(q.id)),
    },
    {
      name: 'Professionnels',
      icon: '🏪',
      description: 'Pour les commerçants locaux',
      questions: faqFull.filter((q) => [12].includes(q.id)),
    },
  ];

  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero with Illustration */}
      <section className="pt-28 pb-20 hero-gradient overflow-hidden">
        <div className="container-main">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div className="text-center lg:text-left">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[rgba(76,123,75,0.15)] text-[var(--accent-strong)] text-sm font-semibold mb-6">
                <HelpCircle className="w-4 h-4" />
                Centre d'aide
              </span>
              <h1 className="heading-1 mb-6">
                Questions{' '}
                <span className="text-gradient">fréquentes</span>
              </h1>
              <p className="body-large mb-8 max-w-lg mx-auto lg:mx-0">
                Tout ce que tu voulais savoir sur Yondly sans oser le demander.
                On répond à toutes tes questions !
              </p>

              {/* Quick Stats */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-6">
                <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                  <MessageCircle className="w-5 h-5 text-[var(--accent-strong)]" />
                  <span className="font-medium">{faqFull.length} questions</span>
                </div>
                <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                  <Search className="w-5 h-5 text-[var(--accent-strong)]" />
                  <span className="font-medium">{categories.length} catégories</span>
                </div>
              </div>
            </div>

            {/* Hero Illustration */}
            <div className="relative hidden lg:flex justify-center">
              <div className="relative">
                <div className="bg-gradient-to-br from-[rgba(76,123,75,0.1)] to-[rgba(76,123,75,0.05)] rounded-3xl p-8 max-w-md">
                  <img
                    src="/assets/faq_illustration.png"
                    alt="Centre d'aide Yondly"
                    className="w-full h-auto max-w-sm object-contain"
                  />
                </div>
                {/* Floating badges */}
                <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-lg px-4 py-3 border border-green-100 animate-bounce-subtle">
                  <div className="text-2xl">❓</div>
                </div>
                <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-lg px-4 py-3 border border-green-100 animate-bounce-subtle" style={{ animationDelay: '0.5s' }}>
                  <div className="text-2xl">💡</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Navigation */}
      <section className="py-12 bg-white border-b border-[var(--border-light)]">
        <div className="container-main">
          <div className="flex flex-wrap justify-center gap-4">
            {categories.map((category) => (
              <a
                key={category.name}
                href={`#${category.name.toLowerCase().replace(/[&\s]/g, '-')}`}
                className="flex items-center gap-2 px-5 py-3 rounded-full bg-[var(--surface-soft)] hover:bg-[rgba(76,123,75,0.15)] text-[var(--text-secondary)] hover:text-[var(--accent-strong)] transition-all duration-300 font-medium"
              >
                <span className="text-xl">{category.icon}</span>
                <span>{category.name}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ by Category */}
      <section className="py-20">
        <div className="container-main">
          <div className="max-w-4xl mx-auto space-y-16">
            {categories.map((category) => (
              <div
                key={category.name}
                id={category.name.toLowerCase().replace(/[&\s]/g, '-')}
                className="scroll-mt-32"
              >
                {/* Category Header */}
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-[var(--surface-soft)] flex items-center justify-center text-2xl">
                    {category.icon}
                  </div>
                  <div>
                    <h2 className="heading-3 text-[var(--text-primary)]">
                      {category.name}
                    </h2>
                    <p className="text-[var(--text-secondary)] text-sm">
                      {category.description}
                    </p>
                  </div>
                </div>

                {/* Questions */}
                <Accordion type="single" collapsible className="space-y-4">
                  {category.questions.map((item) => (
                    <AccordionItem
                      key={item.id}
                      value={`item-${item.id}`}
                      className="bg-white rounded-2xl border border-[var(--border-light)] px-6 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
                    >
                      <AccordionTrigger className="text-left font-semibold text-[var(--text-primary)] hover:no-underline py-6 text-lg">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-[var(--text-secondary)] pb-6 text-base leading-relaxed">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Still Have Questions */}
      <section className="py-20 bg-[var(--surface-soft)]">
        <div className="container-main">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-3xl p-8 md:p-12 shadow-lg border border-[var(--border-light)]">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-[rgba(76,123,75,0.15)] flex items-center justify-center mx-auto mb-6">
                  <Mail className="w-8 h-8 text-[var(--accent-strong)]" />
                </div>
                <h2 className="heading-2 mb-4">Encore des questions ?</h2>
                <p className="body-large mb-8 max-w-lg mx-auto">
                  Tu n'as pas trouvé ta réponse ? Pas de souci, notre équipe est là pour t'aider !
                </p>
                <Link to="/contact">
                  <Button className="btn-primary text-lg px-8 py-4">
                    Nous contacter
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-[rgba(76,123,75,0.15)] to-[rgba(31,84,33,0.1)]">
        <div className="container-main">
          <div className="max-w-2xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 text-[var(--accent-strong)] text-sm font-semibold mb-6">
              🚀 Disponible sur iOS & Android
            </span>
            <h2 className="heading-2 mb-4">Prêt à essayer ?</h2>
            <p className="body-large mb-8">
              Rejoins la bêta et découvre Yondly par toi-même.
            </p>
            <div className="flex justify-center">
              <WaitlistForm compact />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FAQ;
