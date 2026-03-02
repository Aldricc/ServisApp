import { BlurView } from 'expo-blur';
import React from 'react';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';

interface GlassCardProps {
    children: React.ReactNode;
    style?: ViewStyle | ViewStyle[];
    intensity?: number;
    tint?: 'light' | 'dark' | 'default' | 'extraLight';
}

/**
 * GlassCard — Apple Liquid Glass style card
 * iOS: native BlurView with white overlay
 * Android: simulated with rgba white + border
 */
export const GlassCard: React.FC<GlassCardProps> = ({
    children,
    style,
    intensity = 60,
    tint = 'light',
}) => {
    if (Platform.OS === 'ios') {
        return (
            <BlurView intensity={intensity} tint={tint} style={[styles.base, style]}>
                <View style={styles.overlay}>{children}</View>
            </BlurView>
        );
    }
    // Android fallback: frosted glass simulation
    return (
        <View style={[styles.base, styles.androidGlass, style]}>
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    base: {
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.55)',
    },
    overlay: {
        backgroundColor: 'rgba(255,255,255,0.18)',
        flex: 1,
    },
    androidGlass: {
        backgroundColor: 'rgba(255,255,255,0.75)',
        borderColor: 'rgba(255,255,255,0.6)',
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 4,
    },
});
