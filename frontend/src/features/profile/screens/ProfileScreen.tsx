import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Bell } from 'lucide-react-native';
import { typography, spacing, borderRadius } from '../../../shared/theme';
import { Card, Toggle } from '../../../shared/components';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { useNotifications } from '../../../context/NotificationContext';
import { UserProfileCard } from '../components/UserProfileCard';
import { SecuritySettingsCard } from '../components/SecuritySettingsCard';
import { FinancialAndAiMenuCards } from '../components/FinancialAndAiMenuCards';
import { NotificationsModal } from '../../portfolio/components/NotificationsModal';

export const ProfileScreen: React.FC = () => {
  const { logout } = useAuth();
  const { isDark, toggleTheme, colors } = useTheme();
  const { unreadCount } = useNotifications();
  const [notificationsVisible, setNotificationsVisible] = useState(false);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Üst Başlık */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Hesabım</Text>
        <Pressable
          style={[
            styles.bellButton,
            { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 },
          ]}
          onPress={() => setNotificationsVisible(true)}
          hitSlop={8}
        >
          <Bell size={20} color={colors.textPrimary} strokeWidth={2.2} />
          {unreadCount > 0 && (
            <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
          )}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Kullanıcı Profil Kartı (Ad/Soyad Düzenleme Modallı) */}
        <UserProfileCard />

        {/* Finansal İşlemler ve AI Otopilot Menü Kartları */}
        <FinancialAndAiMenuCards />

        {/* Bölüm: GÖRÜNÜM VE TEMA */}
        <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>
          GÖRÜNÜM VE TEMA
        </Text>
        <Card style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.menuRow}>
            <View>
              <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>
                Karanlık Mod (Dark Theme)
              </Text>
              <Text style={[styles.subLabelText, { color: colors.textMuted }]}>
                {isDark ? 'Karanlık tema aktif' : 'Açık tema aktif'}
              </Text>
            </View>
            <Toggle value={isDark} onValueChange={toggleTheme} />
          </View>
        </Card>

        {/* Bölüm: GÜVENLİK VE OTURUM */}
        <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>
          GÜVENLİK VE OTURUM
        </Text>
        <SecuritySettingsCard />

        {/* Çıkış Yap Butonu */}
        <Pressable
          style={[styles.logoutButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={logout}
        >
          <Text style={styles.logoutText}>Güvenli Çıkış Yap</Text>
        </Pressable>
      </ScrollView>

      {/* Bildirim Merkezi Modalı */}
      <NotificationsModal
        visible={notificationsVisible}
        onClose={() => setNotificationsVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    ...typography.h2,
  },
  bellButton: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
    top: 6,
    right: 6,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.xxl,
  },
  sectionHeader: {
    ...typography.micro,
    marginBottom: spacing.xs,
    marginLeft: 2,
  },
  menuCard: {
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  menuLabel: {
    ...typography.bodyBold,
  },
  subLabelText: {
    ...typography.micro,
    marginTop: 2,
  },
  logoutButton: {
    height: 50,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xxl,
  },
  logoutText: {
    ...typography.bodyBold,
    color: '#FF3B30',
  },
});
