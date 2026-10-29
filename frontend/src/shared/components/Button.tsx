import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme';

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'outline' | 'dark';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
  fullWidth = true,
}) => {
  const getContainerStyle = (pressed: boolean): ViewStyle[] => {
    const base: ViewStyle[] = [
      styles.base,
      fullWidth ? styles.fullWidth : styles.autoWidth,
      styles[variant],
    ];

    if (disabled || loading) {
      base.push(styles.disabled);
    } else if (pressed) {
      base.push(styles.pressed);
    }

    if (style) base.push(style);
    return base;
  };

  const getTextStyle = (): TextStyle[] => {
    const base: TextStyle[] = [styles.text, styles[`${variant}Text` as keyof typeof styles] as TextStyle];
    if (disabled) base.push(styles.disabledText);
    if (textStyle) base.push(textStyle);
    return base;
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => getContainerStyle(pressed)}
      android_ripple={{ color: 'rgba(255,255,255,0.1)' }}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#FFFFFF' : colors.primary} />
      ) : (
        <View style={styles.contentRow}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={getTextStyle()}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: borderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
  },
  fullWidth: {
    width: '100%',
  },
  autoWidth: {
    alignSelf: 'flex-start',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: spacing.sm,
  },
  text: {
    ...typography.bodyBold,
    fontSize: 15,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    color: colors.textMuted,
  },
  // Varyant Stilleri
  primary: {
    backgroundColor: colors.primary,
  },
  primaryText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  secondary: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryText: {
    color: colors.textPrimary,
  },
  dark: {
    backgroundColor: '#111722',
    borderWidth: 1,
    borderColor: '#1E2738',
  },
  darkText: {
    color: colors.textPrimary,
  },
  success: {
    backgroundColor: colors.success,
  },
  successText: {
    color: '#052914',
    fontWeight: '700',
  },
  danger: {
    backgroundColor: colors.danger,
  },
  dangerText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  outlineText: {
    color: colors.primary,
  },
});
