import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
} from 'react-native';
import { X, Star, Search, Check, Plus } from 'lucide-react-native';
import { typography, spacing, borderRadius } from '../../../shared/theme';
import { useApp } from '../../../context/AppContext';
import { useTheme } from '../../../context/ThemeContext';

interface AddWatchlistModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AddWatchlistModal: React.FC<AddWatchlistModalProps> = ({
  visible,
  onClose,
}) => {
  const { coins, toggleWatchlist } = useApp();
  const { colors, isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  if (!visible) return null;

  const filtered = coins.filter(
    (c) =>
      c.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {/* Başlık ve Kapat Butonu */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Takip Listesini Düzenle</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Listenize coin ekleyin veya çıkarın
            </Text>
          </View>
          <Pressable onPress={onClose} style={[styles.closeBtn, { backgroundColor: isDark ? '#1C2738' : '#F1F5F9' }]} hitSlop={8}>
            <X size={18} color={colors.textPrimary} />
          </Pressable>
        </View>

        {/* Arama Girişi */}
        <View style={[styles.searchBox, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
          <Search size={16} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Coin ara (BTC, SOL, AVAX...)"
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={6}>
              <X size={14} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>

        {/* Coin Listesi */}
        <ScrollView style={styles.coinList} showsVerticalScrollIndicator={false}>
          {filtered.map((coin) => (
            <View key={coin.symbol} style={[styles.coinRow, { borderBottomColor: colors.border }]}>
              <View style={styles.leftCol}>
                <View style={[styles.coinIcon, { backgroundColor: coin.color }]}>
                  <Text style={styles.iconLetter}>{coin.iconLetter}</Text>
                </View>
                <View>
                  <Text style={[styles.symbol, { color: colors.textPrimary }]}>{coin.symbol}</Text>
                  <Text style={[styles.name, { color: colors.textSecondary }]}>{coin.name}</Text>
                </View>
              </View>

              <View style={styles.rightCol}>
                <Text style={[styles.price, { color: colors.textPrimary }]}>
                  ${coin.priceUsd < 1 ? coin.priceUsd.toFixed(2) : coin.priceUsd.toLocaleString('tr-TR')}
                </Text>

                <Pressable
                  style={[
                    styles.actionBtn,
                    coin.isWatchlisted
                      ? [
                          styles.actionBtnActive,
                          {
                            backgroundColor: isDark ? 'rgba(255, 214, 0, 0.15)' : '#FEF3C7',
                            borderColor: '#F59E0B',
                          },
                        ]
                      : [
                          styles.actionBtnAdd,
                          {
                            backgroundColor: isDark ? '#00B2FE' : '#0284C7',
                            borderColor: isDark ? '#00B2FE' : '#0284C7',
                          },
                        ],
                  ]}
                  onPress={() => toggleWatchlist(coin.symbol)}
                  hitSlop={8}
                >
                  {coin.isWatchlisted ? (
                    <>
                      <Star size={13} color="#D97706" fill="#D97706" />
                      <Text style={[styles.actionBtnTextActive, { color: isDark ? '#FCD34D' : '#92400E' }]}>
                        Takipte
                      </Text>
                    </>
                  ) : (
                    <>
                      <Plus size={13} color="#FFFFFF" />
                      <Text style={styles.actionBtnTextAdd}>
                        + Ekle
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.screenPadding,
    zIndex: 99999,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  sheet: {
    width: '100%',
    maxWidth: 440,
    maxHeight: 560,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 25,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h3,
    fontSize: 18,
  },
  subtitle: {
    ...typography.caption,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBox: {
    height: 44,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.bodyMedium,
  },
  coinList: {
    maxHeight: 360,
  },
  coinRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm + 4,
    borderBottomWidth: 1,
  },
  leftCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coinIcon: {
    width: 34,
    height: 34,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  iconLetter: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  symbol: {
    ...typography.bodyBold,
    fontSize: 14,
  },
  name: {
    ...typography.caption,
    fontSize: 11,
  },
  rightCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  price: {
    ...typography.captionBold,
    fontSize: 13,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
  },
  actionBtnActive: {},
  actionBtnAdd: {},
  actionBtnTextActive: {
    ...typography.captionBold,
    fontSize: 11,
    fontWeight: '700',
  },
  actionBtnTextAdd: {
    ...typography.captionBold,
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
