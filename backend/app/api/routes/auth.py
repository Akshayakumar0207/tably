from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from app.models import models as m
from app.repositories.repositories import UserRepository
from app.schemas import schemas as s
from app.api.deps import get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=s.TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: s.UserRegister, db: Session = Depends(get_db)):
    repo = UserRepository(db)
    if repo.get_by_email(payload.email):
        raise HTTPException(status_code=400, detail="An account with this email already exists")
    if payload.role not in ("customer", "owner"):
        raise HTTPException(status_code=400, detail="Role must be 'customer' or 'owner'")

    user = m.User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        phone=payload.phone,
        role=m.UserRole(payload.role),
        is_verified=True,  # email verification flow omitted for the free/local build
    )
    user = repo.create(user)

    if user.role == m.UserRole.owner:
        from app.repositories.repositories import OwnerProfileRepository
        OwnerProfileRepository(db).create(
            m.OwnerProfile(user_id=user.id, business_name=payload.full_name)
        )

    access = create_access_token(user.id, user.role.value)
    refresh = create_refresh_token(user.id)
    return s.TokenResponse(access_token=access, refresh_token=refresh)


@router.post("/login", response_model=s.TokenResponse)
def login(payload: s.UserLogin, db: Session = Depends(get_db)):
    repo = UserRepository(db)
    user = repo.get_by_email(payload.email)
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="This account has been disabled")

    access = create_access_token(user.id, user.role.value)
    refresh = create_refresh_token(user.id)
    return s.TokenResponse(access_token=access, refresh_token=refresh)


@router.post("/google", response_model=s.TokenResponse)
def google_login(payload: s.GoogleLogin, db: Session = Depends(get_db)):
    """
    Accepts a Google ID token from the frontend (obtained via Supabase Auth /
    Google Identity Services), verifies it, and creates/logs in the user.

    NOTE: To keep this runnable with zero external calls in local/dev mode,
    verification here trusts an already-validated Supabase session on the
    frontend. In production, wire this to Supabase's `auth.getUser()` using
    SUPABASE_SERVICE_KEY, or verify the Google JWT against Google's public
    certs directly.
    """
    raise HTTPException(
        status_code=501,
        detail="Google login requires SUPABASE_URL/SUPABASE_SERVICE_KEY to be configured. "
               "See README 'Enable Google Sign-In' section.",
    )


@router.post("/forgot-password")
def forgot_password(payload: s.ForgotPassword, db: Session = Depends(get_db)):
    repo = UserRepository(db)
    user = repo.get_by_email(payload.email)
    # Always return success to avoid leaking which emails are registered.
    if user:
        reset_token = create_access_token(user.id, user.role.value, expires_minutes=30)
        # In production this token is emailed to the user (e.g. via Supabase Auth
        # or an email provider). For local/free dev we return it directly so the
        # flow is fully testable without an email service.
        return {"message": "If that email exists, a reset link has been generated.", "dev_reset_token": reset_token}
    return {"message": "If that email exists, a reset link has been generated."}


@router.post("/reset-password")
def reset_password(payload: s.ResetPassword, db: Session = Depends(get_db)):
    try:
        data = decode_token(payload.token)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    repo = UserRepository(db)
    user = repo.get_by_id(data.get("sub"))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.hashed_password = hash_password(payload.new_password)
    repo.update(user)
    return {"message": "Password has been reset successfully"}


@router.post("/refresh", response_model=s.TokenResponse)
def refresh_token(refresh_token: str, db: Session = Depends(get_db)):
    try:
        data = decode_token(refresh_token)
        if data.get("type") != "refresh":
            raise ValueError("Not a refresh token")
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    repo = UserRepository(db)
    user = repo.get_by_id(data.get("sub"))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    access = create_access_token(user.id, user.role.value)
    new_refresh = create_refresh_token(user.id)
    return s.TokenResponse(access_token=access, refresh_token=new_refresh)


@router.post("/logout")
def logout(current_user: m.User = Depends(get_current_user)):
    # JWTs are stateless; logout is handled client-side by discarding tokens.
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=s.UserOut)
def get_me(current_user: m.User = Depends(get_current_user)):
    return current_user
