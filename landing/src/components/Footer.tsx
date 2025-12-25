
import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

export const Footer: React.FC = () => {
    return (
        <footer className={styles.footer}>
            <div className={`container ${styles.container}`}>
                <div className={styles.top}>
                    <div className={styles.brand}>
                        <div className={styles.logo} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4C7B4B' }}>
                            <img src="/assets/loop-logo.png" alt="Yondly" style={{ height: '28px' }} />
                            Yondly
                        </div>
                        <p className={styles.tagline}>
                            La plateforme collaborative qui réinvente la vie de quartier.
                        </p>
                    </div>

                    <div className={styles.linksColumn}>
                        <h4>Découvrir</h4>
                        <Link to="/how-it-works">Comment ça marche</Link>
                        <a href="#pro">Espace Pro</a>
                        <a href="#">Blog</a>
                    </div>

                    <div className={styles.linksColumn}>
                        <h4>Légal</h4>
                        <Link to="/legal">Mentions légales</Link>
                        <Link to="/privacy">Confidentialité</Link>
                        <Link to="/legal">CGU</Link>
                        <Link to="/privacy">Cookies</Link>
                    </div>

                    <div className={styles.newsletter}>
                        <h4>Restez informé</h4>
                        <p>Recevez nos meilleures astuces anti-gaspi.</p>
                        <div className={styles.inputGroup}>
                            <input type="email" placeholder="Votre email" />
                            <button>→</button>
                        </div>
                    </div>
                </div>

                <div className={styles.bottom}>
                    <p>&copy; {new Date().getFullYear()} Yondly. Tous droits réservés.</p>
                    <div className={styles.socials}>
                        <span>Instagram</span>
                        <span>Twitter</span>
                        <span>LinkedIn</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};
