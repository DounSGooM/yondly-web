
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './Navbar.module.css';

export const Navbar: React.FC = () => {
    const [scrolled, setScrolled] = useState(false);
    const location = useLocation();

    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleSubscribe = async () => {
        if (!email || !email.includes('@')) return;
        setStatus('loading');
        try {
            const res = await fetch('http://localhost:8000/api/newsletter/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            if (res.ok) {
                setStatus('success');
                setEmail('');
                setTimeout(() => setStatus('idle'), 3000);
            } else {
                setStatus('error');
            }
        } catch (e) {
            setStatus('error');
        }
    };

    const isHome = location.pathname === '/';

    return (
        <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
            <div className={`container ${styles.container}`}>
                <Link to="/" className={styles.logo} style={{ color: '#4C7B4B' }}>
                    <img src="/assets/loop-logo.png" alt="Yondly" style={{ height: '32px', marginRight: '8px' }} />
                    Yondly
                </Link>

                <div className={styles.links}>
                    <Link to="/" className={isHome ? styles.active : ''}>Accueil</Link>
                    <a href="/#club" className={styles.clubLink}>🎁 Club Yondly</a>
                    <Link to="/how-it-works" className={location.pathname === '/how-it-works' ? styles.active : ''}>Comment ça marche ?</Link>
                    <Link to="/mission" className={location.pathname === '/mission' ? styles.active : ''}>Notre Mission</Link>
                    <Link to="/pro" className={location.pathname === '/pro' ? styles.active : ''}>Espace Commerçants</Link>
                </div>

                <div className={styles.ctaGroup}>
                    <div className={styles.miniInputGroup}>
                        {status === 'success' ? (
                            <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>Merci ! 📩</span>
                        ) : (
                            <>
                                <input
                                    type="email"
                                    placeholder="Votre email..."
                                    className={styles.miniInput}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSubscribe()}
                                />
                                <button
                                    className={styles.miniButton}
                                    onClick={handleSubscribe}
                                    disabled={status === 'loading'}
                                >
                                    {status === 'loading' ? '...' : 'Rejoindre →'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};
