import enum
from datetime import datetime, date
from sqlalchemy import Column, Integer, String, DateTime, Date, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship

from .database import Base

class ExerciseType(str, enum.Enum):
    MULTIPLE_CHOICE = "multiple_choice"
    TRANSLATE = "translate"
    TYPE_ANSWER = "type_answer"

class SkillStatus(str, enum.Enum):
    LOCKED = "locked"
    AVAILABLE = "available"
    COMPLETED = "completed"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    total_xp = Column(Integer, default=0, nullable=False)
    streak_count = Column(Integer, default=0, nullable=False)
    hearts = Column(Integer, default=5, nullable=False)
    last_heart_lost_at = Column(DateTime, nullable=True)
    last_active_date = Column(Date, nullable=True)
    daily_xp_goal = Column(Integer, default=20, nullable=False)
    xp_today = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    skill_progresses = relationship("UserSkillProgress", back_populates="user", cascade="all, delete-orphan")
    lesson_completions = relationship("UserLessonCompletion", back_populates="user", cascade="all, delete-orphan")

class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    language_code = Column(String, nullable=False)

    # Relationships
    units = relationship("Unit", back_populates="course", cascade="all, delete-orphan")

class Unit(Base):
    __tablename__ = "units"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    title = Column(String, nullable=False)
    order_index = Column(Integer, nullable=False)

    # Relationships
    course = relationship("Course", back_populates="units")
    skills = relationship("Skill", back_populates="unit", cascade="all, delete-orphan")

class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=False)
    title = Column(String, nullable=False)
    order_index = Column(Integer, nullable=False)
    icon = Column(String, nullable=True)

    # Relationships
    unit = relationship("Unit", back_populates="skills")
    lessons = relationship("Lesson", back_populates="skill", cascade="all, delete-orphan")
    user_progresses = relationship("UserSkillProgress", back_populates="skill", cascade="all, delete-orphan")

class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True, index=True)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False)
    order_index = Column(Integer, nullable=False)

    # Relationships
    skill = relationship("Skill", back_populates="lessons")
    exercises = relationship("Exercise", back_populates="lesson", cascade="all, delete-orphan")
    user_completions = relationship("UserLessonCompletion", back_populates="lesson", cascade="all, delete-orphan")

class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True, index=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=False)
    order_index = Column(Integer, nullable=False)
    type = Column(Enum(ExerciseType), nullable=False)
    prompt = Column(String, nullable=False)
    correct_answer = Column(String, nullable=False)
    options = Column(JSON, nullable=True)

    # Relationships
    lesson = relationship("Lesson", back_populates="exercises")

class UserSkillProgress(Base):
    __tablename__ = "user_skill_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False)
    crowns = Column(Integer, default=0, nullable=False)
    status = Column(Enum(SkillStatus), default=SkillStatus.LOCKED, nullable=False)
    lessons_completed = Column(Integer, default=0, nullable=False)

    # Relationships
    user = relationship("User", back_populates="skill_progresses")
    skill = relationship("Skill", back_populates="user_progresses")

class UserLessonCompletion(Base):
    __tablename__ = "user_lesson_completion"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=False)
    completed_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    xp_earned = Column(Integer, nullable=False)

    # Relationships
    user = relationship("User", back_populates="lesson_completions")
    lesson = relationship("Lesson", back_populates="user_completions")
