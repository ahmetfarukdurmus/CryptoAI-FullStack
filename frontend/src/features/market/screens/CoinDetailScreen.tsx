import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Plus } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '../../../shared/theme';
import { Header, Card } from '../../../shared/components';
import { useApp } from '../../../context/AppContext';
import { useTheme } from '../../../context/ThemeContext';
import { CoinChartSection } from '../components/CoinChartSection';
import { QuickTradeModal } from '../components/QuickTradeModal';
import { RootStackParamList } from '../../../navigation/navigation.types';

type DetailRouteProp = RouteProp<RootStackParamList, 'CoinDetail'>;
type DetailNavProp = NativeStackNavigationProp<RootStackParamList>;

export const CoinDetailScreen: React.FC = () => {
  const navigation = useNavigation<DetailNavProp>();
  const route = useRoute<DetailRouteProp>();
  const { coins } = useApp();
  const { colors, isDark } = useTheme();

  const symbol = route.params?.symbol || 'BTC';
  const coin = coins.find((c) => c.symbol === symbol) || coins[0];

  const priceVal = coin.lastPrice !== undefined ? coin.lastPrice : coin.priceUsd;
  const changeVal = coin.priceChangePercent !== undefined ? coin.priceChangePercent : coin.change24h;
  const highVal = coin.highPrice !== undefined ? coin.highPrice : coin.high24h;
  const lowVal = coin.lowPrice !== undefined ? coin.lowPrice : coin.low24h;
  const volVal = coin.volume !== undefined ? coin.volume : coin.volumeBtc;
  const isPositive = (changeVal || 0) >= 0;

  // Anlık kur değişiminde yukarı/aşağı yanıp sönme
  const prevPriceRef = React.useRef<number>(priceVal);
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);

  React.useEffect(() => {
    if (prevPriceRef.current !== undefined && priceVal !== prevPriceRef.current) {
      if (priceVal > prevPriceRef.current) {
        setFlash('up');
      } else if (priceVal < prevPriceRef.current) {
        setFlash('down');
      }
      prevPriceRef.current = priceVal;
      const timer = setTimeout(() => setFlash(null), 1200);
      return () => clearTimeout(timer);
    }
  }, [priceVal]);

  const [timeframe, setTimeframe] = useState<'1S' | '24S' | '1H' | '1A' | 'YTD'>('24S');
  const [tradeModalVisible, setTradeModalVisible] = useState(false);
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');

  const handleOpenTrade = (type: 'BUY' | 'SELL') => {
    setTradeType(type);
    setTradeModalVisible(true);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Header
        showBack
        onBackPress={() => navigation.goBack()}
        titleComponent={
          <View style={styles.headerTitleRow}>
            <View style={[styles.coinCircle, { backgroundColor: coin.color }]}>
              <Text style={styles.coinCircleText}>{coin.iconLetter}</Text>
            </View>
            <Text style={[styles.headerTitleText, { color: colors.textPrimary }]}>
              {coin.name} ({coin.symbol})
            </Text>
          </View>
        }
        rightAction={
          <Pressable
            style={[styles.addAlarmButton, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
            onPress={() => navigation.navigate('NewAlarm', { symbol: coin.symbol })}
          >
            <Plus size={20} color={colors.textPrimary} />
          </Pressable>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={[
            styles.heroPrice,
            { color: colors.textPrimary },
            flash === 'up' && { color: colors.success },
            flash === 'down' && { color: colors.danger },
          ]}
        >
          ${priceVal < 1
            ? priceVal.toFixed(4)
            : priceVal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>

        <View style={styles.changeRow}>
          <View
            style={[
              styles.pctBadge,
              { backgroundColor: isPositive ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255, 59, 48, 0.15)' },
            ]}
          >
            <Text style={[styles.pctText, { color: isPositive ? colors.success : colors.danger }]}>
              {isPositive ? `+${changeVal.toFixed(2)}%` : `${changeVal.toFixed(2)}%`}
            </Text>
          </View>
          <Text style={[styles.diffText, { color: isPositive ? colors.success : colors.danger }]}>
            {isPositive ? '+' : ''}${((priceVal * (changeVal || 0)) / 100).toFixed(2)}
          </Text>
          <Text style={[styles.periodText, { color: colors.textMuted }]}>24 Saat</Text>
        </View>

        <CoinChartSection currentPrice={priceVal > 1000 ? priceVal.toFixed(0) : priceVal.toFixed(2)} />

        <View style={[styles.timeframeRow, { backgroundColor: isDark ? '#10151E' : '#E2E8F0' }]}>
          {(['1S', '24S', '1H', '1A', 'YTD'] as const).map((tf) => (
            <Pressable
              key={tf}
              style={[styles.tfButton, timeframe === tf && [styles.tfButtonActive, { backgroundColor: colors.card }]]}
              onPress={() => setTimeframe(tf)}
            >
              <Text style={[styles.tfText, timeframe === tf ? { color: colors.textPrimary } : { color: colors.textMuted }]}>
                {tf}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>24s Yüksek</Text>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>${highVal.toLocaleString('tr-TR')}</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>24s Düşük</Text>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>${lowVal.toLocaleString('tr-TR')}</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Hacim ({coin.symbol})</Text>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{volVal}</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Teknik: RSI(14)</Text>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {coin.rsi} (Nötr-AI)
            </Text>
          </Card>
        </View>

        <Card variant="active" style={styles.aiEngineCard}>
          <View style={styles.aiHeader}>
            <Text style={[styles.aiTitle, { color: colors.primary }]}>AI Karar Motoru (LSTM+XGBoost)</Text>
            <Text style={styles.aiConfidence}>%{coin.aiConfidencePercent} Güven</Text>
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressBar, { width: `${coin.aiConfidencePercent}%` }]} />
          </View>

          <Text style={[styles.aiRationale, { color: isDark ? '#AFC1D6' : '#475569' }]}>
            {coin.aiAnalysisText}
          </Text>
        </Card>
      </ScrollView>

      {/* Alt Sabit AL / SAT Buton Çubuğu (Figma Frame-4) */}
      <View style={[styles.bottomBar, { backgroundColor: isDark ? '#090D14' : colors.card, borderTopColor: colors.border }]}>
        <Pressable
          style={[styles.tradeBtn, styles.satBtn]}
          onPress={() => handleOpenTrade('SELL')}
        >
          <Text style={styles.satBtnText}>SAT</Text>
        </Pressable>
        <Pressable
          style={[styles.tradeBtn, styles.alBtn]}
          onPress={() => handleOpenTrade('BUY')}
        >
          <Text style={styles.alBtnText}>AL</Text>
        </Pressable>
      </View>

      <QuickTradeModal
        visible={tradeModalVisible}
        onClose={() => setTradeModalVisible(false)}
        coin={coin}
        tradeType={tradeType}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  coinCircle: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinCircleText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  headerTitleText: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  addAlarmButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: 120,
  },
  heroPrice: {
    ...typography.heroPrice,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  pctBadge: {
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  pctText: {
    ...typography.captionBold,
    color: colors.success,
  },
  diffText: {
    ...typography.captionBold,
    color: colors.success,
  },
  periodText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  timeframeRow: {
    flexDirection: 'row',
    backgroundColor: '#10151E',
    borderRadius: borderRadius.md,
    padding: 3,
    marginBottom: spacing.lg,
  },
  tfButton: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  tfButtonActive: {
    backgroundColor: colors.card,
  },
  tfText: {
    ...typography.captionBold,
    color: colors.textMuted,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  statCard: {
    width: '47.5%',
    marginBottom: 0,
    padding: spacing.md,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    fontSize: 15,
  },
  aiEngineCard: {
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  aiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  aiTitle: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  aiConfidence: {
    ...typography.captionBold,
    color: colors.success,
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#192434',
    borderRadius: 3,
    overflow: 'hidden',
    marginVertical: spacing.sm,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 3,
  },
  aiRationale: {
    ...typography.body,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.md,
    paddingBottom: 22,
    flexDirection: 'row',
    gap: spacing.md,
    zIndex: 100,
    elevation: 20,
  },
  tradeBtn: {
    flex: 1,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  satBtn: {
    backgroundColor: colors.danger,
  },
  satBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  alBtn: {
    backgroundColor: colors.success,
  },
  alBtnText: {
    color: '#062816',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
