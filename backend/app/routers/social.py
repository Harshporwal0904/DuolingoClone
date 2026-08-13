from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from app.database import get_db
from app.models import User, UserSkillProgress
from app.schemas import LeaderboardUserOut, UserProfileOut

router = APIRouter()

# Note: All endpoints are scoped to user_id=1 for now.
# Real authentication/user retrieval would plug in here.
DEFAULT_USER_ID = 1

@router.get("/leaderboard", response_model=List[LeaderboardUserOut])
def get_leaderboard(db: Session = Depends(get_db)):
    """
    Returns all seeded users + default user sorted by total_xp descending, with calculated rank.
    """
    users = db.query(User).order_by(User.total_xp.desc()).all()
    
    leaderboard = []
    for index, user in enumerate(users):
        leaderboard.append(
            LeaderboardUserOut(
                username=user.username,
                total_xp=user.total_xp,
                rank=index + 1
            )
        )
    return leaderboard

@router.get("/user/profile", response_model=UserProfileOut)
def get_user_profile(db: Session = Depends(get_db)):
    """
    Returns default user stats: username, total_xp, streak_count, join info (created_at), 
    and total completed crowns count.
    """
    user = db.query(User).filter(User.id == DEFAULT_USER_ID).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Sum crowns across all UserSkillProgress rows for this user
    crowns_sum = db.query(func.sum(UserSkillProgress.crowns)).filter(
        UserSkillProgress.user_id == user.id
    ).scalar()
    
    crowns_count = crowns_sum if crowns_sum is not None else 0
    
    return UserProfileOut(
        username=user.username,
        total_xp=user.total_xp,
        streak_count=user.streak_count,
        created_at=user.created_at,
        crowns_count=crowns_count
    )
