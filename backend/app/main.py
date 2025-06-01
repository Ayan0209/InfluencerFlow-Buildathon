import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.routes.health import router as health_router
from app.routes.creators import router as creators_router
from app.routes.contract import router as contracts_router
from app.routes.outreach import router as outreach_router
from app.routes.business import router as business_router
from app.routes.influencer import router as influencer_router
from app.routes.influencers_search import router as influencers_search_router
from app.routes.campaign import router as campaign_router

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
app.include_router(contracts_router, prefix="/api")
app.include_router(outreach_router, prefix="/api")
app.include_router(business_router)
app.include_router(influencer_router)
app.include_router(influencers_search_router, prefix="/api")
app.include_router(campaign_router)
# Remove the @app.get("/health") endpoint 