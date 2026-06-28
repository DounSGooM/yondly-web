import React from 'react';
import WaitlistForm from '../shared/WaitlistForm';

const CtaSection = () => {
    return (
        <section className="py-20 md:py-28 bg-gradient-to-br from-[rgba(76,123,75,0.1)] to-[rgba(31,84,33,0.08)]">
            <div className="container-main">
                <div className="max-w-2xl mx-auto text-center">
                    <h2 className="heading-2 mb-4">Et si ton quartier devenait ta plus grande ressource ?</h2>
                    <p className="body-large mb-8">
                        Rejoins la bêta et fais partie des premiers à faire circuler les objets,
                        les services et la bonne énergie près de chez toi.
                    </p>
                    <div className="flex justify-center">
                        <WaitlistForm compact />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CtaSection;
