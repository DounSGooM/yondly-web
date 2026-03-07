import React from 'react';
import { View, StyleSheet, Image, ViewStyle } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

// Import the logo - Loop logo
const LoopLogo = require('../../assets/images/loop-logo.png');

interface StyledQRCodeProps {
    value: string;
    size?: number;
    logo?: any; // Custom logo override
    logoSize?: number;
    color?: string; // QR code color (data modules)
    cornerColor?: string; // Color for corner squares (finder patterns)
    backgroundColor?: string;
    showLogo?: boolean;
    style?: ViewStyle;
}

/**
 * Styled QR Code component with:
 * - Center logo (Yondly by default)
 * - Custom colors
 * - 3D shadow effects
 * - Rounded container
 */
export default function StyledQRCode({
    value,
    size = 200,
    logo,
    logoSize,
    color = '#1A1A1A',
    cornerColor = '#4C7B4B', // Yondly green for corners
    backgroundColor = '#FFFFFF',
    showLogo = true,
    style,
}: StyledQRCodeProps) {
    // Calculate logo size (default ~25% of QR size for good scanability)
    const calculatedLogoSize = logoSize || Math.round(size * 0.25);
    const logoMargin = Math.round(calculatedLogoSize * 0.1);

    return (
        <View style={[styles.container, style]}>
            {/* Outer shadow layer */}
            <View style={[styles.shadowOuter, { width: size + 40, height: size + 40 }]}>
                {/* Inner shadow layer */}
                <View style={[styles.shadowInner, { width: size + 24, height: size + 24 }]}>
                    {/* QR Code container */}
                    <View style={[styles.qrContainer, { width: size + 16, height: size + 16, backgroundColor }]}>
                        <QRCode
                            value={value}
                            size={size}
                            color={color}
                            backgroundColor={backgroundColor}
                            logo={showLogo ? (logo || LoopLogo) : undefined}
                            logoSize={calculatedLogoSize}
                            logoBackgroundColor={backgroundColor}
                            logoMargin={logoMargin}
                            logoBorderRadius={calculatedLogoSize / 4}
                            // Enable better error correction for logo overlay
                            ecl="M"
                        />
                    </View>
                </View>
            </View>

            {/* Decorative corner accents */}
            <View style={[styles.cornerTopLeft, { borderColor: cornerColor }]} />
            <View style={[styles.cornerTopRight, { borderColor: cornerColor }]} />
            <View style={[styles.cornerBottomLeft, { borderColor: cornerColor }]} />
            <View style={[styles.cornerBottomRight, { borderColor: cornerColor }]} />
        </View>
    );
}

const CORNER_SIZE = 24;
const CORNER_THICKNESS = 4;

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    shadowOuter: {
        borderRadius: 20,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 8, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    shadowInner: {
        borderRadius: 16,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    qrContainer: {
        borderRadius: 12,
        padding: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Corner decorations
    cornerTopLeft: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: CORNER_SIZE,
        height: CORNER_SIZE,
        borderTopWidth: CORNER_THICKNESS,
        borderLeftWidth: CORNER_THICKNESS,
        borderTopLeftRadius: 8,
    },
    cornerTopRight: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: CORNER_SIZE,
        height: CORNER_SIZE,
        borderTopWidth: CORNER_THICKNESS,
        borderRightWidth: CORNER_THICKNESS,
        borderTopRightRadius: 8,
    },
    cornerBottomLeft: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: CORNER_SIZE,
        height: CORNER_SIZE,
        borderBottomWidth: CORNER_THICKNESS,
        borderLeftWidth: CORNER_THICKNESS,
        borderBottomLeftRadius: 8,
    },
    cornerBottomRight: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: CORNER_SIZE,
        height: CORNER_SIZE,
        borderBottomWidth: CORNER_THICKNESS,
        borderRightWidth: CORNER_THICKNESS,
        borderBottomRightRadius: 8,
    },
});
