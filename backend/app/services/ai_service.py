import os
import json
import asyncio
import logging
from typing import Optional, List, Tuple

try:
    import httpx
except ImportError:
    httpx = None

try:
    import urllib.request
    import urllib.error
except ImportError:
    urllib = None

from app.core.config import settings

logger = logging.getLogger(__name__)

# Birincil resmi model: gemini-2.0-flash
MODEL_NAME = "gemini-2.0-flash"
# Fallback modeller: gemini-1.5-flash ve diğer güncel modeller
FALLBACK_MODELS = ["gemini-1.5-flash", "gemini-3.5-flash", "gemini-flash-latest"]

SYSTEM_INSTRUCTION = (
    "Sen CryptoAI platformunun Türkçe konuşan uzman kripto para ve finansal piyasalar danışmanısın. "
    "Kullanıcılara Bitcoin, Ethereum, altcoinler, teknik analiz, RSI, Otopilot algoritması, "
    "stop-loss stratejileri ve portföy risk yönetimi konularında profesyonel, anlaşılır, kısa, yapıcı ve "
    "Türkçe yanıtlar verirsin. Yanıtlarını gereksiz uzatmadan, doğrudan sonuca odaklı, net ve madde imleriyle sunarsın. "
    "Basit selamlama veya genel sorularda samimi ve profesyonel karşıla; piyasa analizlerinde kesin yatırım tavsiyesi "
    "(YTD) vermek yerine teknik seviyeler, destek/direnç noktaları ve risk yönetimi rehberliği sağla."
)


def get_gemini_api_key() -> str:
    """
    GEMINI_API_KEY veya GOOGLE_API_KEY ortam değişkenini okur, temizler ve doğrular.
    """
    raw_key = (
        getattr(settings, "GEMINI_API_KEY", "")
        or getattr(settings, "GOOGLE_API_KEY", "")
        or os.environ.get("GEMINI_API_KEY", "")
        or os.environ.get("GOOGLE_API_KEY", "")
    )
    clean_key = raw_key.strip().strip('"').strip("'")

    if not clean_key:
        for env_path in [".env", "backend/.env", "../.env"]:
            if os.path.exists(env_path):
                try:
                    with open(env_path, "r", encoding="utf-8") as f:
                        for line in f:
                            line = line.strip()
                            if line.startswith("GEMINI_API_KEY=") or line.startswith("GOOGLE_API_KEY="):
                                clean_key = line.split("=", 1)[1].strip().strip('"').strip("'")
                                if clean_key:
                                    break
                except Exception:
                    pass
            if clean_key:
                break

    if clean_key:
        masked = f"{clean_key[:6]}...{clean_key[-4:]}" if len(clean_key) > 10 else "***"
        logger.info(f"🔑 [GEMINI CONFIG] API anahtarı yüklendi (Maskeli: {masked})")
    else:
        print("❌ [GEMINI CONFIG ERROR] .env dosyasında GEMINI_API_KEY veya GOOGLE_API_KEY bulunamadı!", flush=True)
        logger.error("[GEMINI CONFIG ERROR] .env dosyasında GEMINI_API_KEY veya GOOGLE_API_KEY bulunamadı!")

    return clean_key


async def _execute_gemini_http_request(url: str, payload: dict) -> Tuple[int, str]:
    """
    httpx veya standart kütüphane (urllib) ile asenkron HTTP POST isteği yürütür.
    Dönen HTTP durum kodunu ve metin gövdesini (status_code, body) döner.
    """
    json_data = json.dumps(payload).encode("utf-8")
    headers = {"Content-Type": "application/json"}

    if httpx is not None:
        try:
            async with httpx.AsyncClient(timeout=25.0) as client:
                res = await client.post(url, json=payload, headers=headers)
                return res.status_code, res.text
        except Exception as e:
            return 0, str(e)

    def _sync_call():
        req = urllib.request.Request(url, data=json_data, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=25.0) as resp:
                return resp.status, resp.read().decode("utf-8")
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8") if hasattr(e, "read") else str(e)
            return e.code, err_body
        except Exception as e:
            return 0, str(e)

    return await asyncio.to_thread(_sync_call)


