import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import ReactGA from 'react-ga4';
import CookieConsent, { getCookieConsentValue } from 'react-cookie-consent';

// Configuration
const GA_MEASUREMENT_ID = 'G-QDB58GJQ3H';
const META_PIXEL_ID = null; // À remplir plus tard : '123456789'
const CONSENT_COOKIE = 'yondly_consent';

const Tracking = () => {
    const location = useLocation();
    // Conformité CNIL : on n'active GA4 qu'APRÈS consentement explicite.
    const [consentGranted, setConsentGranted] = useState(
        () => getCookieConsentValue(CONSENT_COOKIE) === 'true'
    );

    useEffect(() => {
        // Initialise GA4 uniquement si l'utilisateur a accepté les cookies.
        if (consentGranted && GA_MEASUREMENT_ID) {
            ReactGA.initialize(GA_MEASUREMENT_ID);
        }
    }, [consentGranted]);

    useEffect(() => {
        // Pageview seulement si consentement donné et GA initialisé.
        if (consentGranted && GA_MEASUREMENT_ID) {
            ReactGA.send({ hitType: "pageview", page: location.pathname + location.search });
        }
    }, [location, consentGranted]);

    return (
        <CookieConsent
            location="bottom"
            buttonText="J'accepte"
            declineButtonText="Refuser"
            enableDeclineButton
            cookieName={CONSENT_COOKIE}
            style={{ background: "#2B373B" }}
            buttonStyle={{ background: "#4C7B4B", color: "#fff", fontSize: "14px", borderRadius: "4px" }}
            declineButtonStyle={{ background: "transparent", color: "#ccc", fontSize: "12px" }}
            expires={150}
            onAccept={() => setConsentGranted(true)}
        >
            Ce site utilise des cookies pour analyser le trafic et améliorer votre expérience. 🍪
        </CookieConsent>
    );
};

export default Tracking;
