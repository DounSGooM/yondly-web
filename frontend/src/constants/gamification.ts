export const LEVEL_CONFIG = {
    Novice: {
        label: 'Novice',
        title: 'Nouveau voisin',
        description: 'Découverte & première expérience',
        color: '#81c784',
        icon: 'leaf',
        minPoints: 0,
        features: ['Personnalisation basique du profil', 'Récap d\'impact'],
    },
    Habitué: {
        label: 'Habitué',
        title: 'Habitué du quartier',
        description: 'Régularité récompensée',
        color: '#4fc3f7',
        icon: 'star',
        minPoints: 500,
        features: ['50 favoris', 'Alertes Recherches', 'Stats détaillées'],
    },
    Expert: {
        label: 'Expert',
        title: 'Expert Yondly',
        description: 'Pilier de la communauté',
        color: '#ffb74d',
        icon: 'trophy',
        minPoints: 2500,
        features: ['-10% Frais Service', 'Boosts automatiques', 'Pages Inspirations'],
    },
    Ambassadeur: {
        label: 'Ambassadeur',
        title: 'Ambassadeur',
        description: 'Fait grandir Yondly',
        color: '#9c27b0',
        icon: 'ribbon',
        minPoints: 10000,
        features: ['-20% Frais Service', 'Badge Vérifié', 'Bêtas & coulisses'],
    },
};

export const getLevelConfig = (level: string) => {
    return LEVEL_CONFIG[level as keyof typeof LEVEL_CONFIG] || LEVEL_CONFIG.Novice;
};

export const getNextLevel = (currentLevel: string) => {
    const levels = Object.keys(LEVEL_CONFIG);
    const index = levels.indexOf(currentLevel);
    return index < levels.length - 1 ? levels[index + 1] : null;
};
