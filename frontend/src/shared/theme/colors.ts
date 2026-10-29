export const darkColors = {
  // Arka planlar (Figma Deep Navy / Pure Dark)
  background: '#090D14',
  card: '#131922',
  cardSecondary: '#0E131C',
  surface: '#151C28',

  // Kenarlıklar
  border: '#1F2937',
  borderLight: '#2B3545',
  borderActive: '#00B2FE',

  // Marka & Aksan Renkleri
  primary: '#00B2FE',       // Figma Ana Buton ve Vurgu Mavisi
  primaryDark: '#0090D0',
  primaryGlow: 'rgba(0, 178, 254, 0.15)',

  // Finansal Durum Renkleri
  success: '#00E676',       // Figma Neon Yeşil (Kâr, Güçlü Al, Tikler)
  successMuted: 'rgba(0, 230, 118, 0.12)',
  danger: '#FF3B30',        // Figma Kırmızı (Zarar, SAT, Güvenli Çıkış)
  dangerMuted: 'rgba(255, 59, 48, 0.15)',
  warning: '#FFD600',       // Figma Yıldız ve Uyarı Sarısı
  warningMuted: 'rgba(255, 214, 0, 0.15)',
  neutralBadge: '#232B3B',  // Figma Nötr rozet arka planı

  // Metin Renkleri
  textPrimary: '#FFFFFF',
  textSecondary: '#8E9BAE',
  textMuted: '#526075',
  textInverted: '#000000',

  // Form Elemanları
  inputBackground: '#10151E',
  inputBorder: '#1C2433',
  inputPlaceholder: '#4F5D73',

  // Varlık Sembol Renkleri
  btc: '#F7931A',
  eth: '#627EEA',
  sol: '#14F195',
  usdt: '#26A17B',
  avax: '#E84142',
  doge: '#C2A633',
};

export const lightColors = {
  // Açık Tema Paleti
  background: '#F6F8FB',
  card: '#FFFFFF',
  cardSecondary: '#EDF2F7',
  surface: '#FFFFFF',

  // Kenarlıklar
  border: '#E2E8F0',
  borderLight: '#CBD5E1',
  borderActive: '#0090D0',

  // Marka & Aksan Renkleri
  primary: '#0088CC',
  primaryDark: '#006B9F',
  primaryGlow: 'rgba(0, 136, 204, 0.15)',

  // Finansal Durum Renkleri
  success: '#059669',
  successMuted: 'rgba(5, 150, 105, 0.12)',
  danger: '#DC2626',
  dangerMuted: 'rgba(220, 38, 38, 0.12)',
  warning: '#D97706',
  warningMuted: 'rgba(217, 119, 6, 0.15)',
  neutralBadge: '#E2E8F0',

  // Metin Renkleri
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#8492A6',
  textInverted: '#FFFFFF',

  // Form Elemanları
  inputBackground: '#F1F5F9',
  inputBorder: '#CBD5E1',
  inputPlaceholder: '#94A3B8',

  // Varlık Sembol Renkleri
  btc: '#F7931A',
  eth: '#627EEA',
  sol: '#14F195',
  usdt: '#26A17B',
  avax: '#E84142',
  doge: '#C2A633',
};

export const colors = darkColors;
export type ColorPalette = typeof darkColors;
