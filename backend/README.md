# CryptoAI Backend (FastAPI + PostgreSQL)

CryptoAI React Native mobil & web uygulaması için geliştirilmiş, yüksek performanslı Python (FastAPI + SQLAlchemy + PostgreSQL) backend mimarisi.

## 🚀 Mimari ve Özellikler

- **FastAPI 0.110+**: Asenkron, yüksek verimli ve otomatik Swagger/OpenAPI dokümantasyonuna (`/docs`, `/redoc`) sahip REST API.
- **SQLAlchemy 2.0 & PostgreSQL 16**: İlişkisel veri modelleme, otomatik tohumlama (`seed data`) ve atomik finansal işlemler.
- **CamelCase & SnakeCase Entegrasyonu**: Pydantic `CamelModel` ile React Native TypeScript arayüzlerine (`UserDto`, `PortfolioSummaryDto`, `CoinMarketDto`, vb.) %100 uyumlu camelCase JSON çıktıları.
- **Güvenli Kimlik Doğrulama**:
  - `bcrypt` tabanlı şifreleme ve tuzlama (salt).
  - 30 günlük oturum süreli JWT (JSON Web Token) standardı (`SESSION_DURATION_DAYS = 30`).
- **Kapsamlı Modüller**:
  - **Auth & Profil**: Kayıt (`$10.000 sanal bakiye bonusu`), giriş, profil güncelleme, oturum uzatma.
  - **Portföy & Varlıklar**: Nakit ve kripto pozisyonları, manuel & otopilot ALIM/SATIM emir yürütme.
  - **Piyasa & AI**: Kripto para kurları, 24 saatlik değişimler, RSI(14) ve hibrit yapay zeka sinyalleri (`GÜÇLÜ AL`, `AL`, `NÖTR`, `SAT`).
  - **AI Otopilot & Alarm**: Model durumu, geçmiş işlem logları, risk profili ayarları ve fiyat/AI sinyal alarmları.
  - **Bildirimler & Backtest**: Bildirim merkezi ve geçmiş strateji simülasyonları (`1M`, `3M`, `6M`).

---

## 📡 API Endpoint Listesi

### 1. Kimlik Doğrulama & E-Posta Doğrulama (`/api/v1/auth`)
| Metot | Uç Nokta | Açıklama |
|---|---|---|
| `POST` | `/api/v1/auth/register` | Kayıt olma: is_verified=False, 6 haneli OTP kodu üretip e-postaya gönderir |
| `POST` | `/api/v1/auth/verify-code` | 6 haneli OTP kodunu doğrulayıp hesabı aktifleştirir ve JWT döner |
| `POST` | `/api/v1/auth/resend-code` | E-postaya yeni doğrulama kodu gönderir |
| `POST` | `/api/v1/auth/login` | E-posta ve şifre ile giriş (Doğrulanmamış hesaplar OTP'ye yönlendirilir) |
| `GET` | `/api/v1/auth/me` | Oturum açan kullanıcının profil detayları |
| `PUT` | `/api/v1/auth/profile` | Ad ve soyad güncelleme |
| `POST` | `/api/v1/auth/refresh` | Oturum süresini +30 gün uzatma |

### 2. Fiyat Eşiği ve Otomatik Bildirim Alarmları (`/api/v1/alerts`)
| Metot | Uç Nokta | Açıklama |
|---|---|---|
| `POST` | `/api/v1/alerts` | Alt limit (Stop-loss) veya Üst limit (Hedef kâr) fiyat alarmı kaydetme |
| `GET` | `/api/v1/alerts` | Kullanıcının aktif alarmlarını listeleme |
| `POST` | `/api/v1/alerts/{id}/dismiss` | Tetiklenen alarmı kapatma / pasif etme |
| `DELETE` | `/api/v1/alerts/{id}` | Alarmı silme |

### 2. Portföy & İşlemler (`/api`)
| Metot | Uç Nokta | Açıklama |
|---|---|---|
| `GET` | `/api/portfolio` | Kullanıcı bakiyesi, kâr/zarar ve cüzdan varlıkları |
| `POST` | `/api/trade` | AL veya SAT işlemi yürütme (USDT ve varlık bakiyesi güncellenir) |

### 3. Canlı Kripto Verileri & Binance API (`/api/v1`)
| Metot | Uç Nokta | Açıklama |
|---|---|---|
| `GET` | `/api/v1/crypto/market` | Binance Public REST API'den anlık majör parite verileri (BTC, ETH, SOL, BNB, ADA, AVAX) |
| `GET` | `/api/v1/coins` | Piyasa kurları, RSI ve AI sinyalleri (Canlı Binance entegre) |
| `GET` | `/api/v1/watchlist` | Takip listesindeki coinler |
| `POST` | `/api/v1/watchlist/{symbol}/toggle` | Takip listesine ekleme / çıkarma |

### 4. Otopilot & Strateji (`/api`)
| Metot | Uç Nokta | Açıklama |
|---|---|---|
| `GET` | `/api/autopilot/status` | Otopilot çalışma durumu, başarı oranı ve son işlemler |
| `POST` | `/api/autopilot/toggle` | Otopilotu açma / kapatma |
| `GET` | `/api/autopilot/settings` | Risk profili, stop-loss ve take-profit ayarları |
| `PUT` | `/api/autopilot/settings` | Strateji ayarlarını güncelleme |

### 5. Alarmlar, Bildirimler ve Backtest (`/api`)
| Metot | Uç Nokta | Açıklama |
|---|---|---|
| `POST` | `/api/alarms` | Fiyat eşiği veya AI modeli alarmı kurma |
| `GET` | `/api/alarms` | Kullanıcının aktif alarmları |
| `GET` | `/api/notifications` | Bildirim listesi |
| `PUT` | `/api/notifications/{id}/read` | Bildirimi okundu yapma |
| `GET` | `/api/backtest?period=1M` | 1M, 3M veya 6M geçmiş strateji simülasyonu |

---

## 🐳 Docker ile Başlatma

Kök dizinde bulunan `docker-compose.yml` dosyası ile backend, frontend ve PostgreSQL tek komutla ayağa kaldırılır:

```bash
docker compose up --build
```

- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:8080/api`
- **Swagger UI**: `http://localhost:8080/docs`
- **PostgreSQL**: `localhost:5432`
