from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models import User

def regenerate_hearts(db: Session, user: User) -> User:
    """
    Service function to handle heart regeneration.
    Regenerates 1 heart every 30 minutes if hearts < 5 and last_heart_lost_at is set.
    """
    if user.hearts >= 5:
        if user.last_heart_lost_at is not None:
            user.last_heart_lost_at = None
            db.commit()
            db.refresh(user)
        return user

    if user.last_heart_lost_at is None:
        return user

    now = datetime.utcnow()
    elapsed_time = now - user.last_heart_lost_at
    elapsed_minutes = elapsed_time.total_seconds() / 60.0
    
    hearts_to_regen = int(elapsed_minutes // 30)
    
    if hearts_to_regen > 0:
        user.hearts = min(5, user.hearts + hearts_to_regen)
        if user.hearts == 5:
            user.last_heart_lost_at = None
        else:
            # Shift the timestamp forward by the number of 30-minute blocks consumed
            user.last_heart_lost_at += timedelta(minutes=hearts_to_regen * 30)
        db.commit()
        db.refresh(user)
        
    return user
