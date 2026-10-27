from typing import Optional
from pydantic import EmailStr, Field
from app.schemas.base import CamelModel


class UserDto(CamelModel):
    id: str
    first_name: str
    last_name: str
    email: str
    uid: str
    is_email_verified: bool = True


class UserRegisterRequest(CamelModel):
    first_name: str = Field(..., alias="firstName")
    last_name: str = Field(..., alias="lastName")
    email: EmailStr
    password: str

    model_config = {
        "populate_by_name": True,
        "extra": "ignore",
    }


class UserLoginRequest(CamelModel):
    email: EmailStr
    password: str = Field(..., alias="password")

    model_config = {
        "populate_by_name": True,
        "extra": "ignore",
    }


class UserProfileUpdateRequest(CamelModel):
    first_name: str = Field(..., alias="firstName")
    last_name: str = Field(..., alias="lastName")

    model_config = {
        "populate_by_name": True,
        "extra": "ignore",
    }


class AuthResponseDto(CamelModel):
    token: str
    user: UserDto


class VerifyCodeRequest(CamelModel):
    email: EmailStr
    code: str


class ResendCodeRequest(CamelModel):
    email: EmailStr


class RegisterResponseDto(CamelModel):
    message: str
    email: str
    status: Optional[str] = "verification_required"
    requires_verification: bool = True
    token: Optional[str] = None
    user: Optional[UserDto] = None
