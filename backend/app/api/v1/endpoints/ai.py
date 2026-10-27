import logging
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.ai_service import generate_gemini_reply, MODEL_NAME

logger = logging.getLogger(__name__)

router = APIRouter()


class ChatMessageRequest(BaseModel):
    message: Optional[str] = None
    prompt: Optional[str] = None


class ChatMessageResponse(BaseModel):
    reply: str
    model: str = MODEL_NAME
    success: bool = True


@router.post("/chat", response_model=ChatMessageResponse)
@router.post("/message", response_model=ChatMessageResponse)
async def chat_message(req: ChatMessageRequest):
    """
    Google Gemini (gemini-2.0-flash) ile kripto para ve portföy danışmanlığı mesajı yanıtlar.
    """
    user_prompt = (req.message or req.prompt or "").strip()
    if not user_prompt:
        raise HTTPException(status_code=400, detail="Mesaj içeriği boş olamaz.")

    reply = await generate_gemini_reply(user_prompt)
    return ChatMessageResponse(reply=reply, model=MODEL_NAME, success=True)
