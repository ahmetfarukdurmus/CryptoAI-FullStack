import logging
from sqlalchemy.orm import Session
from app.core.database import Base, engine
from app.core.security import get_password_hash
from app.models.user import User
from app.models.portfolio import Portfolio, Holding
from app.models.coin import CoinMarket
from app.models.autopilot import AutopilotStatus, AutopilotLog, AutopilotSettingsModel
from app.models.notification import Notification

logger = logging.getLogger(__name__)


def init_db(db: Session) -> None:
    """Veritabanı tablolarını oluşturur ve mock başlangıç verilerini tohumlar (seed)."""
    # 1. Tabloları oluştur
    Base.metadata.create_all(bind=engine)

    # 2. Temel kullanıcıyı kontrol et ve ekle
    demo_email = "bgoryunar@gmail.com"
    user = db.query(User).filter(User.email == demo_email).first()

    if not user:
        logger.info("Demo kullanıcı oluşturuluyor: %s", demo_email)
        user = User(
            id="usr_231002035",
            uid="231002035",
            first_name="Beyza",
            last_name="Göryunar",
            email=demo_email,
            hashed_password=get_password_hash("Password123!"),
            is_email_verified=True,
        )
        db.add(user)
        db.flush()

        # Portföy oluştur ($10.000 Sanal Başlangıç Bakiyesi)
        portfolio = Portfolio(
            user_id=user.id,
            total_balance_usd=10000.0,
            daily_change_usd=0.0,
            is_autopilot_active=False,
            llm_analysis_text=(
                "CryptoAI'a hoş geldiniz! Sanal bakiyenizle alım-satım yapmaya başlayabilir veya Otopilot modunu devreye alabilirsiniz."
            ),
        )
        db.add(portfolio)
        db.flush()

        # Cüzdan varlıkları (Holdings)
        holdings = [
            Holding(
                portfolio_id=portfolio.id,
                symbol="USDT",
                name="Kullanılabilir Nakit",
                amount=10000.0,
                value_usd=10000.0,
                change_usd=0.0,
                change_percent=0.0,
                icon_letter="₮",
                color="#26A17B",
                is_cash=True,
            ),
        ]
        db.add_all(holdings)

        # Otopilot Durumu
        autopilot_status = AutopilotStatus(
            user_id=user.id,
            is_running=True,
            active_model_name="LSTM + XGBoost Hybrid Model",
            realized_profit_24h=327.91,
            success_rate_percent=78.4,
            total_trades_count=4,
        )
        db.add(autopilot_status)

        # Otopilot Ayarları
        autopilot_settings = AutopilotSettingsModel(
            user_id=user.id,
            risk_profile="Dengeli",
            stop_loss_percent=10.0,
            take_profit_percent=20.0,
            max_trade_allocation_percent=25.0,
        )
        db.add(autopilot_settings)

        # Otopilot Günlükleri (Logs)
        logs = [
            AutopilotLog(
                id="log_1",
                user_id=user.id,
                type="SELL",
                title="ETH Otomatik Satış",
                symbol="ETH",
                amount_info="Kâr: +$45.20",
                profit_usd=45.2,
                reason="Nedeni: Model hedef fiyata ($2.514) ulaştı.",
                time="13:10",
            ),
            AutopilotLog(
                id="log_2",
                user_id=user.id,
                type="BUY",
                title="SOL Otomatik Alım",
                symbol="SOL",
                amount_info="$108.02 (2 Adet)",
                profit_usd=None,
                reason="Nedeni: MACD kesişimi ve güçlü al sinyali.",
                time="09:45",
            ),
        ]
        db.add_all(logs)

        # Bildirimler
        notifications = [
            Notification(
                id="notif_1",
                user_id=user.id,
                type="AI_SIGNAL",
                title="Yeni AI Sinyali: BTC/USDT",
                message='Hibrit model %87 güven oranı ile "GÜÇLÜ AL" sinyali üretti. Hedef: $69.200.',
                time="12 dk önce",
                is_read=False,
                related_symbol="BTC",
            ),
            Notification(
                id="notif_2",
                user_id=user.id,
                type="AUTOPILOT_TRADE",
                title="Otopilot Kâr Satışı Gerçekleşti",
                message="ETH pozisyonunuz hedef fiyattan satıldı. Gerçekleşen Kâr: +$45.20.",
                time="45 dk önce",
                is_read=False,
                related_symbol="ETH",
            ),
            Notification(
                id="notif_3",
                user_id=user.id,
                type="PRICE_ALERT",
                title="Fiyat Eşiği Aşıldı: SOL",
                message="SOL/USDT belirlediğiniz $108.00 eşik seviyesini yukarı yönlü kırdı.",
                time="2 saat önce",
                is_read=True,
                related_symbol="SOL",
            ),
            Notification(
                id="notif_4",
                user_id=user.id,
                type="SECURITY",
                title="Oturum Süresi Güncellendi",
                message="Oturumunuz 30 gün uzatıldı. Bir sonraki bitiş tarihi: 19 Kasım 2026.",
                time="Dün",
                is_read=True,
                related_symbol=None,
            ),
            Notification(
                id="notif_5",
                user_id=user.id,
                type="AI_SIGNAL",
                title="Haftalık Otopilot Değerlendirmesi",
                message="Geçtiğimiz 7 günde 18 işlem tamamlandı, başarı oranı %79.4 olarak ölçüldü.",
                time="3 gün önce",
                is_read=True,
                related_symbol=None,
            ),
        ]
        db.add_all(notifications)
        db.commit()

    # 3. Kripto Para Piyasasını kontrol et ve tohumla (17 Popüler Coin)
    existing_symbols = {c.symbol for c in db.query(CoinMarket).all()}
    logger.info("Kripto para piyasa verileri kontrol ediliyor (Mevcut: %d coin)...", len(existing_symbols))

    all_17_coins = [
        CoinMarket(
            symbol="BTC",
            name="Bitcoin",
            price_usd=82950.0,
            change_24h=1.45,
            change_usd=1180.0,
            high_24h=84200.0,
            low_24h=81800.0,
            volume_btc="42.51K",
            rsi=62.4,
            ai_signal="GÜÇLÜ AL",
            ai_confidence_percent=88,
            ai_analysis_text="Direnç seviyesi hacimli kırıldı. Model, önümüzdeki 4 saat içinde yukarı yönlü trendin devam etmesini öngörüyor.",
            is_watchlisted=True,
            has_alarm=False,
            icon_letter="B",
            color="#F7931A",
        ),
        CoinMarket(
            symbol="ETH",
            name="Ethereum",
            price_usd=2520.0,
            change_24h=-0.85,
            change_usd=-21.4,
            high_24h=2580.0,
            low_24h=2470.0,
            volume_btc="28.10K",
            rsi=54.2,
            ai_signal="AL",
            ai_confidence_percent=74,
            ai_analysis_text="Ethereum 2.500$ destek bölgesinden toparlanma eğiliminde.",
            is_watchlisted=False,
            has_alarm=True,
            icon_letter="E",
            color="#627EEA",
        ),
        CoinMarket(
            symbol="SOL",
            name="Solana",
            price_usd=172.5,
            change_24h=3.2,
            change_usd=5.3,
            high_24h=178.0,
            low_24h=168.0,
            volume_btc="15.40K",
            rsi=58.0,
            ai_signal="GÜÇLÜ AL",
            ai_confidence_percent=82,
            ai_analysis_text="Ağ işlem yoğunluğu ve DeFi kilitli varlık (TVL) artışıyla yukarı ivme güçleniyor.",
            is_watchlisted=True,
            has_alarm=True,
            icon_letter="SOL",
            color="#14F195",
        ),
        CoinMarket(
            symbol="BNB",
            name="BNB",
            price_usd=595.0,
            change_24h=1.1,
            change_usd=6.5,
            high_24h=605.0,
            low_24h=588.0,
            volume_btc="8.40K",
            rsi=55.5,
            ai_signal="AL",
            ai_confidence_percent=70,
            ai_analysis_text="BNB ekosistem işlem hacmi artışı ile yukarı yönlü hareketleniyor.",
            is_watchlisted=False,
            has_alarm=False,
            icon_letter="BNB",
            color="#F3BA2F",
        ),
        CoinMarket(
            symbol="XRP",
            name="Ripple",
            price_usd=0.525,
            change_24h=2.4,
            change_usd=0.012,
            high_24h=0.54,
            low_24h=0.51,
            volume_btc="85.20M",
            rsi=61.2,
            ai_signal="AL",
            ai_confidence_percent=72,
            ai_analysis_text="Kurumsal transfer hacmi yüksek, MACD pozitif kesişim bölgesinde.",
            is_watchlisted=False,
            has_alarm=False,
            icon_letter="XRP",
            color="#23292F",
        ),
        CoinMarket(
            symbol="DOGE",
            name="Dogecoin",
            price_usd=0.142,
            change_24h=1.8,
            change_usd=0.0025,
            high_24h=0.148,
            low_24h=0.138,
            volume_btc="62.40M",
            rsi=49.8,
            ai_signal="NÖTR",
            ai_confidence_percent=54,
            ai_analysis_text="Sosyal duyarlılık stabil, yatay konsolidasyon aralığında işlem görüyor.",
            is_watchlisted=False,
            has_alarm=False,
            icon_letter="DOG",
            color="#C2A633",
        ),
        CoinMarket(
            symbol="ADA",
            name="Cardano",
            price_usd=0.354,
            change_24h=-0.6,
            change_usd=-0.002,
            high_24h=0.365,
            low_24h=0.348,
            volume_btc="34.10M",
            rsi=44.1,
            ai_signal="NÖTR",
            ai_confidence_percent=52,
            ai_analysis_text="Kritik direnç seviyesini test ediyor, konsolidasyon sürüyor.",
            is_watchlisted=False,
            has_alarm=False,
            icon_letter="ADA",
            color="#0033AD",
        ),
        CoinMarket(
            symbol="AVAX",
            name="Avalanche",
            price_usd=26.8,
            change_24h=-2.1,
            change_usd=-0.58,
            high_24h=27.9,
            low_24h=26.2,
            volume_btc="18.20K",
            rsi=42.5,
            ai_signal="SAT",
            ai_confidence_percent=65,
            ai_analysis_text="Kısa vadeli hareketli ortalamaların altında, düzeltme baskısı devam ediyor.",
            is_watchlisted=True,
            has_alarm=False,
            icon_letter="AVX",
            color="#E84142",
        ),
        CoinMarket(
            symbol="DOT",
            name="Polkadot",
            price_usd=4.15,
            change_24h=0.5,
            change_usd=0.02,
            high_24h=4.28,
            low_24h=4.08,
            volume_btc="12.50K",
            rsi=51.0,
            ai_signal="NÖTR",
            ai_confidence_percent=58,
            ai_analysis_text="Parachain müzayedeleri öncesi akümülasyon evresinde.",
            is_watchlisted=False,
            has_alarm=False,
            icon_letter="DOT",
            color="#E6007A",
        ),
        CoinMarket(
            symbol="LINK",
            name="Chainlink",
            price_usd=11.2,
            change_24h=4.5,
            change_usd=0.48,
            high_24h=11.6,
            low_24h=10.7,
            volume_btc="22.30K",
            rsi=63.8,
            ai_signal="GÜÇLÜ AL",
            ai_confidence_percent=84,
            ai_analysis_text="Cross-chain interoperability protokolü (CCIP) entegrasyonları talebi artırıyor.",
            is_watchlisted=False,
            has_alarm=False,
            icon_letter="LNK",
            color="#375BD2",
        ),
        CoinMarket(
            symbol="MATIC",
            name="Polygon (POL)",
            price_usd=0.385,
            change_24h=-1.2,
            change_usd=-0.005,
            high_24h=0.398,
            low_24h=0.378,
            volume_btc="45.00M",
            rsi=47.3,
            ai_signal="NÖTR",
            ai_confidence_percent=51,
            ai_analysis_text="Katman-2 işlem ücreti güncellemeleri sonrası dengelenme sürecinde.",
            is_watchlisted=False,
            has_alarm=False,
            icon_letter="POL",
            color="#8247E5",
        ),
        CoinMarket(
            symbol="NEAR",
            name="NEAR Protocol",
            price_usd=4.65,
            change_24h=2.8,
            change_usd=0.12,
            high_24h=4.82,
            low_24h=4.48,
            volume_btc="29.40K",
            rsi=59.4,
            ai_signal="AL",
            ai_confidence_percent=75,
            ai_analysis_text="Kullanıcı tabanlı AI agent projeleri ekosistem aktivitesini artırıyor.",
            is_watchlisted=False,
            has_alarm=False,
            icon_letter="NEA",
            color="#000000",
        ),
        CoinMarket(
            symbol="SUI",
            name="Sui",
            price_usd=1.95,
            change_24h=6.4,
            change_usd=0.117,
            high_24h=2.05,
            low_24h=1.82,
            volume_btc="78.50M",
            rsi=67.2,
            ai_signal="GÜÇLÜ AL",
            ai_confidence_percent=89,
            ai_analysis_text="Yüksek işlem hızı ve yeni ekosistem likiditesi güçlü boğa sinyali veriyor.",
            is_watchlisted=False,
            has_alarm=False,
            icon_letter="SUI",
            color="#4DA2FF",
        ),
        CoinMarket(
            symbol="APT",
            name="Aptos",
            price_usd=8.75,
            change_24h=1.9,
            change_usd=0.16,
            high_24h=9.1,
            low_24h=8.5,
            volume_btc="14.80K",
            rsi=52.6,
            ai_signal="AL",
            ai_confidence_percent=68,
            ai_analysis_text="Move dili tabanlı dApp genişlemesi pozitif ivme oluşturuyor.",
            is_watchlisted=False,
            has_alarm=False,
            icon_letter="APT",
            color="#202020",
        ),
        CoinMarket(
            symbol="LTC",
            name="Litecoin",
            price_usd=68.4,
            change_24h=0.3,
            change_usd=0.2,
            high_24h=70.0,
            low_24h=67.5,
            volume_btc="11.20K",
            rsi=50.1,
            ai_signal="NÖTR",
            ai_confidence_percent=55,
            ai_analysis_text="Ödeme ağı hacmi sabit seyrediyor, dar bantta dalgalanma sürüyor.",
            is_watchlisted=False,
            has_alarm=False,
            icon_letter="LTC",
            color="#345D9D",
        ),
        CoinMarket(
            symbol="SHIB",
            name="Shiba Inu",
            price_usd=0.0000185,
            change_24h=-1.1,
            change_usd=-0.0000002,
            high_24h=0.0000192,
            low_24h=0.0000181,
            volume_btc="1.20B",
            rsi=48.9,
            ai_signal="NÖTR",
            ai_confidence_percent=53,
            ai_analysis_text="Shibarium katman işlem sayısı artış gösteriyor.",
            is_watchlisted=False,
            has_alarm=False,
            icon_letter="SHB",
            color="#FFA409",
        ),
        CoinMarket(
            symbol="PEPE",
            name="Pepe",
            price_usd=0.0000094,
            change_24h=5.6,
            change_usd=0.0000005,
            high_24h=0.0000102,
            low_24h=0.0000088,
            volume_btc="2.40B",
            rsi=65.5,
            ai_signal="GÜÇLÜ AL",
            ai_confidence_percent=81,
            ai_analysis_text="Meme piyasasında en yüksek likidite rotasyonu PEPE paritesinde yoğunlaşıyor.",
            is_watchlisted=False,
            has_alarm=False,
            icon_letter="PEP",
            color="#479E4B",
        ),
    ]

    new_added = 0
    for coin in all_17_coins:
        if coin.symbol not in existing_symbols:
            db.add(coin)
            new_added += 1

    if new_added > 0:
        db.commit()
        logger.info("%d adet yeni popüler kripto para veritabanına eklendi.", new_added)
