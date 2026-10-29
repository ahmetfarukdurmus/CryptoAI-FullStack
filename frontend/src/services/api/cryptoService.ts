import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  UserDto,
  AuthResponseDto,
  RegisterResponseDto,
  PortfolioSummaryDto,
  CoinMarketDto,
  AutopilotStatusDto,
  CreateAlarmDto,
  AlertCreateDto,
  AlertDto,
  TransactionDto,
} from './types';
import {
  mockUser,
  mockPortfolio,
  mockCoins,
  mockAutopilotStatus,
} from './mockData';

export const API_BASE_URL = 'http://localhost:8000/api';
export const API_FALLBACK_URL = 'http://localhost:8080/api';
const STORAGE_KEY = '@cryptoai_auth_user';

class CryptoApiService {
  private coins = [...mockCoins];
  private portfolio = { ...mockPortfolio };
  private autopilot = { ...mockAutopilotStatus };
  private onUnauthorizedCallback: (() => void) | null = null;

  setOnUnauthorized(callback: () => void) {
    this.onUnauthorizedCallback = callback;
  }

  private async getAuthToken(): Promise<string | null> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.token || null;
      }
    } catch {
      // Fallback
    }
    return null;
  }

  private async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    const token = await this.getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // E-posta gönderimi, kimlik doğrulama ve AI üretimi için 35 saniye tolerans tanı
    const isLongOperation =
      url.includes('/auth/register') ||
      url.includes('/auth/verify') ||
      url.includes('/resend') ||
      url.includes('/auth/login') ||
      url.includes('/ai/') ||
      url.includes('/chat/');
    const timeoutDuration = isLongOperation ? 35000 : 8000;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);

    let response: Response;
    try {
      response = await fetch(url, {
        ...options,
        headers,
        signal: options.signal || controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (primaryErr: any) {
      clearTimeout(timeoutId);

      // 8000 portu yanıt vermezse otomatik olarak 8080 portunu dene
      if (url.includes(':8000')) {
        const fallbackCtrl = new AbortController();
        const fbTimeout = setTimeout(() => fallbackCtrl.abort(), isLongOperation ? 15000 : 6000);
        try {
          const fallbackUrl = url.replace(':8000', ':8080');
          response = await fetch(fallbackUrl, {
            ...options,
            headers,
            signal: fallbackCtrl.signal,
          });
          clearTimeout(fbTimeout);
        } catch {
          clearTimeout(fbTimeout);
          if (primaryErr?.name === 'AbortError') {
            throw new Error('Sunucu veya e-posta servisi zaman aşımına uğradı, lütfen birkaç saniye sonra tekrar deneyin.');
          }
          throw primaryErr;
        }
      } else {
        if (primaryErr?.name === 'AbortError') {
          throw new Error('Sunucu veya e-posta servisi zaman aşımına uğradı, lütfen birkaç saniye sonra tekrar deneyin.');
        }
        throw primaryErr;
      }
    }

    if (response.status === 401) {
      if (this.onUnauthorizedCallback) {
        this.onUnauthorizedCallback();
      }
    }

    return response;
  }

  // Oturum / Kimlik Doğrulama: Giriş
  async login(email: string, pass: string): Promise<AuthResponseDto> {
    try {
      const response = await this.fetchWithAuth(`${API_BASE_URL}/v1/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ email, password: pass }),
      });
      if (response.ok) {
        const data: AuthResponseDto = await response.json();
        return data;
      } else {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || errData.message || 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.');
      }
    } catch (err: any) {
      if (err.message && !err.message.includes('Network') && !err.message.includes('fetch')) {
        throw err;
      }
      console.warn('Backend API erişilemedi:', err);
      throw new Error(err.message || 'Sunucuya bağlanılamadı. Lütfen backend servisini kontrol edin.');
    }
  }

  // Oturum / Kimlik Doğrulama: Kayıt (OTP Kodu Gönderir)
  async register(
    firstName: string,
    lastName: string,
    email: string,
    pass: string
  ): Promise<RegisterResponseDto> {
    try {
      const response = await this.fetchWithAuth(`${API_BASE_URL}/v1/auth/register`, {
        method: 'POST',
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password: pass,
        }),
      });
      if (response.ok) {
        const data: RegisterResponseDto = await response.json();
        return data;
      } else {
        const errData = await response.json().catch(() => ({}));
        const detailMsg = errData.detail || errData.message || '';
        if (
          response.status === 400 &&
          (detailMsg.includes('zaten') ||
            detailMsg.includes('already') ||
            detailMsg.includes('mevcut') ||
            detailMsg.includes('registered'))
        ) {
          throw new Error('Bu e-posta adresiyle zaten bir hesap mevcut, lütfen giriş yapın.');
        }
        throw new Error(detailMsg || 'Kayıt işlemi başarısız oldu.');
      }
    } catch (err: any) {
      if (err.message && !err.message.includes('Network') && !err.message.includes('fetch')) {
        throw err;
      }
      console.warn('Backend API erişilemedi:', err);
      throw new Error(err.message || 'Sunucuya bağlanılamadı. Lütfen backend servisini kontrol edin.');
    }
  }

  // 6 Haneli OTP Kodunu Doğrulama & Oturum Açma
  async verifyCode(email: string, code: string): Promise<AuthResponseDto> {
    try {
      const response = await this.fetchWithAuth(`${API_BASE_URL}/v1/auth/verify-code`, {
        method: 'POST',
        body: JSON.stringify({ email, code }),
      });
      if (response.ok) {
        const data: AuthResponseDto = await response.json();
        return data;
      } else {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || errData.message || 'Doğrulama kodu hatalı veya süresi dolmuş.');
      }
    } catch (err: any) {
      if (err.message && !err.message.includes('Network') && !err.message.includes('fetch')) {
        throw err;
      }
      throw new Error(err.message || 'Doğrulama servisine bağlanılamadı.');
    }
  }

  // Yeni Doğrulama Kodu İsteme (Resend OTP)
  async resendCode(email: string): Promise<boolean> {
    try {
      const response = await this.fetchWithAuth(`${API_BASE_URL}/v1/auth/resend-code`, {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  // Fiyat Eşiği ve Otomatik Bildirim Alarmları (Alerts / Price Triggers)
  async createAlert(data: AlertCreateDto): Promise<AlertDto | null> {
    try {
      const response = await this.fetchWithAuth(`${API_BASE_URL}/v1/alerts`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.warn('Fiyat alarmı kaydedilemedi:', err);
    }
    return null;
  }

  async getAlerts(): Promise<AlertDto[]> {
    try {
      const response = await this.fetchWithAuth(`${API_BASE_URL}/v1/alerts`);
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.warn('Alarmlar çekilemedi:', err);
    }
    return [];
  }

  async dismissAlert(alertId: number): Promise<boolean> {
    try {
      const response = await this.fetchWithAuth(`${API_BASE_URL}/v1/alerts/${alertId}/dismiss`, {
        method: 'POST',
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async deleteAlert(alertId: number): Promise<boolean> {
    try {
      const response = await this.fetchWithAuth(`${API_BASE_URL}/v1/alerts/${alertId}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async updateAlert(alertId: number, data: Partial<AlertCreateDto>): Promise<AlertDto | null> {
    try {
      const response = await this.fetchWithAuth(`${API_BASE_URL}/v1/alerts/${alertId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.warn('Alarm güncellenemedi:', err);
    }
    return null;
  }

  // Canlı Binance Kripto Verileri (/api/v1/crypto/market)
  async getMarketCoins(): Promise<CoinMarketDto[]> {
    return this.getCoins();
  }

  // Piyasa Listesi (Yalnızca FastAPI backend üzerinden /api/v1/crypto/market çağrılır - Single Source of Truth)
  async getCoins(): Promise<CoinMarketDto[]> {
    try {
      const response = await this.fetchWithAuth(`${API_BASE_URL}/v1/crypto/market`, {
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (response.ok) {
        const data: CoinMarketDto[] = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          this.coins = data;
          return data;
        }
      }
    } catch (err) {
      console.warn('Backend piyasa servisine ulaşılamadı:', err);
    }
    return this.coins;
  }

  // Portföy
  async getPortfolio(): Promise<PortfolioSummaryDto> {
    try {
      const response = await this.fetchWithAuth(`${API_BASE_URL}/v1/portfolio`);
      if (response.ok) {
        const data: PortfolioSummaryDto = await response.json();
        this.portfolio = data;
        return data;
      }
    } catch (err) {
      console.warn('Backend portföy servisine ulaşılamadı, yerel veri kullanılıyor:', err);
    }
    await this.delay(100);
    return this.portfolio;
  }

  // Alım / Satım Emri Yürütme (PostgreSQL veritabanına kaydeder)
  async executeTrade(
    symbol: string,
    type: 'BUY' | 'SELL',
    amount: number,
    costUsd: number,
    price?: number
  ): Promise<{ success: boolean; message: string; portfolio?: PortfolioSummaryDto }> {
    const response = await this.fetchWithAuth(`${API_BASE_URL}/v1/trade`, {
      method: 'POST',
      body: JSON.stringify({
        symbol,
        type,
        amount,
        costUsd,
        price: price || (amount > 0 ? costUsd / amount : 0),
      }),
    });
    if (response.ok) {
      const data = await response.json();
      if (data.portfolio) {
        this.portfolio = data.portfolio;
      }
      return data;
    } else {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || err.message || 'Alım/satım işlemi gerçekleştirilemedi.');
    }
  }

  // Kullanıcının Veritabanındaki Alım-Satım Geçmişi (Transactions)
  async getTransactions(): Promise<TransactionDto[]> {
    try {
      const response = await this.fetchWithAuth(`${API_BASE_URL}/v1/transactions`);
      if (response.ok) {
        const data: TransactionDto[] = await response.json();
        return data;
      }
    } catch (err) {
      console.warn('İşlem geçmişi servisine ulaşılamadı:', err);
    }
    return [];
  }

  async getWatchlist(): Promise<CoinMarketDto[]> {
    try {
      const response = await this.fetchWithAuth(`${API_BASE_URL}/v1/watchlist`);
      if (response.ok) {
        const data: CoinMarketDto[] = await response.json();
        return data;
      }
    } catch (err) {
      console.warn('Takip listesi servisine ulaşılamadı:', err);
    }
    await this.delay(100);
    return this.coins.filter((c) => c.isWatchlisted);
  }

  async toggleWatchlist(symbol: string): Promise<boolean> {
    try {
      const response = await this.fetchWithAuth(`${API_BASE_URL}/v1/watchlist/${symbol}/toggle`, {
        method: 'POST',
      });
      if (response.ok) {
        const data = await response.json();
        return data.isWatchlisted;
      }
    } catch (err) {
      console.warn('Watchlist toggle servisine ulaşılamadı:', err);
    }

    const coin = this.coins.find((c) => c.symbol === symbol);
    if (coin) {
      coin.isWatchlisted = !coin.isWatchlisted;
      return coin.isWatchlisted;
    }
    return false;
  }

  // Otopilot
  async getAutopilotStatus(): Promise<AutopilotStatusDto> {
    try {
      const response = await this.fetchWithAuth(`${API_BASE_URL}/v1/autopilot/status`);
      if (response.ok) {
        const data: AutopilotStatusDto = await response.json();
        return data;
      }
    } catch (err) {
      console.warn('Otopilot durum servisine ulaşılamadı:', err);
    }
    await this.delay(100);
    return this.autopilot;
  }

  async toggleAutopilot(): Promise<boolean> {
    try {
      const response = await this.fetchWithAuth(`${API_BASE_URL}/v1/autopilot/toggle`, {
        method: 'POST',
      });
      if (response.ok) {
        const data = await response.json();
        return data.isRunning;
      }
    } catch (err) {
      console.warn('Otopilot toggle servisine ulaşılamadı:', err);
    }

    this.autopilot.isRunning = !this.autopilot.isRunning;
    this.portfolio.isAutopilotActive = this.autopilot.isRunning;
    return this.autopilot.isRunning;
  }

  // Alarm Oluşturma
  async createAlarm(data: CreateAlarmDto): Promise<boolean> {
    try {
      const response = await this.fetchWithAuth(`${API_BASE_URL}/v1/alarms`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (response.ok) {
        return true;
      }
    } catch (err) {
      console.warn('Alarm oluşturma servisine ulaşılamadı:', err);
    }

    const coin = this.coins.find((c) => c.symbol === data.symbol);
    if (coin) {
      coin.hasAlarm = true;
    }
    return true;
  }

  // Google Gemini AI Sohbet Servisi (/api/v1/ai/chat veya /api/v1/chat/message)
  async sendChatMessage(message: string): Promise<string> {
    try {
      const response = await this.fetchWithAuth(`${API_BASE_URL}/v1/ai/chat`, {
        method: 'POST',
        body: JSON.stringify({ message }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.reply) return data.reply;
      }
    } catch (err) {
      console.warn('Gemini /ai/chat API çağrısı başarısız oldu, /chat/message deneniyor:', err);
    }

    try {
      const fallbackRes = await this.fetchWithAuth(`${API_BASE_URL}/v1/chat/message`, {
        method: 'POST',
        body: JSON.stringify({ message }),
      });
      if (fallbackRes.ok) {
        const data = await fallbackRes.json();
        if (data.reply) return data.reply;
      }
    } catch (err) {
      console.warn('Gemini /chat/message çağrısı da başarısız oldu:', err);
    }

    return 'Üzgünüm, şu anda yapay zeka servisine bağlanırken bir sorun oluştu. Lütfen birkaç saniye sonra tekrar deneyiniz.';
  }

  private delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const cryptoService = new CryptoApiService();
