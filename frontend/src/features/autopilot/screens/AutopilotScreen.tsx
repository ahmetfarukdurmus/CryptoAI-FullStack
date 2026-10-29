import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Plus, ChevronRight } from 'lucide-react-native';
import { typography, spacing, borderRadius } from '../../../shared/theme';
import { Card } from '../../../shared/components';
import { RootStackParamList } from '../../../navigation/navigation.types';
import { AutopilotConfigCard } from '../components/AutopilotConfigCard';
import { AutopilotBacktestCard } from '../components/AutopilotBacktestCard';
import { AutopilotStatusHeader } from '../components/AutopilotStatusHeader';
import { AutopilotLogsList } from '../components/AutopilotLogsList';
import { useTheme } from '../../../context/ThemeContext';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export const AutopilotScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>AI Otopilot</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Otopilot Durum ve 24s Performans Başlığı */}
        <AutopilotStatusHeader />

        {/* Otopilot Özelleştirme ve Strateji Ayarları */}
        <AutopilotConfigCard />

        {/* Geçmiş Strateji Simülasyonu (Backtest) */}
        <AutopilotBacktestCard />

        {/* Son AI İşlemleri (LOG) */}
        <AutopilotLogsList />

        {/* Otopilot Stratejisi Ekle Butonu */}
        <Card
          style={styles.addStrategyCard}
          onPress={() => navigation.navigate('NewAlarm', { symbol: 'ETH' })}
        >
          <View style={styles.addStrategyRow}>
            <View style={[styles.plusCircle, { backgroundColor: isDark ? '#1E293B' : '#E2E8F0' }]}>
              <Plus size={16} color={colors.primary} />
            </View>
            <Text style={[styles.addStrategyText, { color: colors.textPrimary }]}>
              Otopilot Stratejisi Ekle
            </Text>
          </View>
          <ChevronRight size={18} color={colors.textSecondary} />
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    ...typography.h2,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.xxl,
  },
  addStrategyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    marginTop: spacing.md,
  },
  addStrategyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  plusCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addStrategyText: {
    ...typography.bodyBold,
  },
});
