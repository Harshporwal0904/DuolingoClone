from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from . import models
from .routers import path, lessons, social

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all database tables on startup
    Base.metadata.create_all(bind=engine)
    
    # Auto-seed the database if it is empty
    try:
        from .seed import seed_if_empty
        seed_if_empty()
    except Exception as e:
        print("Error during auto-seeding:", e)
        
    yield

app = FastAPI(title="Duolingo Clone API", lifespan=lifespan)

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(path.router, prefix="/api")
app.include_router(lessons.router, prefix="/api")
app.include_router(social.router, prefix="/api")

@app.get("/health")
def health_check():
    return {"status": "ok"}
