import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  Pressable,
  StyleProp,
} from 'react-native';
import { colors, spacing, borderRadius } from '../theme';
import { useTheme } from '../../context/ThemeContext';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'active' | 'subtle';
  onPress?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'default',
  onPress,
}) => {
  const { colors, isDark } = useTheme();

  const dynamicCardStyle: ViewStyle = {
    backgroundColor: variant === 'subtle' ? colors.cardSecondary : colors.card,
    borderColor: variant === 'active' ? colors.primary : colors.border,
  };

  const containerStyles = [
    styles.card,
    dynamicCardStyle,
    variant === 'active' && (isDark ? styles.activeCardDark : styles.activeCardLight),
    variant === 'subtle' && styles.subtleCard,
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          ...containerStyles,
          pressed && styles.pressed,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={containerStyles}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  activeCardDark: {
    borderColor: colors.primary,
    backgroundColor: '#0E1624',
  },
  activeCardLight: {
    borderColor: colors.primary,
    backgroundColor: '#F0F9FF',
  },
  subtleCard: {
    borderColor: 'transparent',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
});
