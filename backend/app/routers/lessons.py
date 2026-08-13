from datetime import datetime, date, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import (
    User, Lesson, Exercise, UserLessonCompletion, 
    UserSkillProgress, Skill, Unit, SkillStatus
)
from app.schemas import (
    ExerciseOut, AnswerCheckIn, AnswerCheckOut, 
    LessonCompleteIn, LessonCompleteOut
)

router = APIRouter()

# Note: All endpoints are scoped to user_id=1 for now.
# Real authentication/user retrieval would plug in here.
DEFAULT_USER_ID = 1

@router.get("/lessons/{lesson_id}", response_model=List[ExerciseOut])
def get_lesson_exercises(lesson_id: int, db: Session = Depends(get_db)):
    """
    Returns the exercises for a given lesson sorted by order_index.
    Does not expose correct_answer.
    """
    exercises = db.query(Exercise).filter(Exercise.lesson_id == lesson_id).order_by(Exercise.order_index.asc()).all()
    return exercises

@router.post("/lessons/{lesson_id}/exercises/{exercise_id}/check", response_model=AnswerCheckOut)
def check_exercise_answer(
    lesson_id: int,
    exercise_id: int,
    payload: AnswerCheckIn,
    db: Session = Depends(get_db)
):
    """
    Checks the submitted exercise answer case-insensitively, trimming whitespace.
    Decrements user hearts by 1 if incorrect (floor 0) and sets last_heart_lost_at.
    """
    # Fetch exercise
    exercise = db.query(Exercise).filter(
        Exercise.id == exercise_id, 
        Exercise.lesson_id == lesson_id
    ).first()
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found in this lesson")
        
    user = db.query(User).filter(User.id == DEFAULT_USER_ID).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    submitted = payload.answer.strip().lower()
    correct_ans = exercise.correct_answer.strip().lower()
    is_correct = (submitted == correct_ans)

    if not is_correct:
        # Decrement user hearts (floor 0)
        if user.hearts > 0:
            user.hearts -= 1
        
        # Start regeneration timer if hearts dropped below 5 and timer not already running
        if user.hearts < 5 and user.last_heart_lost_at is None:
            user.last_heart_lost_at = datetime.utcnow()
            
        db.commit()
        db.refresh(user)

    return AnswerCheckOut(
        correct=is_correct,
        correct_answer=exercise.correct_answer
    )

@router.post("/lessons/{lesson_id}/complete", response_model=LessonCompleteOut)
def complete_lesson(
    lesson_id: int,
    payload: LessonCompleteIn,
    db: Session = Depends(get_db)
):
    """
    Handles lesson completion: awards XP, updates progress, unlocks next skills, and updates streak.
    """
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    user = db.query(User).filter(User.id == DEFAULT_USER_ID).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 1. Compute and add XP
    xp_earned = 10 + 2 * payload.correct_count
    user.total_xp += xp_earned
    user.xp_today += xp_earned

    # 2. Record completion history
    completion = UserLessonCompletion(
        user_id=user.id,
        lesson_id=lesson.id,
        xp_earned=xp_earned
    )
    db.add(completion)

    # 3. Update UserSkillProgress for the lesson's skill
    skill_id = lesson.skill_id
    progress = db.query(UserSkillProgress).filter_by(
        user_id=user.id, 
        skill_id=skill_id
    ).first()
    
    if not progress:
        progress = UserSkillProgress(
            user_id=user.id,
            skill_id=skill_id,
            status=SkillStatus.LOCKED,
            crowns=0,
            lessons_completed=0
        )
        db.add(progress)

    progress.lessons_completed += 1
    
    # Check if skill is completed
    total_lessons_in_skill = db.query(Lesson).filter_by(skill_id=skill_id).count()
    if progress.lessons_completed >= total_lessons_in_skill:
        progress.status = SkillStatus.COMPLETED
        progress.crowns += 1
        
        # Unlock next skill
        skill = db.query(Skill).filter_by(id=skill_id).first()
        unit = db.query(Unit).filter_by(id=skill.unit_id).first()
        
        # Try to find next skill in same unit
        next_skill = db.query(Skill).filter(
            Skill.unit_id == skill.unit_id,
            Skill.order_index > skill.order_index
        ).order_by(Skill.order_index.asc()).first()
        
        if next_skill:
            next_progress = db.query(UserSkillProgress).filter_by(
                user_id=user.id, 
                skill_id=next_skill.id
            ).first()
            
            if not next_progress:
                next_progress = UserSkillProgress(
                    user_id=user.id,
                    skill_id=next_skill.id,
                    status=SkillStatus.AVAILABLE,
                    crowns=0,
                    lessons_completed=0
                )
                db.add(next_progress)
            elif next_progress.status == SkillStatus.LOCKED:
                next_progress.status = SkillStatus.AVAILABLE
        else:
            # Look for first skill of the next unit
            next_unit = db.query(Unit).filter(
                Unit.course_id == unit.course_id,
                Unit.order_index > unit.order_index
            ).order_by(Unit.order_index.asc()).first()
            
            if next_unit:
                first_skill_next_unit = db.query(Skill).filter(
                    Skill.unit_id == next_unit.id
                ).order_by(Skill.order_index.asc()).first()
                
                if first_skill_next_unit:
                    next_progress = db.query(UserSkillProgress).filter_by(
                        user_id=user.id, 
                        skill_id=first_skill_next_unit.id
                    ).first()
                    
                    if not next_progress:
                        next_progress = UserSkillProgress(
                            user_id=user.id,
                            skill_id=first_skill_next_unit.id,
                            status=SkillStatus.AVAILABLE,
                            crowns=0,
                            lessons_completed=0
                        )
                        db.add(next_progress)
                    elif next_progress.status == SkillStatus.LOCKED:
                        next_progress.status = SkillStatus.AVAILABLE

    # 4. Update user's streak
    today = datetime.utcnow().date()
    if user.last_active_date is None:
        user.streak_count = 1
    else:
        delta = today - user.last_active_date
        if delta.days == 1:
            user.streak_count += 1
        elif delta.days > 1:
            user.streak_count = 1
            
    user.last_active_date = today

    db.commit()
    db.refresh(user)
    db.refresh(progress)

    return LessonCompleteOut(
        xp_earned=xp_earned,
        new_total_xp=user.total_xp,
        streak_count=user.streak_count,
        crowns=progress.crowns,
        skill_status=progress.status
    )

@router.post("/user/advance-day")
def advance_day(db: Session = Depends(get_db)):
    """
    DEV/TESTING ONLY endpoint.
    Manually rolls back user's last_active_date by 1 day.
    """
    user = db.query(User).filter(User.id == DEFAULT_USER_ID).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.last_active_date:
        user.last_active_date = user.last_active_date - timedelta(days=1)
    else:
        user.last_active_date = datetime.utcnow().date() - timedelta(days=1)
        
    db.commit()
    db.refresh(user)
    
    return {
        "message": "last_active_date rolled back by 1 day",
        "last_active_date": str(user.last_active_date)
    }
