import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Check, Edit3 } from 'lucide-react-native';
import { typography, spacing, borderRadius } from '../../../shared/theme';
import { Card } from '../../../shared/components';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { EditProfileModal } from './EditProfileModal';

export const UserProfileCard: React.FC = () => {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user?.firstName ? user.firstName[0].toUpperCase() : 'U';
  };

  const fullName = user
    ? `${user.firstName} ${user.lastName}`
    : 'Kullanıcı';

  return (
    <>
      <Card style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.profileRow}>
          <View
            style={[
              styles.avatarCircle,
              { backgroundColor: isDark ? '#1C2738' : '#E0F2FE' },
            ]}
          >
            <Text style={[styles.avatarText, { color: colors.primary }]}>
              {getInitials()}
            </Text>
          </View>

          <View style={styles.profileInfo}>
            <Text style={[styles.nameText, { color: colors.textPrimary }]}>
              {fullName}
            </Text>
            <Text style={[styles.uidText, { color: colors.textSecondary }]}>
              UID: {user?.uid || '—'}
            </Text>

            <View style={styles.verifiedBadge}>
              <Check size={12} color={colors.success} />
              <Text style={[styles.verifiedText, { color: colors.success }]}>
                E-posta Doğrulandı
              </Text>
            </View>
          </View>

          <Pressable
            style={[
              styles.editButton,
              {
                backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                borderColor: colors.border,
              },
            ]}
            onPress={() => setModalVisible(true)}
            hitSlop={8}
          >
            <Edit3 size={14} color={colors.primary} />
            <Text style={[styles.editText, { color: colors.primary }]}>
              Düzenle
            </Text>
          </Pressable>
        </View>
      </Card>

      <EditProfileModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  profileCard: {
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    ...typography.h3,
    fontWeight: '800',
  },
  profileInfo: {
    flex: 1,
  },
  nameText: {
    ...typography.bodyBold,
    fontSize: 16,
    marginBottom: 2,
  },
  uidText: {
    ...typography.caption,
    marginBottom: 4,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    ...typography.micro,
    fontWeight: '600',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
  },
  editText: {
    ...typography.captionBold,
    fontSize: 12,
  },
});
