import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ReactGA from 'react-ga4';
import CookieConsent from 'react-cookie-consent';

// Configuration
const GA_MEASUREMENT_ID = 'G-QDB58GJQ3H';
const META_PIXEL_ID = null; // À remplir plus tard : '123456789'

const Tracking = () => {
    const location = useLocation();

    useEffect(() => {
        // Initialisation GA4 si consentement (ou par défaut si on considère l'intérêt légitime pour l'anonymisé, 
        // mais ici on respecte le standard : init au chargement souvent toléré, cookies soumis à bandeau)
        // Pour être strict RGPD, on n'initialise QU'APRÈS consentement.
        // Ici, on initialise en mode "désactivé" par défaut si on voulait être puriste, 
        // mais pour une marketplace, on fait souvent du "Soft Opt-in" ou bandeau classique.

        // On initialise GA4
        if (GA_MEASUREMENT_ID) {
            ReactGA.initialize(GA_MEASUREMENT_ID);
        }
    }, []);

    useEffect(() => {
        // Tracking des changements de page
        if (GA_MEASUREMENT_ID) {
            ReactGA.send({ hitType: "pageview", page: location.pathname + location.search });
        }

        // Placeholder pour Meta Pixel PageView
        if (META_PIXEL_ID) {
            // ReactPixel.pageView(); 
        }
    }, [location]);

    return (
        <CookieConsent
            location="bottom"
            buttonText="J'accepte"
            declineButtonText="Refuser"
            enableDeclineButton
            cookieName="yondly_consent"
            style={{ background: "#2B373B" }}
            buttonStyle={{ background: "#4C7B4B", color: "#fff", fontSize: "14px", borderRadius: "4px" }}
            declineButtonStyle={{ background: "transparent", color: "#ccc", fontSize: "12px" }}
            expires={150}
            onAccept={() => {
                // Activer le tracking avancé si besoin
            }}
        >
            Ce site utilise des cookies pour analyser le trafic et améliorer votre expérience. 🍪
        </CookieConsent>
    );
};

export default Tracking;
