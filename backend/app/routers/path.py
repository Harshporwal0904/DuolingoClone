from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import User, Unit, Skill, UserSkillProgress, SkillStatus
from app.schemas import UserMeOut, PathUnitOut, PathSkillOut
from app.services.hearts import regenerate_hearts

router = APIRouter()

# Note: All endpoints are scoped to user_id=1 for now.
# Real authentication/user retrieval would plug in here.
DEFAULT_USER_ID = 1

@router.get("/user/me", response_model=UserMeOut)
def get_user_me(db: Session = Depends(get_db)):
    """
    Returns the current user's state. Computes and updates heart regeneration.
    """
    user = db.query(User).filter(User.id == DEFAULT_USER_ID).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Process heart regeneration before returning user state
    user = regenerate_hearts(db, user)
    return user

@router.get("/path", response_model=List[PathUnitOut])
def get_path(db: Session = Depends(get_db)):
    """
    Returns the full course structure: units -> skills.
    Each skill is annotated with the user's status and crowns.
    """
    # Fetch all units ordered by order_index
    units = db.query(Unit).order_by(Unit.order_index.asc()).all()
    
    # Fetch user progress mapping for default user
    progresses = db.query(UserSkillProgress).filter(UserSkillProgress.user_id == DEFAULT_USER_ID).all()
    progress_map = {p.skill_id: p for p in progresses}
    
    path_units = []
    for unit in units:
        # Fetch skills under this unit ordered by order_index
        skills = db.query(Skill).filter(Skill.unit_id == unit.id).order_by(Skill.order_index.asc()).all()
        
        path_skills = []
        for skill in skills:
            progress = progress_map.get(skill.id)
            status = progress.status if progress else SkillStatus.LOCKED
            crowns = progress.crowns if progress else 0
            
            path_skills.append(
                PathSkillOut(
                    id=skill.id,
                    title=skill.title,
                    order_index=skill.order_index,
                    icon=skill.icon,
                    status=status,
                    crowns=crowns
                )
            )
            
        path_units.append(
            PathUnitOut(
                id=unit.id,
                title=unit.title,
                order_index=unit.order_index,
                skills=path_skills
            )
        )
        
    return path_units

@router.post("/user/refill-hearts", response_model=UserMeOut)
def refill_hearts(db: Session = Depends(get_db)):
    """
    Instantly refills user hearts to 5 and clears last_heart_lost_at.
    """
    user = db.query(User).filter(User.id == DEFAULT_USER_ID).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.hearts = 5
    user.last_heart_lost_at = None
    db.commit()
    db.refresh(user)
    return user