async def generate_gemini_reply(message: str) -> str:
    """
    Google Gemini ile yanıt üretir:
    1. Birincil model: gemini-2.0-flash
    2. 503, 429 veya bağlantı hatalarında 1.5 saniye aralıklarla en az 3 kez sessizce yeniden dener.
    3. 3 deneme sonucunda yanıt alınamazsa veya 404 durumunda otomatik olarak gemini-1.5-flash fallback'ine geçer.
    """
    api_key = get_gemini_api_key()
    if not api_key:
        return "Yapay zeka API anahtarı yapılandırılmamış. Lütfen .env dosyasında GEMINI_API_KEY tanımlayınız."

    models_to_try: List[str] = [MODEL_NAME] + [m for m in FALLBACK_MODELS if m != MODEL_NAME]

    last_error_code: Optional[int] = None
    last_error_msg: str = ""

    for model_idx, model in enumerate(models_to_try):
        print(f"🤖 [GEMINI AI] Model çağrısı başlatılıyor: {model}...", flush=True)
        logger.info(f"Gemini API model deneniyor: {model}")

        # 1. Google GenAI SDK Denemesi (varsa)
        try:
            from google import genai
            client = genai.Client(api_key=api_key)
            try:
                response = client.models.generate_content(
                    model=model,
                    contents=message,
                    config={
                        "system_instruction": SYSTEM_INSTRUCTION,
                        "temperature": 0.7,
                    },
                )
                if response and response.text:
                    reply_text = response.text.strip()
                    print(f"✅ [GEMINI SDK SUCCESS] Model: {model} yanıt üretti.", flush=True)
                    logger.info(f"Google GenAI SDK ({model}) yanıtı başarıyla alındı.")
                    return reply_text
            except Exception as sdk_call_err:
                err_str = str(sdk_call_err)
                print(f"❌ [GEMINI SDK ERROR] Model: {model} Hata: {err_str}", flush=True)
                logger.warning(f"Google GenAI SDK çağrı hatası ({model}): {err_str}")
        except ImportError:
            pass
        except Exception as sdk_init_err:
            logger.debug(f"GenAI SDK başlatılamadı: {sdk_init_err}")

        # 2. Resmi Google Gemini REST API Denemesi (v1beta)
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        payload = {
            "system_instruction": {
                "parts": [{"text": SYSTEM_INSTRUCTION}]
            },
            "contents": [
                {
                    "parts": [{"text": message}]
                }
            ],
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 1000,
            },
        }

        # 503, 429 veya bağlantı hatalarında 1.5 saniye aralıklarla en az 3 deneme
        max_retries = 3
        for attempt in range(max_retries):
            status_code, body = await _execute_gemini_http_request(url, payload)

            if status_code == 200:
                try:
                    data = json.loads(body)
                    candidates = data.get("candidates", [])
                    if candidates and len(candidates) > 0:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts and "text" in parts[0]:
                            reply_text = parts[0]["text"].strip()
                            print(f"✅ [GEMINI SUCCESS] Model: {model} HTTP 200 yanıt verdi.", flush=True)
                            logger.info(f"Gemini REST API ({model}) yanıtı başarıyla alındı.")
                            return reply_text
                except Exception as parse_err:
                    print(f"⚠️ [GEMINI PARSE ERROR] Model: {model} JSON ayrıştırma hatası: {parse_err}", flush=True)

            last_error_code = status_code
            last_error_msg = body[:300] if body else "Boş yanıt"
            print(
                f"❌ [GEMINI API ERROR] HTTP {status_code} - Model: {model} (Deneme {attempt + 1}/{max_retries}): {last_error_msg}",
                flush=True,
            )
            logger.error(f"[GEMINI API ERROR] HTTP {status_code} - Model: {model} (Deneme {attempt + 1}/{max_retries}): {last_error_msg}")

            # 404 (Model mevcut değil veya bu API versiyonunda kapalı) ise diğer denemelerle vakit kaybetmeden doğrudan fallback modele geç
            if status_code == 404:
                next_model = models_to_try[model_idx + 1] if model_idx + 1 < len(models_to_try) else "Yok"
                print(f"⚠️ [GEMINI 404] {model} kullanılamıyor, fallback modele ({next_model}) geçiliyor...", flush=True)
                break

            # 503 (Servis Yoğun / Unavailable), 429 (Rate Limit) veya 0 (Bağlantı Hatası) durumunda 1.5s aralıklarla yeniden dene
            if status_code in [503, 429, 0]:
                if attempt < max_retries - 1:
                    print(f"⏳ [GEMINI RETRY] {model} için HTTP {status_code} alındı. 1.5 saniye sonra yeniden deneniyor ({attempt + 2}/{max_retries})...", flush=True)
                    await asyncio.sleep(1.5)
                    continue

    # Tüm modeller ve denemeler tükendiğinde
    error_summary = f"(HTTP {last_error_code})" if last_error_code else ""
    return (
        f"Şu anda yapay zeka servisine bağlanırken bir sorun oluştu {error_summary}. "
        "Lütfen birkaç saniye sonra tekrar deneyiniz."
    )
