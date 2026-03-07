import React, { useState } from 'react';
import { View, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { getLevelFromCO2, LEVEL_THRESHOLDS } from '../utils/levelBadges';
import LevelRestrictionModal from './LevelRestrictionModal';

interface LevelRestrictedActionProps {
    requiredLevel: keyof typeof LEVEL_THRESHOLDS;
    onPress: () => void;
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    disabled?: boolean;
}

export default function LevelRestrictedAction({
    requiredLevel,
    onPress,
    children,
    style,
    disabled = false,
}: LevelRestrictedActionProps) {
    const { user } = useAuthStore();
    const [showModal, setShowModal] = useState(false);

    // Default to 0 if user is not loaded
    const currentCO2 = user?.co2_saved || 0;
    const currentLevelBadge = getLevelFromCO2(currentCO2);
    const requiredCO2 = LEVEL_THRESHOLDS[requiredLevel] || 0;

    const hasRequiredLevel = currentCO2 >= requiredCO2;

    const handlePress = () => {
        if (disabled) return;

        if (hasRequiredLevel) {
            onPress();
        } else {
            setShowModal(true);
        }
    };

    return (
        <>
            <TouchableOpacity
                onPress={handlePress}
                style={style}
                activeOpacity={0.8}
                disabled={disabled}
            >
                {children}
            </TouchableOpacity>

            <LevelRestrictionModal
                visible={showModal}
                onClose={() => setShowModal(false)}
                requiredLevel={requiredLevel}
                currentCO2={currentCO2}
            />
        </>
    );
}
