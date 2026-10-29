import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Search, Plus, Star } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '../../../shared/theme';
import { useApp } from '../../../context/AppContext';
import { useTheme } from '../../../context/ThemeContext';
import { CoinRowItem } from '../components/CoinRowItem';
import { AddWatchlistModal } from '../components/AddWatchlistModal';
import { RootStackParamList } from '../../../navigation/navigation.types';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export const MarketScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const { coins, toggleWatchlist } = useApp();
  const { colors, isDark } = useTheme();

  const [activeTab, setActiveTab] = useState<'all' | 'watchlist'>('all');
  const [activeFilter, setActiveFilter] = useState<'all' | 'ai' | 'popular'>('all');
  const [watchlistModalVisible, setWatchlistModalVisible] = useState(false);

  const filteredCoins = coins.filter((coin) => {
    if (activeTab === 'watchlist') {
      return coin.isWatchlisted;
    }
    if (activeFilter === 'ai') {
      return coin.aiSignal === 'GÜÇLÜ AL' || coin.aiSignal === 'AL';
    }
    if (activeFilter === 'popular') {
      return coin.symbol === 'BTC' || coin.symbol === 'ETH' || coin.symbol === 'SOL';
    }
    return true;
  });

  const watchlistedCount = coins.filter((c) => c.isWatchlisted).length;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Başlık ve Arama */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Piyasa</Text>
        <Pressable
          style={[styles.searchButton, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
          onPress={() => setWatchlistModalVisible(true)}
        >
          <Search size={20} color={colors.textSecondary} />
        </Pressable>
      </View>

      {/* Segmentli Ana Sekme (Tüm Piyasa vs Takip Listem) */}
      <View style={[styles.tabContainer, { backgroundColor: isDark ? '#10151E' : '#E2E8F0' }]}>
        <Pressable
          style={[styles.tabButton, activeTab === 'all' && [styles.tabButtonActive, { backgroundColor: colors.card }]]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && [styles.tabTextActive, { color: colors.textPrimary }]]}>
            Tüm Piyasa
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tabButton, activeTab === 'watchlist' && [styles.tabButtonActive, { backgroundColor: colors.card }]]}
          onPress={() => setActiveTab('watchlist')}
        >
          <Text style={[styles.tabText, activeTab === 'watchlist' && [styles.tabTextActive, { color: colors.textPrimary }]]}>
            ★ Takip Listem ({watchlistedCount})
          </Text>
        </Pressable>
      </View>

      {/* Alt Filtre Butonları (Yalnızca Tüm Piyasa aktifken) */}
      {activeTab === 'all' && (
        <View style={styles.filterRow}>
          <Pressable
            style={[
              styles.filterChip,
              { backgroundColor: colors.card, borderColor: colors.border },
              activeFilter === 'all' && [styles.chipActive, { backgroundColor: isDark ? '#0F1A28' : '#E0F2FE', borderColor: colors.primary }],
            ]}
            onPress={() => setActiveFilter('all')}
          >
            <Text style={[styles.chipText, { color: activeFilter === 'all' ? colors.primary : colors.textSecondary }]}>
              Tümü
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.filterChip,
              { backgroundColor: colors.card, borderColor: colors.border },
              activeFilter === 'ai' && [styles.chipActive, { backgroundColor: isDark ? '#0F1A28' : '#E0F2FE', borderColor: colors.primary }],
            ]}
            onPress={() => setActiveFilter('ai')}
          >
            <Text style={[styles.chipText, { color: activeFilter === 'ai' ? colors.primary : colors.textSecondary }]}>
              🟢🤖 AI Sinyalleri
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.filterChip,
              { backgroundColor: colors.card, borderColor: colors.border },
              activeFilter === 'popular' && [styles.chipActive, { backgroundColor: isDark ? '#0F1A28' : '#E0F2FE', borderColor: colors.primary }],
            ]}
            onPress={() => setActiveFilter('popular')}
          >
            <Text style={[styles.chipText, { color: activeFilter === 'popular' ? colors.primary : colors.textSecondary }]}>
              🔥 Popüler
            </Text>
          </Pressable>
        </View>
      )}

      {/* Tablo Sütun Başlıkları */}
      <View style={[styles.tableHeaderRow, { borderBottomColor: colors.border }]}>
        <Text style={[styles.columnHeader, { flex: 2, color: colors.textMuted }]}>
          {activeTab === 'watchlist' ? 'TAKİP EDİLEN VARLIK' : 'VARLIK'}
        </Text>
        <Text style={[styles.columnHeader, { flex: 1.3, textAlign: 'center', color: colors.textMuted }]}>
          AI SİNYALİ
        </Text>
        <Text style={[styles.columnHeader, { flex: 1.6, textAlign: 'right', color: colors.textMuted }]}>
          FİYAT
        </Text>
        <Text style={[styles.columnHeader, { width: 72, textAlign: 'center', color: colors.textMuted }]}>
          TAKİP
        </Text>
      </View>

      {/* Coin Listesi */}
      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredCoins.length > 0 ? (
          filteredCoins.map((coin) => (
            <CoinRowItem
              key={coin.symbol}
              coin={coin}
              showWatchlistAction={true}
              onToggleWatchlist={toggleWatchlist}
              onPress={() => navigation.navigate('CoinDetail', { symbol: coin.symbol })}
            />
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Star size={36} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Takip Listeniz Boş</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Aşağıdaki butona dokunarak takip etmek istediğiniz coinleri listenize ekleyebilirsiniz.
            </Text>
          </View>
        )}

        {/* Takip Listesi Ekleme / Düzenleme Butonu */}
        {activeTab === 'watchlist' && (
          <Pressable
            style={[styles.addWatchlistButton, { borderColor: colors.border, backgroundColor: colors.card }]}
            onPress={() => setWatchlistModalVisible(true)}
          >
            <Plus size={16} color={colors.primary} />
            <Text style={[styles.addWatchlistText, { color: colors.primary }]}>
              + Takip Listesine Yeni Coin Ekle
            </Text>
          </Pressable>
        )}
      </ScrollView>

      {/* Takip Listesi Modal */}
      <AddWatchlistModal
        visible={watchlistModalVisible}
        onClose={() => setWatchlistModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    marginBottom: spacing.md,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  searchButton: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.full,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#10151E',
    borderRadius: borderRadius.md,
    padding: 4,
    marginHorizontal: spacing.screenPadding,
    marginBottom: spacing.md,
  },
  tabButton: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    borderRadius: borderRadius.sm + 2,
  },
  tabButtonActive: {
    backgroundColor: colors.card,
  },
  tabText: {
    ...typography.bodyBold,
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.textPrimary,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.screenPadding,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: '#0F1A28',
  },
  chipText: {
    ...typography.captionBold,
    color: colors.textSecondary,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#141C28',
  },
  columnHeader: {
    ...typography.micro,
    color: colors.textMuted,
  },
  listContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.xxl,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    ...typography.bodyBold,
    fontSize: 16,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    ...typography.caption,
    textAlign: 'center',
    lineHeight: 18,
  },
  addWatchlistButton: {
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#243044',
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  addWatchlistText: {
    ...typography.bodyBold,
    color: colors.textSecondary,
  },
});
