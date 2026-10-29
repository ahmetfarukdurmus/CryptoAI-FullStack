import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Bell, Trash2, ShieldAlert } from 'lucide-react-native';
import { typography, spacing, borderRadius } from '../../../shared/theme';
import { useApp } from '../../../context/AppContext';
import { useTheme } from '../../../context/ThemeContext';
import { AlertDto, HoldingDto } from '../../../services/api/types';
import { HoldingItem } from '../components/HoldingItem';
import { PortfolioHeader } from '../components/PortfolioHeader';
import { PortfolioBalanceCard } from '../components/PortfolioBalanceCard';
import { LlmAnalysisCard } from '../components/LlmAnalysisCard';
import { AlertDetailActionModal } from '../components/AlertDetailActionModal';
import { CreateHoldingAlertBottomSheet } from '../components/CreateHoldingAlertBottomSheet';
import { RootStackParamList } from '../../../navigation/navigation.types';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export const PortfolioScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const {
    portfolio,
    transactions,
    alerts,
    deletePriceAlert,
    isPortfolioLoaded,
    refreshData,
  } = useApp();
  const { colors, isDark } = useTheme();

  const [selectedAlertForAction, setSelectedAlertForAction] = useState<AlertDto | null>(null);
  const [selectedHoldingForAlert, setSelectedHoldingForAlert] = useState<HoldingDto | null>(null);

  useEffect(() => {
    refreshData();
  }, []);

  // F5 yapıldığında gerçek veri API'den dönene kadar $10.000 veya sahte değerleri gösterme
  if (!isPortfolioLoaded) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <PortfolioHeader />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Skeleton Bakiye Kartı */}
          <View style={[styles.skeletonCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.skeletonHeaderRow}>
              <View style={[styles.skeletonLine, { width: 140, height: 14, backgroundColor: isDark ? '#162233' : '#E2E8F0' }]} />
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
            <View style={[styles.skeletonLine, { width: 200, height: 38, marginVertical: spacing.md, backgroundColor: isDark ? '#162233' : '#E2E8F0' }]} />
            <View style={[styles.skeletonLine, { width: 100, height: 22, backgroundColor: isDark ? '#162233' : '#E2E8F0' }]} />
            <Text style={[styles.skeletonNotice, { color: colors.textSecondary }]}>
              Portföy ve cüzdan verileri yükleniyor...
            </Text>
          </View>

          {/* Skeleton Pozisyon Başlığı */}
          <View style={[styles.sectionHeader, { marginTop: spacing.lg }]}>
            <View style={[styles.skeletonLine, { width: 160, height: 18, backgroundColor: isDark ? '#162233' : '#E2E8F0' }]} />
          </View>

          {/* Skeleton Varlık Pozisyonları */}
          {[1, 2, 3].map((i) => (
            <View
              key={i}
              style={[
                styles.skeletonHolding,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={[styles.skeletonCircle, { backgroundColor: isDark ? '#162233' : '#E2E8F0' }]} />
              <View style={{ flex: 1, gap: 6 }}>
                <View style={[styles.skeletonLine, { width: 70, height: 14, backgroundColor: isDark ? '#162233' : '#E2E8F0' }]} />
                <View style={[styles.skeletonLine, { width: 110, height: 12, backgroundColor: isDark ? '#162233' : '#E2E8F0' }]} />
              </View>
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                <View style={[styles.skeletonLine, { width: 85, height: 16, backgroundColor: isDark ? '#162233' : '#E2E8F0' }]} />
                <View style={[styles.skeletonLine, { width: 55, height: 12, backgroundColor: isDark ? '#162233' : '#E2E8F0' }]} />
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Üst Başlık ve Bildirimler */}
      <PortfolioHeader />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Toplam Bakiye Hero Kartı */}
        <PortfolioBalanceCard />

        {/* LLM Portföy Analizi Kartı (Tıklanınca Yapay Zeka Sekmesine Yönlendirir) */}
        <LlmAnalysisCard onPress={() => navigation.navigate('AiChat' as any)} />

        {/* Cüzdanımdaki Varlıklar Başlığı */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Cüzdanımdaki Varlıklar
          </Text>
          <Text style={[styles.sectionCount, { color: colors.textMuted }]}>
            {(portfolio?.holdings || []).length} Pozisyon
          </Text>
        </View>

        {/* Varlık Listesi */}
        {(portfolio?.holdings || []).map((item) => (
          <HoldingItem
            key={item.symbol}
            holding={item}
            onPress={() => {
              if (!item.isCash) {
                setSelectedHoldingForAlert(item);
              }
            }}
            onAlarmPress={() => {
              if (!item.isCash) {
                setSelectedHoldingForAlert(item);
              }
            }}
          />
        ))}

        {/* 1. Aktif Alarmlar ve Stop-Loss Listesi Bölümü */}
        <View style={[styles.sectionHeader, { marginTop: spacing.xl }]}>
          <View style={styles.sectionTitleWithIcon}>
            <Bell size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Aktif Emirler & Stop-Loss
            </Text>
          </View>
          <Text style={[styles.sectionCount, { color: colors.textMuted }]}>
            {(alerts || []).length} Emir
          </Text>
        </View>

        {(alerts || []).length > 0 ? (
          (alerts || []).map((al) => {
            const isStopLoss = al.alertType === 'STOP_LOSS' || al.condition === 'BELOW';
            const isTriggered = al.isTriggered;
            const decimals = al.targetPrice < 0.01 ? 6 : al.targetPrice < 1 ? 4 : 2;
            const formattedTarget = al.targetPrice.toLocaleString('tr-TR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: decimals,
            });
            const conditionText =
              al.condition === 'BELOW'
                ? `$${formattedTarget} altına düşerse`
                : `$${formattedTarget} üstüne çıkarsa`;

            return (
              <Pressable
                key={al.id}
                style={({ pressed }) => [
                  styles.alertCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                  pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
                ]}
                onPress={() => setSelectedAlertForAction(al)}
              >
                <View style={styles.alertLeft}>
                  <View style={styles.alertHeaderRow}>
                    <Text style={[styles.alertSymbol, { color: colors.textPrimary }]}>
                      {al.symbol} / USDT
                    </Text>

                    {/* İşlem Türü Badge */}
                    <View
                      style={[
                        styles.typeBadge,
                        {
                          backgroundColor: isStopLoss
                            ? 'rgba(255, 59, 48, 0.15)'
                            : 'rgba(0, 178, 254, 0.15)',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.typeBadgeText,
                          { color: isStopLoss ? '#FF3B30' : '#00B2FE' },
                        ]}
                      >
                        {isStopLoss ? 'STOP-LOSS' : 'FİYAT ALARMI'}
                      </Text>
                    </View>

                    {/* Durum Badge */}
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: isTriggered
                            ? 'rgba(255, 179, 0, 0.15)'
                            : 'rgba(0, 230, 118, 0.15)',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          { color: isTriggered ? '#FFB300' : '#00E676' },
                        ]}
                      >
                        {isTriggered ? 'Tetiklendi' : 'Aktif'}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.alertCondition, { color: colors.textSecondary }]}>
                    Hedef: {conditionText}
                  </Text>
                </View>

                {/* Emri İptal Et / Sil Butonu */}
                <Pressable
                  style={styles.deleteAlertBtn}
                  onPress={(e) => {
                    e.stopPropagation?.();
                    deletePriceAlert(al.id);
                  }}
                  hitSlop={8}
                >
                  <Trash2 size={18} color="#FF3B30" />
                </Pressable>
              </Pressable>
            );
          })
        ) : (
          <View
            style={[
              styles.emptyAlertBox,
              { backgroundColor: isDark ? '#0C121D' : '#F1F5F9', borderColor: colors.border },
            ]}
          >
            <Text style={[styles.emptyTxText, { color: colors.textSecondary }]}>
              Aktif bir fiyat eşiği veya stop-loss emriniz bulunmuyor.
            </Text>
            <Text style={[styles.emptyTxSubText, { color: colors.textMuted }]}>
              Piyasa sekmesinden veya AL/SAT ekranından stop-loss ve hedef kâr emri kurabilirsiniz.
            </Text>
          </View>
        )}

        {/* 2. Veritabanı İşlem Geçmişi (Transactions) Başlığı */}
        <View style={[styles.sectionHeader, { marginTop: spacing.xl }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Son İşlem Geçmişi
          </Text>
          <Text style={[styles.sectionCount, { color: colors.textMuted }]}>
            {(transactions || []).length} İşlem
          </Text>
        </View>

        {(transactions || []).length > 0 ? (
          (transactions || []).map((tx) => {
            const isBuy = tx.type === 'BUY';
            const formattedDate = tx.createdAt && !isNaN(Date.parse(tx.createdAt))
              ? new Date(tx.createdAt).toLocaleDateString('tr-TR', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Az önce';

            const formattedAmount =
              typeof tx.amount === 'number'
                ? tx.amount.toLocaleString('tr-TR', { maximumFractionDigits: 6 })
                : tx.amount;

            const formattedCost =
              typeof tx.costUsd === 'number'
                ? tx.costUsd.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : tx.costUsd;

            return (
              <View
                key={tx.id}
                style={[
                  styles.txItem,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.txLeft}>
                  <View
                    style={[
                      styles.txBadge,
                      {
                        backgroundColor: isBuy
                          ? 'rgba(0, 230, 118, 0.15)'
                          : 'rgba(255, 59, 48, 0.15)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.txBadgeText,
                        { color: isBuy ? colors.success : colors.danger },
                      ]}
                    >
                      {isBuy ? 'ALIM' : 'SATIŞ'}
                    </Text>
                  </View>
                  <View>
                    <Text style={[styles.txSymbol, { color: colors.textPrimary }]}>
                      {tx.symbol} / USDT
                    </Text>
                    <Text style={[styles.txDate, { color: colors.textMuted }]}>
                      {formattedDate}
                    </Text>
                  </View>
                </View>

                <View style={styles.txRight}>
                  <Text
                    style={[
                      styles.txAmount,
                      { color: isBuy ? colors.success : colors.textPrimary },
                    ]}
                  >
                    {isBuy ? '+' : '-'}{formattedAmount} {tx.symbol}
                  </Text>
                  <Text style={[styles.txCost, { color: colors.textSecondary }]}>
                    ${formattedCost}
                  </Text>
                </View>
              </View>
            );
          })
        ) : (
          <View
            style={[
              styles.emptyTxBox,
              { backgroundColor: isDark ? '#0C121D' : '#F1F5F9', borderColor: colors.border },
            ]}
          >
            <Text style={[styles.emptyTxText, { color: colors.textSecondary }]}>
              Henüz bir alım/satım işlemi yapmadınız.
            </Text>
            <Text style={[styles.emptyTxSubText, { color: colors.textMuted }]}>
              Piyasa sekmesinden dilediğiniz kripto parayı alıp satabilirsiniz.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Tıklanan Emir için Aksiyon ve Düzenleme Modalı */}
      <AlertDetailActionModal
        visible={selectedAlertForAction !== null}
        alert={selectedAlertForAction}
        onClose={() => setSelectedAlertForAction(null)}
      />

      {/* Cüzdandaki Varlık Üzerinden Stop-Loss / Hedef Kâr Kurma Alt Çekmecesi (Bottom Sheet) */}
      <CreateHoldingAlertBottomSheet
        visible={selectedHoldingForAlert !== null}
        holding={selectedHoldingForAlert}
        onClose={() => setSelectedHoldingForAlert(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  sectionTitleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    ...typography.h3,
  },
  sectionCount: {
    ...typography.caption,
  },
  skeletonContainer: {
    marginBottom: spacing.sm,
  },
  skeletonCard: {
    marginTop: spacing.sm,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  skeletonHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skeletonLine: {
    borderRadius: 6,
  },
  skeletonNotice: {
    ...typography.caption,
    fontSize: 12,
    marginTop: spacing.sm,
  },
  skeletonHolding: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  skeletonCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  skeletonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  skeletonText: {
    ...typography.caption,
    fontSize: 13,
  },
  alertCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  alertLeft: {
    flex: 1,
  },
  alertHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  alertSymbol: {
    fontSize: 14,
    fontWeight: '800',
  },
  typeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  alertCondition: {
    fontSize: 12,
    marginTop: 2,
  },
  deleteAlertBtn: {
    padding: spacing.xs + 2,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    marginLeft: spacing.sm,
  },
  emptyAlertBox: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  txItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  txBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  txBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  txSymbol: {
    fontSize: 14,
    fontWeight: '700',
  },
  txDate: {
    fontSize: 11,
    marginTop: 2,
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  txCost: {
    fontSize: 12,
    marginTop: 2,
  },
  emptyTxBox: {
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.sm,
  },
  emptyTxText: {
    ...typography.bodyBold,
    marginBottom: 4,
  },
  emptyTxSubText: {
    ...typography.caption,
    textAlign: 'center',
  },
});
