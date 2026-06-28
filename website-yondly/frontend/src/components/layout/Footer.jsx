import React from 'react';
import { Link } from 'react-router-dom';
import { footerLinks } from '../../data/mock';

const Footer = () => {
  return (
    <footer className="bg-[var(--bg-section)] border-t border-[var(--border-light)]">
      <div className="container-main py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img src="/assets/logo.png" alt="Yondly Logo" className="w-10 h-10 object-contain mix-blend-multiply" />
              <span className="brand-wordmark text-xl" style={{ color: 'var(--text-primary)' }}>
                Yondly
              </span>
            </Link>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              L'entraide locale, simplement.
            </p>
            <div className="flex gap-3 mt-4">
              {/* Social links placeholders */}
              <a
                href="https://www.instagram.com/yondlyfr/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white border border-[var(--border-light)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--accent-strong)] hover:border-[var(--accent-primary)] transition-colors"
                aria-label="Instagram"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>
              Produit
            </h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent-strong)] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Partners Links */}
          <div>
            <h4 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>
              Partenaires
            </h4>
            <ul className="space-y-3">
              {footerLinks.partners.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent-strong)] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>
              Support
            </h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent-strong)] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>
              Légal
            </h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent-strong)] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-[var(--border-light)] flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-[var(--text-muted)]">
            © {new Date().getFullYear()} Yondly. Tous droits réservés.
          </p>
          <p className="text-sm text-[var(--text-muted)]">
            Fait avec ❤️ à Poitiers
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
