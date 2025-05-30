import os
import openai
from dotenv import load_dotenv
from app.config import OPENAI_API_KEY

openai_client = openai.OpenAI(api_key=OPENAI_API_KEY)

def get_creator_recommendations(prompt: str) -> str:
    response = openai_client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are a marketing expert recommending creators for marketing briefs."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=150
    )
    return response.choices[0].message.content.strip() 