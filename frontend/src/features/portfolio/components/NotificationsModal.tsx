import React from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, Pressable } from 'react-native';
import { Bell, X, CheckCheck } from 'lucide-react-native';
import { typography, spacing, borderRadius } from '../../../shared/theme';
import { useTheme } from '../../../context/ThemeContext';
import { useNotifications } from '../../../context/NotificationContext';
import { NotificationItem } from './NotificationItem';

interface NotificationsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  visible,
  onClose,
}) => {
  const { colors, isDark } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const newNotifications = notifications.filter((n) => !n.isRead);
  const previousNotifications = notifications.filter((n) => n.isRead);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[
            styles.modalContent,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Başlık ve Butonlar */}
          <View style={styles.headerRow}>
            <View style={styles.titleRow}>
              <Bell size={20} color={colors.primary} />
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                Bildirimler
              </Text>
              {unreadCount > 0 && (
                <View style={[styles.countBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.countText}>{unreadCount} Yeni</Text>
                </View>
              )}
            </View>

            <Pressable
              onPress={onClose}
              hitSlop={8}
              style={[styles.closeBtn, { backgroundColor: isDark ? '#1C2738' : '#F1F5F9' }]}
            >
              <X size={16} color={colors.textSecondary} />
            </Pressable>
          </View>

          {unreadCount > 0 && (
            <Pressable style={styles.markAllBtn} onPress={markAllAsRead}>
              <CheckCheck size={14} color={colors.primary} />
              <Text style={[styles.markAllText, { color: colors.primary }]}>
                Tümünü Okundu İşaretle
              </Text>
            </Pressable>
          )}

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Yeni Bildirimler Bölümü */}
            {newNotifications.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.primary }]}>
                  YENİ BİLDİRİMLER ({newNotifications.length})
                </Text>
                {newNotifications.map((item) => (
                  <NotificationItem
                    key={item.id}
                    item={item}
                    isNew={true}
                    onPress={() => markAsRead(item.id)}
                  />
                ))}
              </View>
            )}

            {/* Önceki Bildirimler Bölümü */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
                ÖNCEKİ BİLDİRİMLER ({previousNotifications.length})
              </Text>
              {previousNotifications.map((item) => (
                <NotificationItem
                  key={item.id}
                  item={item}
                  isNew={false}
                  onPress={() => markAsRead(item.id)}
                />
              ))}
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    maxWidth: 430,
    maxHeight: '82%',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  modalTitle: {
    ...typography.h3,
    fontSize: 18,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.pill,
    marginLeft: 4,
  },
  countText: {
    ...typography.micro,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-end',
    marginBottom: spacing.sm,
  },
  markAllText: {
    ...typography.captionBold,
    fontSize: 12,
  },
  scrollArea: {
    maxHeight: 460,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.micro,
    marginBottom: spacing.xs,
    fontWeight: '700',
  },
});
