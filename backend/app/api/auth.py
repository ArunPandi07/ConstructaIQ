from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user
from app.config.settings import settings
from app.db.models.user import User
from app.db.repositories.user_repository import UserRepository
from app.db.session import get_db_required
from app.schemas.api_response import ApiResponse, success_response
from app.schemas.user import Token, UserCreate, UserRead, UserUpdate
from app.services.auth_service import create_access_token, get_password_hash, verify_password

router = APIRouter(prefix="/auth", tags=["Authentication"])


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/register", response_model=ApiResponse[UserRead], status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    session: AsyncSession = Depends(get_db_required),
):
    """Register a new user."""
    user_repo = UserRepository(session)

    # Check if email already exists
    existing_user = await user_repo.get_by_email(user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Hash password and create user
    hashed_password = get_password_hash(user_data.password)
    user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        full_name=user_data.full_name,
    )
    created_user = await user_repo.create(user)
    await session.commit()
    return success_response(created_user, "User registered successfully")


@router.post("/login", response_model=ApiResponse[Token])
async def login(
    login_request: LoginRequest,
    session: AsyncSession = Depends(get_db_required),
):
    """Authenticate user and return JWT token."""
    user_repo = UserRepository(session)
    user = await user_repo.get_by_email(login_request.email)

    if not user or not verify_password(login_request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive",
        )

    # Create JWT token
    access_token = create_access_token(
        data={"sub": str(user.user_id)},  # JWT requires sub to be a string
        expires_delta=timedelta(hours=settings.JWT_ACCESS_TOKEN_EXPIRE_HOURS),
    )

    return success_response(
        Token(access_token=access_token, token_type="bearer"),
        "Login successful"
    )


@router.get("/me", response_model=ApiResponse[UserRead])
async def get_current_user_info(
    current_user: User = Depends(get_current_user),
):
    """Get current authenticated user's profile."""
    return success_response(current_user)


@router.put("/me", response_model=ApiResponse[UserRead])
async def update_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_required),
):
    """Update current user's profile (email, name, password)."""
    user_repo = UserRepository(session)

    # If changing password, verify current password
    if user_update.new_password:
        if not user_update.current_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password required to change password",
            )
        if not verify_password(user_update.current_password, current_user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect",
            )
        current_user.hashed_password = get_password_hash(user_update.new_password)

    # Update other fields
    if user_update.email:
        # Check if new email is already taken
        existing = await user_repo.get_by_email(user_update.email)
        if existing and existing.user_id != current_user.user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already in use",
            )
        current_user.email = user_update.email

    if user_update.full_name:
        current_user.full_name = user_update.full_name

    await session.commit()
    await session.refresh(current_user)
    return success_response(current_user, "Profile updated successfully")


@router.post("/logout")
async def logout():
    """Logout endpoint (client-side token removal)."""
    # With JWT, logout is client-side (remove token from localStorage)
    # For true server-side logout, implement token blacklist/revocation
    return {"message": "Logout successful"}
