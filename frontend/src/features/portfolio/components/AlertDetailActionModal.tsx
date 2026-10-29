import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import {
  X,
  Trash2,
  Edit3,
  TrendingDown,
  TrendingUp,
  Wallet,
  Check,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  ArrowDownRight,
  ArrowUpRight,
  Plus,
  Minus,
} from 'lucide-react-native';
import { typography, spacing, borderRadius } from '../../../shared/theme';
import { AlertDto } from '../../../services/api/types';
import { useApp } from '../../../context/AppContext';
import { useTheme } from '../../../context/ThemeContext';

interface AlertDetailActionModalProps {
  visible: boolean;
  alert: AlertDto | null;
  onClose: () => void;
}

export const AlertDetailActionModal: React.FC<AlertDetailActionModalProps> = ({
  visible,
  alert,
  onClose,
}) => {
  const {
    portfolio,
    coins,
    executeTrade,
    deletePriceAlert,
    updatePriceAlert,
    refreshData,
  } = useApp();
  const { colors, isDark } = useTheme();

  const [activeTab, setActiveTab] = useState<'ACTIONS' | 'EDIT' | 'SELL'>('ACTIONS');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Düzenleme State'leri
  const [editPriceInput, setEditPriceInput] = useState('');
  const [editCondition, setEditCondition] = useState<'BELOW' | 'ABOVE'>('BELOW');

  // Hızlı Satış State'leri
  const [sellAmountInput, setSellAmountInput] = useState('');
  const [selectedPercent, setSelectedPercent] = useState<number>(100);

  const coin = alert ? coins.find((c) => c.symbol === alert.symbol) : null;
  const currentLivePrice =
    coin?.lastPrice !== undefined && coin.lastPrice > 0
      ? coin.lastPrice
      : coin?.priceUsd !== undefined && coin.priceUsd > 0
      ? coin.priceUsd
      : alert?.targetPrice || 0;

  const isStopLoss = alert ? alert.alertType === 'STOP_LOSS' || alert.condition === 'BELOW' : false;

  const currentHolding = alert
    ? portfolio.holdings.find((h) => h.symbol === alert.symbol)
    : null;
  const availableCoinAmount = currentHolding ? currentHolding.amount : 0;
  const holdingUsdValue = availableCoinAmount * currentLivePrice;

  // Hedef ile anlık fiyat arasındaki yüzdelik ve dolar farkı
  const targetPriceVal = alert ? alert.targetPrice : 0;
  const priceDiffUsd = targetPriceVal - currentLivePrice;
  const priceDiffPct =
    currentLivePrice > 0 ? ((targetPriceVal - currentLivePrice) / currentLivePrice) * 100 : 0;

  useEffect(() => {
    if (visible && alert) {
      setActiveTab('ACTIONS');
      setLoading(false);
      setSuccessMsg('');
      setErrorMsg('');
      setEditPriceInput(alert.targetPrice.toString());
      setEditCondition(alert.condition);

      if (availableCoinAmount > 0) {
        setSellAmountInput(availableCoinAmount.toString());
        setSelectedPercent(100);
      } else {
        setSellAmountInput('0');
        setSelectedPercent(0);
      }
    }
  }, [visible, alert, availableCoinAmount]);

  if (!visible || !alert) return null;

  const numericSellAmount = parseFloat(sellAmountInput) || 0;
  const totalUsdtToReceive = numericSellAmount * currentLivePrice;
  const isInsufficient = numericSellAmount > availableCoinAmount || numericSellAmount <= 0;

  // Düzenleme ekranındaki anlık hesaplama
  const numericEditPrice = parseFloat(editPriceInput) || 0;
  const editDiffPct =
    currentLivePrice > 0 ? ((numericEditPrice - currentLivePrice) / currentLivePrice) * 100 : 0;

  // Hızlı Yüzde Değiştirici (Düzenleme ekranı)
  const applyQuickEditPercent = (pct: number) => {
    if (currentLivePrice <= 0) return;
    const decimals = currentLivePrice < 1 ? 4 : 2;
    const newTarget = (currentLivePrice * (1 + pct / 100)).toFixed(decimals);
    setEditPriceInput(newTarget);
    if (pct < 0) {
      setEditCondition('BELOW');
    } else {
      setEditCondition('ABOVE');
    }
  };

  // Stepper ile fiyat artır/azalt
  const adjustEditPrice = (deltaDollars: number) => {
    const cur = parseFloat(editPriceInput) || currentLivePrice;
    const next = Math.max(0, cur + deltaDollars);
    const decimals = currentLivePrice < 1 ? 4 : 2;
    setEditPriceInput(next.toFixed(decimals));
  };

  // Aksiyon 1: Şimdi Sat (Piyasa Fiyatından Bozdur)
  const handleMarketSellNow = async () => {
    if (availableCoinAmount <= 0) {
      setErrorMsg(`Cüzdanınızda satılabilecek ${alert.symbol} varlığı bulunmuyor.`);
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const sellAmount = numericSellAmount > 0 ? numericSellAmount : availableCoinAmount;
      const totalCost = sellAmount * currentLivePrice;

      // 1. Piyasa fiyatından satışı atomik olarak yürüt (anında DB ve 'Son İşlemler'e yazar)
      await executeTrade(alert.symbol, 'SELL', sellAmount, totalCost);

      // 2. Emri sil/kapat
      await deletePriceAlert(alert.id);

      setSuccessMsg(
        `Başarıyla ${sellAmount.toLocaleString('tr-TR', { maximumFractionDigits: 6 })} ${
          alert.symbol
        } satıldı! $${totalCost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} USDT nakit hesabınıza eklendi.`
      );

      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Satış işlemi gerçekleştirilemedi.');
      setLoading(false);
    }
  };

  // Aksiyon 2: Emri Düzenle / Güncelle
  const handleSaveEdit = async () => {
    const newPrice = parseFloat(editPriceInput);
    if (!newPrice || newPrice <= 0) {
      setErrorMsg('Lütfen geçerli bir hedef fiyat giriniz.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await updatePriceAlert(alert.id, {
        targetPrice: newPrice,
        condition: editCondition,
        alertType: editCondition === 'BELOW' ? 'STOP_LOSS' : 'TAKE_PROFIT',
      });

      await refreshData();
      setSuccessMsg('Hedef stop-loss eşiği başarıyla güncellendi!');
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Emir güncellenemedi.');
      setLoading(false);
    }
  };

  // Aksiyon 3: Emri İptal Et / Sil
  const handleDeleteAlert = async () => {
    setLoading(true);
    try {
      await deletePriceAlert(alert.id);
      await refreshData();
      setSuccessMsg('Emir başarıyla iptal edildi ve listeden kaldırıldı.');
      setTimeout(() => {
        onClose();
      }, 600);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Emir silinemedi.');
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View
          style={[
            styles.modalContent,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {/* Mobil Alt Çekmece Tutamacı */}
          <View style={styles.grabHandleWrap}>
            <View
              style={[
                styles.grabHandle,
                { backgroundColor: isDark ? '#334155' : '#CBD5E1' },
              ]}
            />
          </View>

          {/* Üst Başlık Barı */}
          <View style={[styles.headerRow, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <View
                style={[
                  styles.iconWrap,
                  {
                    backgroundColor: isStopLoss
                      ? 'rgba(255, 59, 48, 0.15)'
                      : 'rgba(0, 178, 254, 0.15)',
                  },
                ]}
              >
                {isStopLoss ? (
                  <TrendingDown size={20} color="#FF3B30" />
                ) : (
                  <TrendingUp size={20} color="#00B2FE" />
                )}
              </View>
              <View>
                <View style={styles.titleBadgeRow}>
                  <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                    {alert.symbol} / USDT
                  </Text>
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
                      {isStopLoss ? 'STOP-LOSS' : 'HEDEF KÂR'}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                  {alert.isTriggered ? '● Tetiklenmiş Emir' : '● Aktif Emir Takipte'}
                </Text>
              </View>
            </View>

            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={10}>
              <X size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* Canlı Fiyat & Hedef Eşik Karşılaştırma Kartı */}
            <View
              style={[
                styles.comparisonCard,
                {
                  backgroundColor: isDark ? '#0C121D' : '#F1F5F9',
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.priceRow}>
                <View style={styles.priceCol}>
                  <Text style={[styles.priceHeaderLabel, { color: colors.textSecondary }]}>
                    Hedef Eşik Fiyatı
                  </Text>
                  <Text
                    style={[
                      styles.targetPriceText,
                      { color: isStopLoss ? '#FF3B30' : '#00E676' },
                    ]}
                  >
                    ${targetPriceVal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                  </Text>
                  <Text style={[styles.priceConditionDesc, { color: colors.textMuted }]}>
                    {alert.condition === 'BELOW' ? 'Altına inerse uyar' : 'Üstüne çıkarsa uyar'}
                  </Text>
                </View>

                <View style={styles.priceDivider} />

                <View style={styles.priceCol}>
                  <Text style={[styles.priceHeaderLabel, { color: colors.textSecondary }]}>
                    Anlık Binance Kuru
                  </Text>
                  <Text style={[styles.livePriceText, { color: colors.textPrimary }]}>
                    ${currentLivePrice.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                  </Text>
                  <View style={styles.liveTag}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveTagText}>Canlı</Text>
                  </View>
                </View>
              </View>

              {/* Fark & Mesafe Rozeti */}
              <View
                style={[
                  styles.distanceBadge,
                  {
                    backgroundColor: isStopLoss
                      ? 'rgba(255, 59, 48, 0.12)'
                      : 'rgba(0, 230, 118, 0.12)',
                  },
                ]}
              >
                {isStopLoss ? (
                  <ArrowDownRight size={15} color="#FF3B30" />
                ) : (
                  <ArrowUpRight size={15} color="#00E676" />
                )}
                <Text
                  style={[
                    styles.distanceBadgeText,
                    { color: isStopLoss ? '#FF3B30' : '#00E676' },
                  ]}
                >
                  {isStopLoss
                    ? `Fark: %${Math.abs(priceDiffPct).toFixed(2)} (Fiyat $${Math.abs(priceDiffUsd).toFixed(2)} daha düşerse tetiklenir)`
                    : `Fark: +%${Math.abs(priceDiffPct).toFixed(2)} (Fiyat $${Math.abs(priceDiffUsd).toFixed(2)} daha yükselirse tetiklenir)`}
                </Text>
              </View>
            </View>

            {/* Bilgilendirici İpucu Kartı */}
            <View
              style={[
                styles.infoNoteBox,
                {
                  backgroundColor: isDark ? 'rgba(0, 178, 254, 0.08)' : '#E0F2FE',
                  borderColor: 'rgba(0, 178, 254, 0.25)',
                },
              ]}
            >
              <Text style={[styles.infoNoteText, { color: isDark ? '#93C5FD' : '#0369A1' }]}>
                {isStopLoss
                  ? `🛡️ Stop-Loss (Zarar Durdur): Binance anlık kuru $${targetPriceVal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} altına indiğinde sistem sizi uyarır ve sermayenizi korur.`
                  : `🎯 Hedef Kâr: Binance anlık kuru $${targetPriceVal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} seviyesine ulaştığında kârınızı nakde çevirmeniz için sizi bilgilendirir.`}
              </Text>
            </View>

            {/* Cüzdandaki Mevcut Varlık Kartı */}
            <View
              style={[
                styles.walletBox,
                {
                  backgroundColor: isDark ? '#111827' : '#F8FAFC',
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.walletHeader}>
                <Wallet size={15} color={colors.primary} />
                <Text style={[styles.walletTitle, { color: colors.textSecondary }]}>
                  Cüzdanınızdaki Mevcut Varlık:
                </Text>
              </View>
              <Text style={[styles.walletAmount, { color: colors.textPrimary }]}>
                {availableCoinAmount.toLocaleString('tr-TR', { maximumFractionDigits: 6 })} {alert.symbol}{' '}
                <Text style={[styles.walletUsd, { color: colors.textSecondary }]}>
                  (~${holdingUsdValue.toFixed(2)})
                </Text>
              </Text>
            </View>

            {/* Hata & Başarı Bildirimleri */}
            {errorMsg ? (
              <View style={styles.errorBox}>
                <AlertTriangle size={15} color="#FF3B30" />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {successMsg ? (
              <View style={styles.successBox}>
                <Check size={16} color={colors.success} />
                <Text style={[styles.successText, { color: colors.success }]}>{successMsg}</Text>
              </View>
            ) : null}

            {/* TAB: ANA AKSİYONLAR */}
            {activeTab === 'ACTIONS' && (
              <View style={styles.actionsContainer}>
                {/* 1. Hedef Fiyat Eşiğini Değiştir Butonu */}
                <Pressable
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    {
                      backgroundColor: colors.primary,
                    },
                    pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
                    loading && styles.disabledBtn,
                  ]}
                  onPress={() => setActiveTab('EDIT')}
                  disabled={loading}
                >
                  <View style={styles.btnRow}>
                    <View style={styles.btnIconLeft}>
                      <Edit3 size={18} color="#052914" />
                      <View>
                        <Text style={[styles.btnTitle, { color: '#052914' }]}>
                          Eşik / Hedef Fiyatını Düzenle
                        </Text>
                        <Text style={[styles.btnSubtitle, { color: 'rgba(5,41,20,0.8)' }]}>
                          Stop-loss veya kâr alma fiyat seviyesini değiştir
                        </Text>
                      </View>
                    </View>
                    <ArrowRight size={18} color="#052914" />
                  </View>
                </Pressable>

                {/* 2. Şimdi Sat (Piyasa Fiyatından Bozdur) Butonu */}
                <Pressable
                  style={({ pressed }) => [
                    styles.secondaryBtn,
                    {
                      backgroundColor: isDark ? '#162233' : '#E2E8F0',
                      borderColor: colors.border,
                    },
                    pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
                    (loading || availableCoinAmount <= 0) && styles.disabledBtn,
                  ]}
                  onPress={() => {
                    if (availableCoinAmount > 0) {
                      setActiveTab('SELL');
                    } else {
                      setErrorMsg(`Cüzdanınızda satış yapılabilecek ${alert.symbol} bulunmuyor.`);
                    }
                  }}
                  disabled={loading}
                >
                  <View style={styles.btnRow}>
                    <View style={styles.btnIconLeft}>
                      <TrendingDown size={18} color="#FF3B30" />
                      <View>
                        <Text style={[styles.btnTitle, { color: colors.textPrimary }]}>
                          Şimdi Sat (Piyasa Fiyatından Bozdur)
                        </Text>
                        <Text style={[styles.btnSubtitle, { color: colors.textSecondary }]}>
                          Emri beklemeden elindeki varlığı anında nakde çevir
                        </Text>
                      </View>
                    </View>
                    <ArrowRight size={18} color={colors.textSecondary} />
                  </View>
                </Pressable>

                {/* 3. Emri İptal Et / Sil Butonu */}
                <Pressable
                  style={({ pressed }) => [
                    styles.deleteActionBtn,
                    pressed && { opacity: 0.7 },
                    loading && styles.disabledBtn,
                  ]}
                  onPress={handleDeleteAlert}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FF3B30" />
                  ) : (
                    <>
                      <Trash2 size={16} color="#FF3B30" />
                      <Text style={styles.deleteActionText}>Emri İptal Et ve Listeden Kaldır</Text>
                    </>
                  )}
                </Pressable>
              </View>
            )}

            {/* TAB: EMRİ DÜZENLE */}
            {activeTab === 'EDIT' && (
              <View style={styles.tabContainer}>
                <Text style={[styles.tabTitle, { color: colors.textPrimary }]}>
                  {isStopLoss ? 'Stop-Loss Seviyesini Değiştir' : 'Hedef Kâr Seviyesini Değiştir'}
                </Text>
                <Text style={[styles.tabDesc, { color: colors.textSecondary }]}>
                  Binance anlık piyasa fiyatına göre hızlı butonları kullanabilir veya manuel değer girebilirsiniz.
                </Text>

                {/* Hızlı Yüzde Butonları */}
                <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 8 }]}>
                  Hızlı Yüzde Seçenekleri:
                </Text>
                <View style={styles.quickPercentGrid}>
                  {(isStopLoss ? [-3, -5, -10, -15] : [5, 10, 15, 20]).map((pct) => (
                    <Pressable
                      key={pct}
                      style={({ pressed }) => [
                        styles.quickPctPill,
                        {
                          backgroundColor: isDark ? '#141D2B' : '#E2E8F0',
                          borderColor: colors.border,
                        },
                        pressed && { opacity: 0.7 },
                      ]}
                      onPress={() => applyQuickEditPercent(pct)}
                    >
                      <Text
                        style={[
                          styles.quickPctText,
                          { color: pct < 0 ? '#FF3B30' : '#00E676' },
                        ]}
                      >
                        {pct > 0 ? `+%${pct}` : `%${pct}`}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {/* Fiyat Giriş Kutusu & Stepper */}
                <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 12 }]}>
                  Yeni Hedef Fiyat (USD):
                </Text>
                <View style={styles.inputWithStepperRow}>
                  <Pressable
                    style={[styles.stepperBtn, { backgroundColor: isDark ? '#162233' : '#E2E8F0' }]}
                    onPress={() => adjustEditPrice(currentLivePrice > 1000 ? -50 : -1)}
                  >
                    <Minus size={18} color={colors.textPrimary} />
                  </Pressable>

                  <View
                    style={[
                      styles.inputWrapper,
                      {
                        backgroundColor: isDark ? '#070B11' : '#FFFFFF',
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.currencyPrefix, { color: colors.textSecondary }]}>$</Text>
                    <TextInput
                      style={[styles.priceInput, { color: colors.textPrimary }]}
                      value={editPriceInput}
                      onChangeText={setEditPriceInput}
                      keyboardType="decimal-pad"
                      placeholder="0.00"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>

                  <Pressable
                    style={[styles.stepperBtn, { backgroundColor: isDark ? '#162233' : '#E2E8F0' }]}
                    onPress={() => adjustEditPrice(currentLivePrice > 1000 ? 50 : 1)}
                  >
                    <Plus size={18} color={colors.textPrimary} />
                  </Pressable>
                </View>

                {/* Düzenlenen Fiyatın Canlı Fark Göstergesi */}
                {numericEditPrice > 0 && (
                  <View
                    style={[
                      styles.previewBadge,
                      {
                        backgroundColor:
                          editDiffPct < 0
                            ? 'rgba(255, 59, 48, 0.12)'
                            : 'rgba(0, 230, 118, 0.12)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.previewBadgeText,
                        { color: editDiffPct < 0 ? '#FF3B30' : '#00E676' },
                      ]}
                    >
                      {editDiffPct < 0
                        ? `Anlık kurdan %${Math.abs(editDiffPct).toFixed(2)} daha düşük (Stop-Loss)`
                        : `Anlık kurdan +%${Math.abs(editDiffPct).toFixed(2)} daha yüksek (Hedef Kâr)`}
                    </Text>
                  </View>
                )}

                {/* Butonlar */}
                <View style={styles.dualButtonRow}>
                  <Pressable
                    style={[styles.cancelBtn, { borderColor: colors.border }]}
                    onPress={() => setActiveTab('ACTIONS')}
                    disabled={loading}
                  >
                    <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Vazgeç</Text>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.confirmBtn,
                      { backgroundColor: colors.primary },
                      loading && styles.disabledBtn,
                    ]}
                    onPress={handleSaveEdit}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#052914" size="small" />
                    ) : (
                      <Text style={[styles.confirmBtnText, { color: '#052914' }]}>
                        Fiyatı Güncelle
                      </Text>
                    )}
                  </Pressable>
                </View>
              </View>
            )}

            {/* TAB: HIZLI SATIŞ ONAYI */}
            {activeTab === 'SELL' && (
              <View style={styles.tabContainer}>
                <Text style={[styles.tabTitle, { color: colors.textPrimary }]}>
                  Piyasa Fiyatından Hızlı Satış
                </Text>
                <Text style={[styles.tabDesc, { color: colors.textSecondary }]}>
                  Satış doğrudan Binance anlık fiyatından gerçekleşir ve elde edilen USDT nakit bakiyenize hemen aktarılır.
                </Text>

                {/* Yüzde Butonları */}
                <View style={styles.percentRow}>
                  {[25, 50, 75, 100].map((pct) => {
                    const isSelected = selectedPercent === pct;
                    return (
                      <Pressable
                        key={pct}
                        style={[
                          styles.percentBtn,
                          {
                            borderColor: isSelected ? colors.primary : colors.border,
                            backgroundColor: isSelected
                              ? 'rgba(0, 230, 118, 0.15)'
                              : isDark
                              ? '#0C121D'
                              : '#F1F5F9',
                          },
                        ]}
                        onPress={() => {
                          setSelectedPercent(pct);
                          const amt = (availableCoinAmount * (pct / 100)).toFixed(6);
                          setSellAmountInput(amt);
                        }}
                      >
                        <Text
                          style={[
                            styles.percentBtnText,
                            { color: isSelected ? colors.primary : colors.textSecondary },
                          ]}
                        >
                          %{pct} {pct === 100 ? '(Tümü)' : ''}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Miktar Kutusu */}
                <View style={styles.inputBox}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                    Satılacak {alert.symbol} Miktarı:
                  </Text>
                  <TextInput
                    style={[
                      styles.amountInput,
                      {
                        backgroundColor: isDark ? '#070B11' : '#FFFFFF',
                        borderColor: colors.border,
                        color: colors.textPrimary,
                      },
                    ]}
                    value={sellAmountInput}
                    onChangeText={(val) => {
                      setSellAmountInput(val);
                      setSelectedPercent(0);
                    }}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>

                {/* Hesaba Eklenecek Nakit Bilgisi */}
                <View style={[styles.netTotalBox, { borderTopColor: colors.border }]}>
                  <Text style={[styles.netTotalLabel, { color: colors.textSecondary }]}>
                    Hesaba Eklenecek USDT Tutarı:
                  </Text>
                  <Text style={[styles.netTotalVal, { color: colors.success }]}>
                    +${totalUsdtToReceive.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                  </Text>
                </View>

                <Text style={[styles.instantNoticeText, { color: colors.textMuted }]}>
                  ℹ️ İşlem tamamlandığında anında "Son İşlem Geçmişi" listesine düşecektir.
                </Text>

                <View style={styles.dualButtonRow}>
                  <Pressable
                    style={[styles.cancelBtn, { borderColor: colors.border }]}
                    onPress={() => setActiveTab('ACTIONS')}
                    disabled={loading}
                  >
                    <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Geri</Text>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.confirmBtn,
                      { backgroundColor: '#FF3B30' },
                      (loading || isInsufficient) && styles.disabledBtn,
                    ]}
                    onPress={handleMarketSellNow}
                    disabled={loading || isInsufficient}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={[styles.confirmBtnText, { color: '#FFFFFF' }]}>
                        Satışı Onayla
                      </Text>
                    )}
                  </Pressable>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center', // Web'de ekranın tam ortasına hizalar
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    width: '100%',
    maxWidth: 430, // Telefonda tam oturur, bilgisayarda telefon boyutunu korur!
    alignSelf: 'center',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: '90%',
    paddingBottom: spacing.xl,
    overflow: 'hidden',
  },
  grabHandleWrap: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  grabHandle: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
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
  modalSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  scrollBody: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  comparisonCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceCol: {
    flex: 1,
  },
  priceDivider: {
    width: 1,
    height: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: spacing.md,
  },
  priceHeaderLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  targetPriceText: {
    fontSize: 17,
    fontWeight: '800',
  },
  livePriceText: {
    fontSize: 17,
    fontWeight: '800',
  },
  priceConditionDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00E676',
  },
  liveTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00E676',
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
  },
  distanceBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  infoNoteBox: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  infoNoteText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
  walletBox: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  walletTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  walletAmount: {
    fontSize: 15,
    fontWeight: '800',
  },
  walletUsd: {
    fontSize: 13,
    fontWeight: '600',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 59, 48, 0.12)',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  successText: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  actionsContainer: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  primaryBtn: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  secondaryBtn: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  btnIconLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  btnTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  btnSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  deleteActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: spacing.md,
    marginTop: spacing.xs,
  },
  deleteActionText: {
    color: '#FF3B30',
    fontSize: 13,
    fontWeight: '700',
  },
  tabContainer: {
    gap: spacing.sm,
  },
  tabTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  tabDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  quickPercentGrid: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  quickPctPill: {
    flex: 1,
    height: 38,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickPctText: {
    fontSize: 13,
    fontWeight: '800',
  },
  inputWithStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrapper: {
    flex: 1,
    height: 44,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  currencyPrefix: {
    fontSize: 16,
    fontWeight: '700',
    marginRight: 4,
  },
  priceInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
  },
  previewBadge: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  previewBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  dualButtonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  confirmBtn: {
    flex: 2,
    height: 46,
    borderRadius: borderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  percentRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginVertical: spacing.xs,
  },
  percentBtn: {
    flex: 1,
    height: 36,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  inputBox: {
    gap: 6,
    marginTop: 4,
  },
  amountInput: {
    height: 44,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    fontWeight: '700',
  },
  netTotalBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    marginTop: spacing.xs,
  },
  netTotalLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  netTotalVal: {
    fontSize: 16,
    fontWeight: '800',
  },
  instantNoticeText: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  disabledBtn: {
    opacity: 0.5,
  },
});
