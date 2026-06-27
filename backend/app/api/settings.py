from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db_required
from app.db.models.user import User
from app.db.models.user_settings import UserSettings
from app.api.dependencies import get_current_user
from app.schemas.api_response import ApiResponse, success_response
from pydantic import BaseModel, ConfigDict

router = APIRouter(prefix="/settings", tags=["Settings"])

class UserSettingsUpdate(BaseModel):
    model_preference: str
    alert_weather_crane: bool
    alert_lumber_hedge: bool

class UserSettingsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    model_preference: str
    alert_weather_crane: bool
    alert_lumber_hedge: bool

@router.get("", response_model=ApiResponse[UserSettingsResponse])
async def get_settings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_required),
):
    user_id = current_user.user_id
    stmt = select(UserSettings).where(UserSettings.user_id == user_id)
    result = await db.execute(stmt)
    settings = result.scalar_one_or_none()
    
    if not settings:
        # Create default
        settings = UserSettings(
            user_id=user_id,
            model_preference="google/gemma-4-26b-a4b-it",
            alert_weather_crane=True,
            alert_lumber_hedge=True
        )
        db.add(settings)
        await db.commit()
        await db.refresh(settings)
        
    return success_response(UserSettingsResponse.model_validate(settings))

@router.put("", response_model=ApiResponse[UserSettingsResponse])
async def update_settings(
    payload: UserSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_required),
):
    user_id = current_user.user_id
    stmt = select(UserSettings).where(UserSettings.user_id == user_id)
    result = await db.execute(stmt)
    settings = result.scalar_one_or_none()
    
    if not settings:
        settings = UserSettings(user_id=user_id)
        db.add(settings)
        
    settings.alert_weather_crane = payload.alert_weather_crane
    settings.alert_lumber_hedge = payload.alert_lumber_hedge
    settings.model_preference = "google/gemma-4-26b-a4b-it"
    
    await db.commit()
    await db.refresh(settings)
    
    return success_response(UserSettingsResponse.model_validate(settings))
