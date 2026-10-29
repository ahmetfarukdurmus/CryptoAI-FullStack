import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Svg, { Path, Rect, Line } from 'react-native-svg';
import { typography, spacing, borderRadius } from '../../../shared/theme';
import { useTheme } from '../../../context/ThemeContext';
import { CoinRsiPanel } from './CoinRsiPanel';

interface CoinChartProps {
  currentPrice: string;
}

export const CoinChartSection: React.FC<CoinChartProps> = ({ currentPrice }) => {
  const { colors, isDark } = useTheme();
  const [chartType, setChartType] = useState<'LINE' | 'CANDLE'>('LINE');
  const [showRsi, setShowRsi] = useState<boolean>(true);

  // Mock OHLC verileri (Mum grafiği için)
  const mockCandles = [
    { o: 60, c: 45, h: 40, l: 65, isGreen: true },
    { o: 45, c: 55, h: 38, l: 60, isGreen: false },
    { o: 55, c: 70, h: 50, l: 75, isGreen: false },
    { o: 70, c: 48, h: 42, l: 72, isGreen: true },
    { o: 48, c: 35, h: 30, l: 52, isGreen: true },
    { o: 35, c: 22, h: 18, l: 40, isGreen: true },
    { o: 22, c: 38, h: 20, l: 45, isGreen: false },
    { o: 38, c: 50, h: 32, l: 58, isGreen: false },
    { o: 50, c: 30, h: 25, l: 55, isGreen: true },
    { o: 30, c: 18, h: 12, l: 35, isGreen: true },
  ];

  return (
    <View style={styles.container}>
      {/* Grafik Tipi & Gösterge Seçicileri */}
      <View style={styles.toolbarRow}>
        <View style={[styles.typeSwitch, { backgroundColor: isDark ? '#10151E' : '#E2E8F0' }]}>
          <Pressable
            style={[styles.switchBtn, chartType === 'LINE' && [styles.switchBtnActive, { backgroundColor: colors.card }]]}
            onPress={() => setChartType('LINE')}
          >
            <Text style={[styles.switchText, { color: chartType === 'LINE' ? colors.textPrimary : colors.textMuted }]}>
              📈 Çizgi
            </Text>
          </Pressable>
          <Pressable
            style={[styles.switchBtn, chartType === 'CANDLE' && [styles.switchBtnActive, { backgroundColor: colors.card }]]}
            onPress={() => setChartType('CANDLE')}
          >
            <Text style={[styles.switchText, { color: chartType === 'CANDLE' ? colors.textPrimary : colors.textMuted }]}>
              🕯️ Mum (OHLC)
            </Text>
          </Pressable>
        </View>

        <Pressable
          style={[
            styles.rsiToggle,
            {
              backgroundColor: showRsi ? (isDark ? 'rgba(0, 178, 254, 0.15)' : '#E0F2FE') : colors.card,
              borderColor: showRsi ? colors.primary : colors.border,
            },
          ]}
          onPress={() => setShowRsi(!showRsi)}
        >
          <Text style={[styles.rsiToggleText, { color: showRsi ? colors.primary : colors.textSecondary }]}>
            RSI (14)
          </Text>
        </Pressable>
      </View>

      {/* Ana Grafik Alanı */}
      <View style={styles.chartCanvas}>
        <View style={styles.floatingPriceBadge}>
          <Text style={styles.badgeText}>{currentPrice}</Text>
        </View>

        {chartType === 'LINE' ? (
          <Svg width="100%" height="110" viewBox="0 0 350 110">
            <Path
              d="M0,70 C40,50 70,85 110,80 C150,75 180,25 220,20 C260,15 280,75 310,70 C330,65 350,20 350,20"
              fill="none"
              stroke="#00E676"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </Svg>
        ) : (
          <Svg width="100%" height="110" viewBox="0 0 350 110">
            {mockCandles.map((c, i) => {
              const x = 15 + i * 33;
              const color = c.isGreen ? '#00E676' : '#FF3B30';
              const top = Math.min(c.o, c.c);
              const height = Math.max(Math.abs(c.c - c.o), 6);

              return (
                <React.Fragment key={i}>
                  <Line x1={x + 7} y1={c.h} x2={x + 7} y2={c.l} stroke={color} strokeWidth="1.5" />
                  <Rect x={x} y={top} width="14" height={height} rx="2" fill={color} />
                </React.Fragment>
              );
            })}
          </Svg>
        )}
      </View>

      {/* RSI(14) Osilatör Paneli */}
      {showRsi && <CoinRsiPanel value={62.4} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  toolbarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  typeSwitch: {
    flexDirection: 'row',
    borderRadius: borderRadius.md,
    padding: 3,
  },
  switchBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.sm,
  },
  switchBtnActive: {},
  switchText: {
    ...typography.captionBold,
    fontSize: 12,
  },
  rsiToggle: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  rsiToggleText: {
    ...typography.captionBold,
    fontSize: 12,
  },
  chartCanvas: {
    height: 120,
    justifyContent: 'center',
    position: 'relative',
    marginVertical: spacing.xs,
  },
  floatingPriceBadge: {
    position: 'absolute',
    right: 0,
    top: 15,
    backgroundColor: '#00E676',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    zIndex: 10,
  },
  badgeText: {
    ...typography.captionBold,
    color: '#052914',
    fontSize: 11,
  },
});
