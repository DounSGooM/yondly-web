// Mock data for Yondly website

export const whyYondlyCards = [
  {
    id: 1,
    icon: 'PiggyBank',
    title: 'Économiser',
    description: "Achète d'occasion ou loue au lieu d'acheter neuf. Ton portefeuille te dira merci."
  },
  {
    id: 2,
    icon: 'Package',
    title: 'Désencombrer',
    description: 'Vends ou donne rapidement ce dont tu ne te sers plus. Libère de la place chez toi.'
  },
  {
    id: 3,
    icon: 'Heart',
    title: "S'entraider",
    description: 'Donne, partage, connecte-toi avec tes voisins. La solidarité locale, ça change tout.'
  }
];

export const howItWorksSteps = [
  {
    id: 1,
    step: '1',
    title: 'Tu publies en 30 secondes',
    description: 'Vente, don ou location — quelques photos, un prix, et hop !'
  },
  {
    id: 2,
    step: '2',
    title: 'Les gens près de chez toi trouvent',
    description: 'Tes voisins voient ton annonce et te contactent directement.'
  },
  {
    id: 3,
    step: '3',
    title: 'Échange simple & sécurisé',
    description: 'Paiement in-app pour les ventes/locations, remise en main propre.'
  }
];

export const featuresData = {
  vendre: {
    title: 'Vendre',
    description: 'Mets en vente tes objets et trouve des acheteurs près de chez toi.',
    icon: 'ShoppingBag',
    bullets: [
      'Mise en ligne rapide avec photos',
      'Paiement sécurisé in-app (obligatoire)',
      'Remise en main propre dans ton quartier'
    ],
    examples: ['Poussette bébé', 'Vélo', 'Petit électroménager', 'Livres', 'Vêtements']
  },
  louer: {
    title: 'Louer',
    description: 'Loue tes objets ou trouve ce dont tu as besoin temporairement.',
    icon: 'Calendar',
    bullets: [
      'Calendrier de disponibilité intégré',
      'Caution sécurisée (bientôt disponible)',
      'Paiement in-app obligatoire'
    ],
    examples: ['Perceuse', 'Tondeuse', 'Appareil photo', 'Remorque', 'Outils de jardin']
  },
  donner: {
    title: 'Donner',
    description: 'Donne une seconde vie à tes objets et aide tes voisins.',
    icon: 'Gift',
    bullets: [
      'Publication gratuite et simple',
      'Premier arrivé, premier servi ou tu choisis',
      'Respect et dignité avant tout'
    ],
    examples: ['Jouets', 'Meubles', 'Vêtements enfants', 'Vaisselle', 'Déco']
  }
};

export const badges = [
  {
    id: 1,
    name: 'Graine',
    image: '/assets/badges/badge_graine.png',
    color: 'badge-novice',
    description: 'Tu commences l\'aventure Yondly'
  },
  {
    id: 2,
    name: 'Pousse',
    image: '/assets/badges/badge_pousse.png',
    color: 'badge-habitue',
    description: 'Tu grandis avec ta communauté'
  },
  {
    id: 3,
    name: 'Arbre',
    image: '/assets/badges/badge_arbre.png',
    color: 'badge-expert',
    description: 'Tu es solidement ancré dans le quartier'
  },
  {
    id: 4,
    name: 'Forêt',
    image: '/assets/badges/badge_foret.png',
    color: 'badge-ambassadeur',
    description: 'Tu as un impact majeur autour de toi'
  }
];

export const impactStats = [
  {
    id: 1,
    value: '~15 kg',
    label: 'CO₂ évités en moyenne par objet réutilisé',
    icon: 'Leaf'
  },
  {
    id: 2,
    value: '80%',
    label: "d'économies vs achat neuf en moyenne",
    icon: 'TrendingDown'
  },
  {
    id: 3,
    value: '< 2 km',
    label: 'Distance moyenne entre échangeurs',
    icon: 'MapPin'
  }
];

export const testimonials = [
  {
    id: 1,
    name: 'Marie L.',
    location: 'Poitiers',
    avatar: 'M',
    content: "J'ai vidé mon garage en une semaine ! Mes voisins ont été ravis de récupérer plein de trucs. Super simple.",
    rating: 5
  },
  {
    id: 2,
    name: 'Thomas B.',
    location: 'Buxerolles',
    avatar: 'T',
    content: "J'ai loué une perceuse au lieu de l'acheter. Économie de 80€ et j'ai rencontré un voisin sympa.",
    rating: 5
  },
  {
    id: 3,
    name: 'Sophie D.',
    location: 'Saint-Benoît',
    avatar: 'S',
    content: "Le don alimentaire c'est génial. Je donne mes surplus du jardin et ça fait plaisir aux autres.",
    rating: 5
  }
];

export const faqShort = [
  {
    id: 1,
    question: "C'est payant ?",
    answer: "L'inscription et la publication d'annonces sont gratuites. Yondly prend une petite commission uniquement sur les ventes et locations réussies."
  },
  {
    id: 2,
    question: 'Comment se passent les paiements ?',
    answer: "Tous les paiements passent par l'app via Stripe Connect. C'est sécurisé et protège acheteurs comme vendeurs."
  },
  {
    id: 3,
    question: 'Et la sécurité ?',
    answer: "Profils vérifiés, système de réputation, modération active et conseils pour les remises en main propre. Ta sécurité est notre priorité."
  },
  {
    id: 4,
    question: 'Dans quelles villes ?',
    answer: "La bêta commence dans le Grand Poitiers (Poitiers, Buxerolles, Saint-Benoît...). Inscris-toi pour être prévenu quand c'est dispo chez toi !"
  },
  {
    id: 5,
    question: 'Comment je rejoins la bêta ?',
    answer: "Inscris ton email ci-dessus ! Tu recevras les liens pour iOS et Android dès que ta ville ouvre."
  }
];

