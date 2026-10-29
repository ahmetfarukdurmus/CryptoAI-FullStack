import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Bell, Bot, TrendingUp, ShieldCheck } from 'lucide-react-native';
import { typography, spacing, borderRadius } from '../../../shared/theme';
import { useTheme } from '../../../context/ThemeContext';
import { NotificationDto, NotificationType } from '../../../services/api/types';

interface NotificationItemProps {
  item: NotificationDto;
  isNew: boolean;
  onPress: () => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  item,
  isNew,
  onPress,
}) => {
  const { colors, isDark } = useTheme();

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'AI_SIGNAL':
        return <Bot size={18} color={colors.primary} />;
      case 'AUTOPILOT_TRADE':
        return <TrendingUp size={18} color={colors.success} />;
      case 'SECURITY':
        return <ShieldCheck size={18} color="#8B5CF6" />;
      default:
        return <Bell size={18} color={colors.warning} />;
    }
  };

  return (
    <Pressable
      style={[
        styles.itemCard,
        {
          backgroundColor: isNew
            ? isDark ? '#101B2B' : '#F0F9FF'
            : isDark ? '#0D131C' : '#F8FAFC',
          borderColor: isNew
            ? isDark ? 'rgba(0, 178, 254, 0.4)' : '#BAE6FD'
            : colors.border,
        },
      ]}
      onPress={onPress}
    >
      <View style={styles.itemHeader}>
        <View style={styles.iconAndTitle}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: isDark ? '#162232' : '#E2E8F0' },
            ]}
          >
            {getNotificationIcon(item.type)}
          </View>
          <View style={styles.titleWrapper}>
            <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>
              {item.title}
            </Text>
            <Text style={[styles.itemTime, { color: colors.textMuted }]}>
              {item.time}
            </Text>
          </View>
        </View>
        {isNew && <View style={[styles.newBadgeDot, { backgroundColor: colors.primary }]} />}
      </View>
      <Text style={[styles.itemMessage, { color: colors.textSecondary }]}>
        {item.message}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  itemCard: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.xs,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  iconAndTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrapper: {
    flex: 1,
  },
  itemTitle: {
    ...typography.captionBold,
    fontSize: 13,
  },
  itemTime: {
    ...typography.micro,
    marginTop: 1,
  },
  newBadgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  itemMessage: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 17,
  },
});
