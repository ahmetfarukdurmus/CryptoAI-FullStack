import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings

logger = logging.getLogger(__name__)


def send_verification_email(to_email: str, code: str) -> bool:
    """
    Kullanıcının e-posta adresine 6 haneli doğrulama kodunu (OTP)
    Gmail SMTP (smtp.gmail.com:587) üzerinden TLS ile gönderir.
    SMTP bilgileri girilmemişse kodu geliştirici terminaline yazdırır.
    """
    subject = f"{code} - CryptoAI Hesap Doğrulama Kodunuz"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0B0E14; color: #FFFFFF; padding: 24px; }}
            .container {{ max-width: 480px; margin: 0 auto; background-color: #121824; border: 1px solid #1F2A3D; border-radius: 16px; padding: 32px; text-align: center; }}
            .logo {{ font-size: 24px; font-weight: 800; color: #00B2FE; margin-bottom: 12px; }}
            .title {{ font-size: 20px; font-weight: 700; color: #FFFFFF; margin-bottom: 8px; }}
            .desc {{ font-size: 14px; color: #8E9BAE; line-height: 20px; margin-bottom: 24px; }}
            .code-box {{ font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #00E676; background-color: #0A101A; border: 1px dashed #00B2FE; border-radius: 12px; padding: 16px 24px; margin: 0 auto 24px auto; display: inline-block; }}
            .expiry {{ font-size: 12px; color: #FF9800; margin-bottom: 24px; }}
            .footer {{ font-size: 11px; color: #526077; border-top: 1px solid #1F2A3D; padding-top: 16px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">⚡ CryptoAI</div>
            <div class="title">E-Posta Doğrulama Kodu</div>
            <div class="desc">CryptoAI hesabınızı güvenle aktifleştirmek için aşağıdaki 6 haneli doğrulama kodunu kullanın.</div>
            <div class="code-box">{code}</div>
            <div class="expiry">⏱ Bu kod 10 dakika boyunca geçerlidir.</div>
            <div class="footer">Bu isteği siz yapmadıysanız lütfen bu mesajı dikkate almayın.</div>
        </div>
    </body>
    </html>
    """

    plain_content = f"CryptoAI Doğrulama Kodunuz: {code}\nBu kod 10 dakika boyunca geçerlidir."

    # E-posta mesajını oluştur
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_USER or 'noreply@cryptoai.com'}>"
    msg["To"] = to_email

    msg.attach(MIMEText(plain_content, "plain", "utf-8"))
    msg.attach(MIMEText(html_content, "html", "utf-8"))

    # SMTP ayarları mevcutsa gerçek e-posta gönder
    if settings.SMTP_USER and settings.SMTP_PASSWORD:
        try:
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(settings.SMTP_USER, [to_email], msg.as_string())
                logger.info(f"✅ Doğrulama kodu e-postası başarıyla gönderildi: {to_email}")
                return True
        except Exception as e:
            logger.error(f"❌ SMTP e-posta gönderiminde hata: {e}")

    # Fallback / Dev modu: Geliştirme kolaylığı için terminale logla
    logger.info("=" * 60)
    logger.info(f"📧 [DEV / SIMULATION] TO: {to_email} | KOD: {code}")
    logger.info("=" * 60)
    return True
