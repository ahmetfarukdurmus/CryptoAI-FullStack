import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme';

export type BadgeVariant =
  | 'strongBuy'
  | 'buy'
  | 'neutral'
  | 'sell'
  | 'profit'
  | 'loss'
  | 'autopilot'
  | 'verified';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  icon,
  style,
  textStyle,
}) => {
  return (
    <View style={[styles.base, styles[variant], style]}>
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text style={[styles.text, styles[`${variant}Text`], textStyle]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: borderRadius.pill,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 4,
  },
  text: {
    ...typography.captionBold,
    fontSize: 11,
    letterSpacing: 0.3,
  },
  // Stiller
  strongBuy: {
    backgroundColor: '#0A2E1A',
  },
  strongBuyText: {
    color: colors.success,
  },
  buy: {
    backgroundColor: '#072414',
  },
  buyText: {
    color: colors.success,
  },
  neutral: {
    backgroundColor: colors.neutralBadge,
  },
  neutralText: {
    color: colors.textSecondary,
  },
  sell: {
    backgroundColor: '#351214',
  },
  sellText: {
    color: colors.danger,
  },
  profit: {
    backgroundColor: '#0C2D1C',
  },
  profitText: {
    color: colors.success,
  },
  loss: {
    backgroundColor: '#3A1417',
  },
  lossText: {
    color: colors.danger,
  },
  autopilot: {
    backgroundColor: 'rgba(0, 178, 254, 0.12)',
  },
  autopilotText: {
    color: colors.primary,
  },
  verified: {
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
  },
  verifiedText: {
    color: colors.success,
  },
});
