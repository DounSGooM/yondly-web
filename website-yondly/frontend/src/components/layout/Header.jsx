import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetHeader,
  SheetTitle,
} from '../ui/sheet';

const Header = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { label: 'Comment ça marche', href: '/comment-ca-marche' },
    { label: 'Fonctionnalités', href: '/fonctionnalites' },
    { label: 'Don alimentaire', href: '/don-alimentaire' },
    { label: 'FAQ', href: '/faq' },
  ];

  const isActive = (href) => location.pathname === href;

  return (
    <header className="nav-header">
      {/* Logo */}
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 font-bold text-xl" style={{ color: 'var(--accent-strong)' }}>
        <img src="/assets/logo.png" alt="Yondly Logo" className="w-12 h-12 object-contain" />
        <span className="font-['Manrope'] font-extrabold">Yondly</span>
      </Link>

      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center gap-1">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            to={link.href}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors
              ${isActive(link.href)
                ? 'bg-[var(--accent-wash)] text-[var(--accent-strong)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[rgba(0,0,0,0.05)]'
              }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {/* Desktop CTA */}
      <div className="hidden md:flex items-center gap-3">
        <Link
          to="/pros"
          className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          Espace Pro
        </Link>
        <Link to="/beta">
          <Button className="btn-primary text-sm px-5 py-2 h-auto">
            Rejoindre la bêta
          </Button>
        </Link>
      </div>

      {/* Mobile Menu */}
      <div className="md:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px] sm:w-[320px]">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2 text-[var(--accent-strong)]">
                <img src="/assets/logo.png" alt="Yondly Logo" className="w-12 h-12 object-contain" />
                <span className="font-['Manrope'] font-extrabold text-xl">Yondly</span>
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-2 mt-8">
              {navLinks.map((link) => (
                <SheetClose asChild key={link.href}>
                  <Link
                    to={link.href}
                    className={`px-4 py-3 rounded-xl text-base font-medium transition-colors
                      ${isActive(link.href)
                        ? 'bg-[var(--accent-wash)] text-[var(--accent-strong)]'
                        : 'text-[var(--text-body)] hover:bg-[rgba(0,0,0,0.05)]'
                      }`}
                  >
                    {link.label}
                  </Link>
                </SheetClose>
              ))}
              <hr className="my-2 border-[var(--border-light)]" />
              <SheetClose asChild>
                <Link
                  to="/pros"
                  className="px-4 py-3 rounded-xl text-base font-medium text-[var(--text-body)] hover:bg-[rgba(0,0,0,0.05)] transition-colors"
                >
                  Espace Pro
                </Link>
              </SheetClose>

              <hr className="my-2 border-[var(--border-light)]" />
              <SheetClose asChild>
                <Link to="/beta" className="mt-2">
                  <Button className="btn-primary w-full text-base py-4 h-auto">
                    Rejoindre la bêta
                  </Button>
                </Link>
              </SheetClose>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};

export default Header;