export const faqFull = [
  ...faqShort,
  {
    id: 6,
    question: "Sur quels téléphones ?",
    answer: "L'application est disponible en version bêta sur iPhone (iOS) et sur tous les téléphones Android."
  },
  {
    id: 7,
    question: 'Et les tablettes ?',
    answer: "L'application est optimisée pour les téléphones (iOS et Android) pour l'instant, mais fonctionne sur tablettes."
  },
  {
    id: 8,
    question: 'Comment fonctionne la location ?',
    answer: "Tu choisis les dates disponibles, le locataire paye via l'app. Une caution sera bientôt disponible pour te protéger."
  },
  {
    id: 9,
    question: 'Puis-je annuler une transaction ?',
    answer: "Oui, selon les conditions. Les remboursements sont gérés au cas par cas pour rester équitables."
  },
  {
    id: 10,
    question: 'Comment fonctionne le don alimentaire ?',
    answer: "Tu publies ce que tu veux donner (fruits, légumes, plats...). Les voisins intéressés te contactent. Simple et humain."
  },
  {
    id: 11,

    id: 12,
    question: 'Je suis commerçant, comment ça marche ?',
    answer: "Tu peux vendre ou louer en local avec une visibilité quartier/ville. Remplis le formulaire partenaire pour en savoir plus."
  },
  {
    id: 13,
    question: 'Mes données sont-elles protégées ?',
    answer: "Oui, on respecte le RGPD. Tes données ne sont jamais vendues. Consulte notre politique de confidentialité."
  },
  {
    id: 14,
    question: 'Quels sont les frais de transaction ?',
    answer: "Les transactions utilisent Stripe Connect (frais typiques ~2,9% + 0,30€ par paiement, susceptibles d'évoluer)."
  },
  {
    id: 15,
    question: 'Comment signaler un problème ?',
    answer: "Dans l'app, tu peux signaler une annonce ou un utilisateur. Notre équipe modère activement."
  }
];

export const footerLinks = {
  product: [
    { label: 'Comment ça marche', href: '/comment-ca-marche' },
    { label: 'Fonctionnalités', href: '/fonctionnalites' },
    { label: 'Don alimentaire', href: '/don-alimentaire' },
    { label: 'Sécurité', href: '/securite' }
  ],
  partners: [
    { label: 'Pour les Pros', href: '/pros' }
  ],
  support: [
    { label: 'FAQ', href: '/faq' },
    { label: 'Contact', href: '/contact' }
  ],
  legal: [
    { label: 'Mentions légales', href: '/mentions-legales' },
    { label: 'Confidentialité', href: '/confidentialite' },
    { label: 'Cookies', href: '/cookies' }
  ]
};

export const cities = [
  'Poitiers',
  'Buxerolles',
  'Saint-Benoît',
  'Chasseneuil-du-Poitou',
  'Jaunay-Marigny',
  'Migné-Auxances',
  'Vouneuil-sous-Biard',
  'Futuroscope',
  'Autre'
];

export const securityFeatures = [
  {
    id: 1,
    icon: 'CreditCard',
    title: 'Paiement sécurisé',
    description: 'Toutes les transactions passent par Stripe Connect. Ton argent est protégé.'
  },
  {
    id: 2,
    icon: 'UserCheck',
    title: 'Profils vérifiés',
    description: 'Système de réputation et badges pour identifier les membres de confiance.'
  },
  {
    id: 3,
    icon: 'Shield',
    title: 'Modération active',
    description: 'Notre équipe surveille les annonces et traite les signalements rapidement.'
  },
  {
    id: 4,
    icon: 'MessageCircle',
    title: 'Messagerie intégrée',
    description: 'Communique sans partager tes infos personnelles avant d\'être prêt.'
  },
  {
    id: 5,
    icon: 'MapPin',
    title: 'Conseils de remise',
    description: 'On te guide pour des échanges en main propre sécurisés et sereins.'
  },
  {
    id: 6,
    icon: 'AlertTriangle',
    title: 'Signalement facile',
    description: 'Un doute ? Signale en un clic. On prend chaque alerte au sérieux.'
  }
];

export const prosBenefits = [
  {
    id: 1,
    icon: 'Store',
    title: 'Visibilité locale',
    description: 'Touche les habitants de ton quartier et ta ville directement.'
  },
  {
    id: 2,
    icon: 'Users',
    title: 'Nouveaux clients',
    description: 'Trouve des clients qui préfèrent acheter local et responsable.'
  },
  {
    id: 3,
    icon: 'Smartphone',
    title: 'Gestion simple',
    description: 'Interface intuitive pour gérer tes annonces et tes ventes.'
  },
  {
    id: 4,
    icon: 'TrendingUp',
    title: 'Zéro stock perdu',
    description: 'Écoule tes fins de série ou produits en approche de péremption.'
  }
];

export const antigaspiContent = {
  badge: 'Nouveauté à venir',
  title: 'Lutte Antigaspi :\nSauvez de bons produits',
  description: "Le gaspillage n'a pas sa place dans notre quartier. Bientôt, récupérez des paniers surprises d'invendus auprès de vos commerçants locaux à prix réduits.",
  comingSoonText: 'Bientôt disponible',
  footerQuote: "Cette fonctionnalité arrivera très prochainement sur l'application. Restez connectés !",
  features: [
    {
      title: 'Paniers Surprises',
      description: 'Des produits frais du jour à sauver de la poubelle.',
      icon: 'ShoppingBag'
    },
    {
      title: 'Prix Mini',
      description: "Faites des économies (jusqu'à -70%) tout en faisant une bonne action.",
      icon: 'PiggyBank'
    }
  ]
};
