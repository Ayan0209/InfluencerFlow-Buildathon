import os
from dotenv import load_dotenv

# Resolve path to .env file in the backend root
dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(dotenv_path)

# Export environment variables
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

print("OPENAI_API_KEY: ", OPENAI_API_KEY)


