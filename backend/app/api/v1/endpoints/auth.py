import time
import random
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token
from app.models.user import User
from app.models.portfolio import Portfolio, Holding
from app.models.autopilot import AutopilotStatus, AutopilotSettingsModel
from app.models.verification_code import VerificationCode
from app.services.email_service import send_verification_email
from app.schemas.user import (
    UserDto,
    UserRegisterRequest,
    UserLoginRequest,
    UserProfileUpdateRequest,
    AuthResponseDto,
    VerifyCodeRequest,
    ResendCodeRequest,
    RegisterResponseDto,
)
from app.api.deps import get_current_user

router = APIRouter()


@router.post("/register", response_model=RegisterResponseDto, status_code=status.HTTP_201_CREATED)
def register(
    req: UserRegisterRequest,
    db: Session = Depends(get_db),
):
    """
    Yeni kullanıcı kaydı oluşturur:
    - Kullanıcıyı is_email_verified = False olarak kaydeder
    - 6 haneli doğrulama kodu (OTP) üretip 10 dakika geçerlilikle veritabanına kaydeder
    - Gmail SMTP üzerinden doğrulama e-postası gönderir
    - Kullanıcıya kod doğrulama ekranına yönlendirmesi için yanıt döner
    """
    clean_email = req.email.lower().strip()
    existing_user = db.query(User).filter(User.email == clean_email).first()

    if existing_user and existing_user.is_email_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu e-posta adresiyle zaten bir hesap mevcut, lütfen giriş yapın.",
        )

    # Henüz doğrulanmamış mevcut bir kayıt varsa şifresini ve bilgilerini güncelle
    if existing_user and not existing_user.is_email_verified:
        existing_user.first_name = req.first_name.strip()
        existing_user.last_name = req.last_name.strip()
        existing_user.hashed_password = get_password_hash(req.password)
        new_user = existing_user
    else:
        user_id = f"usr_{int(time.time() * 1000)}"
        user_uid = str(random.randint(100000000, 999999999))

        new_user = User(
            id=user_id,
            uid=user_uid,
            first_name=req.first_name.strip(),
            last_name=req.last_name.strip(),
            email=clean_email,
            hashed_password=get_password_hash(req.password),
            is_email_verified=False,
        )
        db.add(new_user)
        db.flush()

        # $10.000 Sanal Başlangıç Bakiyesi ve Portföy
        portfolio = Portfolio(
            user_id=new_user.id,
            total_balance_usd=10000.0,
            daily_change_usd=0.0,
            is_autopilot_active=False,
            llm_analysis_text="CryptoAI'a hoş geldiniz! Sanal bakiyenizle alım-satım yapmaya başlayabilir veya Otopilot modunu devreye alabilirsiniz.",
        )
        db.add(portfolio)
        db.flush()

        cash_holding = Holding(
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
        )
        db.add(cash_holding)

        autopilot_status = AutopilotStatus(
            user_id=new_user.id,
            is_running=False,
            active_model_name="LSTM + XGBoost Hybrid Model",
            realized_profit_24h=0.0,
            success_rate_percent=0.0,
            total_trades_count=0,
        )
        db.add(autopilot_status)

        autopilot_settings = AutopilotSettingsModel(
            user_id=new_user.id,
            risk_profile="Dengeli",
            stop_loss_percent=10.0,
            take_profit_percent=20.0,
            max_trade_allocation_percent=25.0,
        )
        db.add(autopilot_settings)

    # 6 Haneli Doğrulama Kodu Üret (OTP)
    otp_code = f"{random.randint(100000, 999999)}"
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

    # Eski kullanılmamış kodları geçersiz kıl
    db.query(VerificationCode).filter(
        VerificationCode.email == clean_email,
        VerificationCode.is_used == False,
    ).update({"is_used": True})

    verif_record = VerificationCode(
        email=clean_email,
        code=otp_code,
        expires_at=expires_at,
        is_used=False,
    )
    db.add(verif_record)
    db.commit()
    db.refresh(new_user)

    # E-postayı Gmail SMTP üzerinden gönder
    send_verification_email(clean_email, otp_code)

    return RegisterResponseDto(
        message="6 haneli doğrulama kodu e-posta adresinize gönderildi.",
        email=clean_email,
        status="verification_required",
        requires_verification=True,
        token=None,
        user=None,
    )


