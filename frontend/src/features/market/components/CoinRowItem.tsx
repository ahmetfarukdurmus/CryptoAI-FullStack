import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Bell, Star, Plus } from 'lucide-react-native';
import { CoinMarketDto } from '../../../services/api/types';
import { typography, spacing, borderRadius } from '../../../shared/theme';
import { Badge, BadgeVariant } from '../../../shared/components/Badge';
import { useTheme } from '../../../context/ThemeContext';

interface CoinRowItemProps {
  coin: CoinMarketDto;
  onPress: () => void;
  onToggleWatchlist?: (symbol: string) => void;
  showWatchlistAction?: boolean;
}

export const CoinRowItem: React.FC<CoinRowItemProps> = ({
  coin,
  onPress,
  onToggleWatchlist,
  showWatchlistAction = true,
}) => {
  const { colors, isDark } = useTheme();
  const priceVal = coin.lastPrice !== undefined ? coin.lastPrice : coin.priceUsd;
  const changeVal = coin.priceChangePercent !== undefined ? coin.priceChangePercent : coin.change24h;
  const isPositive = (changeVal || 0) >= 0;

  // Canlı fiyat değişiminde yeşil/kırmızı yanıp sönme efekti
  const prevPriceRef = React.useRef<number>(priceVal);
  const [flash, setFlash] = React.useState<'up' | 'down' | null>(null);

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

  const getSignalVariant = (signal: string): BadgeVariant => {
    switch (signal) {
      case 'GÜÇLÜ AL':
        return 'strongBuy';
      case 'AL':
        return 'buy';
      case 'SAT':
        return 'sell';
      default:
        return 'neutral';
    }
  };

  const handleToggleWatchlist = (e: any) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    if (onToggleWatchlist) {
      onToggleWatchlist(coin.symbol);
    }
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: colors.border },
        pressed && styles.pressed,
      ]}
    >
      {/* Varlık İkon ve Bilgisi */}
      <View style={styles.assetCol}>
        <View style={[styles.coinIcon, { backgroundColor: coin.color }]}>
          <Text style={styles.coinIconText}>{coin.iconLetter}</Text>
        </View>
        <View style={styles.coinInfo}>
          <Text style={[styles.symbol, { color: colors.textPrimary }]}>{coin.symbol}</Text>
          <Text style={[styles.name, { color: colors.textSecondary }]}>{coin.name}</Text>
        </View>
      </View>

      {/* AI Sinyali */}
      <View style={styles.signalCol}>
        <Badge
          label={coin.aiSignal}
          variant={getSignalVariant(coin.aiSignal)}
        />
      </View>

      {/* Fiyat ve Değişim */}
      <View style={styles.priceCol}>
        <View style={styles.priceHeaderRow}>
          {coin.hasAlarm && (
            <View style={styles.alarmBadge}>
              <Bell size={10} color={colors.primary} />
            </View>
          )}
          <Text
            style={[
              styles.price,
              { color: colors.textPrimary },
              flash === 'up' && { color: colors.success, backgroundColor: 'rgba(0, 230, 118, 0.18)', borderRadius: 4, paddingHorizontal: 3 },
              flash === 'down' && { color: colors.danger, backgroundColor: 'rgba(255, 59, 48, 0.18)', borderRadius: 4, paddingHorizontal: 3 },
            ]}
          >
            ${priceVal < 1
              ? priceVal.toFixed(4)
              : priceVal.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}
          </Text>
        </View>

        <Text
          style={[
            styles.change,
            isPositive ? styles.textPositive : styles.textNegative,
          ]}
        >
          {isPositive ? `+${changeVal.toFixed(2)}%` : `${changeVal.toFixed(2)}%`}
        </Text>
      </View>

      {/* Açık ve Net Takip Butonu */}
      {showWatchlistAction && (
        <Pressable
          style={[
            styles.watchlistPill,
            coin.isWatchlisted
              ? [
                  styles.watchlistPillActive,
                  {
                    backgroundColor: isDark ? 'rgba(255, 214, 0, 0.15)' : '#FEF3C7',
                    borderColor: '#F59E0B',
                  },
                ]
              : [
                  styles.watchlistPillInactive,
                  {
                    backgroundColor: isDark ? '#111722' : '#F1F5F9',
                    borderColor: colors.border,
                  },
                ],
          ]}
          onPress={handleToggleWatchlist}
          hitSlop={8}
        >
          <Star
            size={12}
            color={coin.isWatchlisted ? '#D97706' : colors.textMuted}
            fill={coin.isWatchlisted ? '#D97706' : 'transparent'}
          />
          <Text
            style={[
              styles.watchlistPillText,
              {
                color: coin.isWatchlisted
                  ? (isDark ? '#FCD34D' : '#92400E')
                  : colors.textMuted,
              },
            ]}
          >
            {coin.isWatchlisted ? 'Takipte' : '+Takip'}
          </Text>
        </Pressable>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  pressed: {
    opacity: 0.8,
  },
  assetCol: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  coinIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  coinIconText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  coinInfo: {
    justifyContent: 'center',
  },
  symbol: {
    ...typography.bodyBold,
    fontSize: 14,
  },
  name: {
    ...typography.caption,
    fontSize: 11,
  },
  signalCol: {
    flex: 1.3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceCol: {
    flex: 1.6,
    alignItems: 'flex-end',
  },
  priceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alarmBadge: {
    marginRight: 4,
  },
  price: {
    ...typography.bodyBold,
    fontSize: 14,
  },
  change: {
    ...typography.captionBold,
    fontSize: 11,
    marginTop: 2,
  },
  textPositive: {
    color: '#00E676',
  },
  textNegative: {
    color: '#FF3B30',
  },
  watchlistPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    marginLeft: 8,
  },
  watchlistPillActive: {},
  watchlistPillInactive: {},
  watchlistPillText: {
    ...typography.captionBold,
    fontSize: 10,
    fontWeight: '700',
  },
});
