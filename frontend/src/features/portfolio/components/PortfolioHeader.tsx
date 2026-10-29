import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Bell } from 'lucide-react-native';
import { typography, spacing, borderRadius } from '../../../shared/theme';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import { useNotifications } from '../../../context/NotificationContext';
import { RootStackParamList } from '../../../navigation/navigation.types';
import { NotificationsModal } from './NotificationsModal';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export const PortfolioHeader: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const [modalVisible, setModalVisible] = useState(false);

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return 'BG';
  };

  return (
    <>
      <View style={styles.header}>
        {/* Kullanıcı Avatarı - Tıklanınca Profile Geçiş */}
        <Pressable
          style={[
            styles.avatar,
            {
              backgroundColor: isDark ? '#1E293B' : '#E0F2FE',
              borderColor: isDark ? '#2D3B4E' : '#BAE6FD',
            },
          ]}
          onPress={() => navigation.navigate('Main', { screen: 'Profile' })}
          hitSlop={8}
        >
          <Text style={[styles.avatarText, { color: colors.primary }]}>
            {getInitials()}
          </Text>
        </Pressable>

        {/* Marka Başlığı */}
        <View style={styles.brandRow}>
          <Text style={[styles.brandTitle, { color: colors.textPrimary }]}>Crypto</Text>
          <Text style={[styles.brandCyan, { color: colors.primary }]}>AI</Text>
        </View>

        {/* Bildirim Merkezi Butonu */}
        <Pressable
          style={[
            styles.bellButton,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
          onPress={() => setModalVisible(true)}
          hitSlop={8}
        >
          <Bell size={20} color={colors.textPrimary} strokeWidth={2.2} />
          {unreadCount > 0 && (
            <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
          )}
        </Pressable>
      </View>

      <NotificationsModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPadding,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...typography.captionBold,
    fontSize: 13,
    fontWeight: '800',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitle: {
    ...typography.h3,
  },
  brandCyan: {
    ...typography.h3,
    fontWeight: '900',
  },
  bellButton: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.full,
    borderWidth: 1,
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
});
