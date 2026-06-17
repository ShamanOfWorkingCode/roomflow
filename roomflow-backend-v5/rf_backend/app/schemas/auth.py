from pydantic import BaseModel, Field, EmailStr


class RegisterRequest(BaseModel):
    full_name: str = Field(..., max_length=150)
    email: EmailStr
    password: str = Field(..., min_length=4, max_length=72)
    department: str = Field(..., max_length=100)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=4, max_length=72)


class AuthEmployeeOut(BaseModel):
    """Данные сотрудника, возвращаемые после логина/регистрации (без пароля)."""
    id: int
    full_name: str
    email: str
    department: str
    is_manager: bool

    model_config = {"from_attributes": True}
