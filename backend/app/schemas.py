from datetime import datetime, date
from typing import List, Optional, Any
from pydantic import BaseModel, ConfigDict
from .models import ExerciseType, SkillStatus

# Common Config for Pydantic V2 ORM integration
class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

class UserOut(BaseSchema):
    id: int
    username: str
    total_xp: int
    streak_count: int
    hearts: int
    last_heart_lost_at: Optional[datetime] = None
    last_active_date: Optional[date] = None
    daily_xp_goal: int
    xp_today: int

class CourseOut(BaseSchema):
    id: int
    name: str
    language_code: str

class UnitOut(BaseSchema):
    id: int
    course_id: int
    title: str
    order_index: int

class LessonOut(BaseSchema):
    id: int
    skill_id: int
    order_index: int

class SkillOut(BaseSchema):
    id: int
    unit_id: int
    title: str
    order_index: int
    icon: Optional[str] = None
    lessons: List[LessonOut] = []

class ExerciseOut(BaseSchema):
    id: int
    lesson_id: int
    order_index: int
    type: ExerciseType
    prompt: str
    options: Optional[Any] = None

class ExerciseInternal(ExerciseOut):
    correct_answer: str

class UserSkillProgressOut(BaseSchema):
    id: int
    user_id: int
    skill_id: int
    crowns: int
    status: SkillStatus
    lessons_completed: int

class UserLessonCompletionOut(BaseSchema):
    id: int
    user_id: int
    lesson_id: int
    completed_at: datetime
    xp_earned: int

class UserMeOut(BaseSchema):
    id: int
    username: str
    total_xp: int
    streak_count: int
    hearts: int
    daily_xp_goal: int
    xp_today: int
    gems: int = 500

class PathSkillOut(BaseSchema):
    id: int
    title: str
    order_index: int
    icon: Optional[str] = None
    status: SkillStatus
    crowns: int

class PathUnitOut(BaseSchema):
    id: int
    title: str
    order_index: int
    skills: List[PathSkillOut]

