import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.routes.health import router as health_router
from app.routes.creators import router as creators_router

# Load environment variables from .env file
load_dotenv()

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust as needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import and include routers here
# from backend.routes import example_router
# app.include_router(example_router)

app.include_router(health_router)
app.include_router(creators_router, prefix="/api")

# Remove the @app.get("/health") endpoint 