@router.post("/verify-email", response_model=AuthResponseDto)
@router.post("/verify-code", response_model=AuthResponseDto)
def verify_code(
    req: VerifyCodeRequest,
    db: Session = Depends(get_db),
):
    """
    6 haneli OTP doğrulama kodunu doğrular:
    - Kodu kontrol eder (süresi dolmamış ve kullanılmamış)
    - Kullanıcının hesabını is_email_verified = True olarak aktifleştirir
    - Oturum JWT jetonu üretip kullanıcıyı sisteme alır
    """
    clean_email = req.email.lower().strip()
    now_utc = datetime.now(timezone.utc)

    verif_record = (
        db.query(VerificationCode)
        .filter(
            VerificationCode.email == clean_email,
            VerificationCode.code == req.code.strip(),
            VerificationCode.is_used == False,
            VerificationCode.expires_at > now_utc,
        )
        .order_by(VerificationCode.created_at.desc())
        .first()
    )

    if not verif_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Girdiğiniz doğrulama kodu geçersiz veya süresi dolmuş. Lütfen kontrol edip tekrar deneyin.",
        )

    # Kodu kullanıldı olarak işaretle
    verif_record.is_used = True

    # Kullanıcıyı aktifleştir
    user = db.query(User).filter(User.email == clean_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")

    user.is_email_verified = True
    db.commit()
    db.refresh(user)

    # Oturum açma jetonu üret
    token = create_access_token(subject=user.id)

    return AuthResponseDto(
        token=token,
        user=UserDto.model_validate(user),
    )


@router.post("/resend-verification")
@router.post("/resend-code")
def resend_verification_code(
    req: ResendCodeRequest,
    db: Session = Depends(get_db),
):
    """E-postaya yeni bir 6 haneli doğrulama kodu gönderir."""
    clean_email = req.email.lower().strip()
    user = db.query(User).filter(User.email == clean_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")

    if user.is_email_verified:
        return {"success": True, "message": "Hesabınız zaten doğrulanmış durumdadır."}

    otp_code = f"{random.randint(100000, 999999)}"
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

    # Eski kodları kapat
    db.query(VerificationCode).filter(
        VerificationCode.email == clean_email,
        VerificationCode.is_used == False,
    ).update({"is_used": True})

    verif_record = VerificationCode(
        email=clean_email,
        code=otp_code,
        expires_at=expires_at,
        is_used=False,
    )
    db.add(verif_record)
    db.commit()

    send_verification_email(clean_email, otp_code)

    return {"success": True, "message": "Yeni doğrulama kodu e-postanıza iletildi."}


@router.post("/login", response_model=AuthResponseDto)
def login(
    req: UserLoginRequest,
    db: Session = Depends(get_db),
):
    """
    Kullanıcı girişi yapar.
    Hesap doğrulanmamışsa kullanıcıyı OTP doğrulamasına yönlendirmek üzere uyarı verir.
    """
    clean_email = req.email.lower().strip()
    user = db.query(User).filter(User.email == clean_email).first()

    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-posta veya şifre hatalı. Lütfen kontrol edin.",
        )

    # Eğer e-posta henüz doğrulanmamışsa yeni kod gönder ve uyar
    if not user.is_email_verified:
        otp_code = f"{random.randint(100000, 999999)}"
        verif = VerificationCode(
            email=clean_email,
            code=otp_code,
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=10),
            is_used=False,
        )
        db.add(verif)
        db.commit()
        send_verification_email(clean_email, otp_code)

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="E-posta adresiniz henüz doğrulanmamış. Yeni bir doğrulama kodu gönderildi.",
        )

    token = create_access_token(subject=user.id)

    return AuthResponseDto(
        token=token,
        user=UserDto.model_validate(user),
    )


@router.get("/me", response_model=UserDto)
def get_current_user_profile(
    current_user: User = Depends(get_current_user),
):
    """Mevcut oturum açmış kullanıcının profil bilgilerini döner."""
    return UserDto.model_validate(current_user)


@router.put("/profile", response_model=UserDto)
def update_profile(
    req: UserProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Kullanıcının ad ve soyad bilgilerini günceller."""
    current_user.first_name = req.first_name.strip()
    current_user.last_name = req.last_name.strip()
    db.commit()
    db.refresh(current_user)
    return UserDto.model_validate(current_user)


@router.post("/refresh", response_model=AuthResponseDto)
def refresh_session(
    current_user: User = Depends(get_current_user),
):
    """Oturum süresini 30 gün uzatır ve taze JWT döner."""
    new_token = create_access_token(subject=current_user.id)
    return AuthResponseDto(
        token=new_token,
        user=UserDto.model_validate(current_user),
    )
