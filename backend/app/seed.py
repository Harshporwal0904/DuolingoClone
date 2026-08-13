import sys
import os

# Add parent directory to path so app modules can be loaded when run as python -m app.seed
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import SessionLocal, engine, Base
from app.models import (
    User, Course, Unit, Skill, Lesson, Exercise, 
    UserSkillProgress, SkillStatus, ExerciseType
)

def seed_database():
    print("Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    
    print("Creating all tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        print("Seeding users...")
        # 1. Create Users
        # Default user (id=1, username="learner")
        default_user = User(
            id=1,
            username="learner",
            total_xp=0,
            streak_count=3,
            hearts=5,
            xp_today=0,
            daily_xp_goal=20
        )
        db.add(default_user)
        
        # Leaderboard users
        user2 = User(username="maria", total_xp=340, streak_count=12, hearts=5)
        user3 = User(username="carlos", total_xp=210, streak_count=5, hearts=4)
        user4 = User(username="sofia", total_xp=90, streak_count=1, hearts=5)
        db.add_all([user2, user3, user4])
        db.flush() # Flush to assign database IDs

        # 2. Create Course
        spanish = Course(name="Spanish", language_code="es")
        db.add(spanish)
        db.flush()

        # 3. Create Units and Skills
        basics_unit = Unit(course_id=spanish.id, title="Basics", order_index=1)
        phrases_unit = Unit(course_id=spanish.id, title="Phrases", order_index=2)
        db.add_all([basics_unit, phrases_unit])
        db.flush()

        # Skills under Basics
        greetings_skill = Skill(unit_id=basics_unit.id, title="Greetings", order_index=1, icon="hand")
        food_skill = Skill(unit_id=basics_unit.id, title="Food", order_index=2, icon="apple")
        animals_skill = Skill(unit_id=basics_unit.id, title="Animals", order_index=3, icon="dog")
        
        # Skills under Phrases
        travel_skill = Skill(unit_id=phrases_unit.id, title="Travel", order_index=1, icon="plane")
        questions_skill = Skill(unit_id=phrases_unit.id, title="Questions", order_index=2, icon="help")
        family_skill = Skill(unit_id=phrases_unit.id, title="Family", order_index=3, icon="heart")
        
        skills = [greetings_skill, food_skill, animals_skill, travel_skill, questions_skill, family_skill]
        db.add_all(skills)
        db.flush()

        # Define Vocabulary Data for each skill to populate Lessons and Exercises
        vocab_data = {
            "Greetings": [
                {"spa": "Hola", "eng": "Hello", "opts": ["Hello", "Goodbye", "Dog", "Thank you"]},
                {"spa": "Adiós", "eng": "Goodbye", "opts": ["Goodbye", "Hello", "Apple", "Please"]},
                {"spa": "Gracias", "eng": "Thank you", "opts": ["Thank you", "Please", "Water", "Welcome"]},
                {"spa": "Por favor", "eng": "Please", "opts": ["Please", "Thank you", "Yes", "Goodbye"]},
                {"spa": "Buenos días", "eng": "Good morning", "opts": ["Good morning", "Good night", "Hello", "Thank you"]},
            ],
            "Food": [
                {"spa": "Manzana", "eng": "Apple", "opts": ["Apple", "Bread", "Milk", "Cheese"]},
                {"spa": "Pan", "eng": "Bread", "opts": ["Bread", "Water", "Apple", "Wine"]},
                {"spa": "Leche", "eng": "Milk", "opts": ["Milk", "Water", "Cheese", "Beer"]},
                {"spa": "Agua", "eng": "Water", "opts": ["Water", "Milk", "Juice", "Bread"]},
                {"spa": "Queso", "eng": "Cheese", "opts": ["Cheese", "Butter", "Bread", "Milk"]},
            ],
            "Animals": [
                {"spa": "Gato", "eng": "Cat", "opts": ["Cat", "Dog", "Bird", "Horse"]},
                {"spa": "Perro", "eng": "Dog", "opts": ["Dog", "Cat", "Fish", "Cow"]},
                {"spa": "Pájaro", "eng": "Bird", "opts": ["Bird", "Fish", "Dog", "Cat"]},
                {"spa": "Caballo", "eng": "Horse", "opts": ["Horse", "Pig", "Sheep", "Dog"]},
                {"spa": "Pez", "eng": "Fish", "opts": ["Fish", "Bird", "Cat", "Shark"]},
            ],
            "Travel": [
                {"spa": "Maleta", "eng": "Suitcase", "opts": ["Suitcase", "Ticket", "Passport", "Bag"]},
                {"spa": "Pasaporte", "eng": "Passport", "opts": ["Passport", "ID", "Visa", "Suitcase"]},
                {"spa": "Avión", "eng": "Airplane", "opts": ["Airplane", "Train", "Bus", "Car"]},
                {"spa": "Hotel", "eng": "Hotel", "opts": ["Hotel", "House", "Room", "Office"]},
                {"spa": "Tren", "eng": "Train", "opts": ["Train", "Bus", "Bicycle", "Airplane"]},
            ],
            "Questions": [
                {"spa": "¿Dónde?", "eng": "Where?", "opts": ["Where?", "What?", "Who?", "Why?"]},
                {"spa": "¿Qué?", "eng": "What?", "opts": ["What?", "Where?", "When?", "How?"]},
                {"spa": "¿Quién?", "eng": "Who?", "opts": ["Who?", "Why?", "How?", "Where?"]},
                {"spa": "¿Cuándo?", "eng": "When?", "opts": ["When?", "Why?", "What?", "Where?"]},
                {"spa": "¿Por qué?", "eng": "Why?", "opts": ["Why?", "Because", "Who?", "When?"]},
            ],
            "Family": [
                {"spa": "Madre", "eng": "Mother", "opts": ["Mother", "Father", "Sister", "Brother"]},
                {"spa": "Padre", "eng": "Father", "opts": ["Father", "Mother", "Grandfather", "Son"]},
                {"spa": "Hermano", "eng": "Brother", "opts": ["Brother", "Sister", "Father", "Uncle"]},
                {"spa": "Hermana", "eng": "Sister", "opts": ["Sister", "Brother", "Mother", "Aunt"]},
                {"spa": "Abuelo", "eng": "Grandfather", "opts": ["Grandfather", "Grandmother", "Father", "Brother"]},
            ],
        }

        # 4. Create Lessons and Exercises for each Skill
        print("Generating lessons and exercises...")
        exercise_count = 0
        lesson_count = 0
        
        for skill in skills:
            vocab = vocab_data.get(skill.title, [])
            
            # Create 2 Lessons for each Skill
            for lesson_idx in range(1, 3):
                lesson = Lesson(skill_id=skill.id, order_index=lesson_idx)
                db.add(lesson)
                db.flush()
                lesson_count += 1
                
                # Determine which vocab items to focus on in this lesson
                # Lesson 1 gets items 0, 1, 2. Lesson 2 gets items 3, 4, and review of 0, 1.
                if lesson_idx == 1:
                    focus_items = vocab[0:3]
                else:
                    focus_items = vocab[3:5] + [vocab[0], vocab[1]]
                
                # Generate 4 to 5 exercises for this lesson
                for ex_idx, item in enumerate(focus_items, start=1):
                    # Mix exercise types: 
                    # 1st: multiple_choice, 2nd: translate, 3rd: type_answer, 4th+: cycle type
                    if ex_idx % 3 == 1:
                        ex_type = ExerciseType.MULTIPLE_CHOICE
                        prompt = f"Choose the correct translation for '{item['spa']}'"
                        correct_answer = item['eng']
                        options = item['opts']
                    elif ex_idx % 3 == 2:
                        ex_type = ExerciseType.TRANSLATE
                        prompt = f"Translate the word: '{item['spa']}'"
                        correct_answer = item['eng']
                        options = item['opts']
                    else:
                        ex_type = ExerciseType.TYPE_ANSWER
                        prompt = f"Type the Spanish translation for: '{item['eng']}'"
                        correct_answer = item['spa']
                        options = None
                        
                    exercise = Exercise(
                        lesson_id=lesson.id,
                        order_index=ex_idx,
                        type=ex_type,
                        prompt=prompt,
                        correct_answer=correct_answer,
                        options=options
                    )
                    db.add(exercise)
                    exercise_count += 1
        
        db.flush()

        # 5. Create UserSkillProgress for the default user (user_id=1)
        print("Seeding user skill progress...")
        for i, skill in enumerate(skills):
            # First skill in first unit (Greetings) is AVAILABLE, all others are LOCKED
            status = SkillStatus.AVAILABLE if i == 0 else SkillStatus.LOCKED
            progress = UserSkillProgress(
                user_id=default_user.id,
                skill_id=skill.id,
                crowns=0,
                status=status,
                lessons_completed=0
            )
            db.add(progress)
            
        db.commit()
        print("\nDatabase seeding completed successfully!")
        
        # Summary
        print("--------------------------------------------------")
        print("Summary of Seeded Data:")
        print(f"  Users: {db.query(User).count()}")
        print(f"  Courses: {db.query(Course).count()}")
        print(f"  Units: {db.query(Unit).count()}")
        print(f"  Skills: {db.query(Skill).count()}")
        print(f"  Lessons: {db.query(Lesson).count()}")
        print(f"  Exercises: {db.query(Exercise).count()}")
        print(f"  User Skill Progress Rows: {db.query(UserSkillProgress).count()}")
        print("--------------------------------------------------")
        
    except Exception as e:
        db.rollback()
        print(f"An error occurred during seeding: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
