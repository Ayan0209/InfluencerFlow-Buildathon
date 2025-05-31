import os
import openai
import json
import time
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()
# Set the OpenAI API key
OPENAI_API_KEY = ""
openai.api_key = OPENAI_API_KEY

def generate_synthetic_data(schema: dict, entity_type: str = "influencer", n: int = 1, batch_size: int = 10, output_file: str = "synthetic_influencers_2.json"):
    batches = n // batch_size + (1 if n % batch_size else 0)
    first_batch = True
    with open(output_file, "w") as out_f:
        out_f.write("[\n")
        for i in range(batches):
            current_batch = batch_size if (i < batches - 1) else (n - batch_size * (batches - 1))
            prompt = (
                f"As part of developing a platform that connects influencers with businesses for collaborations, "
                f"you are provided with a JSON schema representing a {entity_type}. "
                f"Generate {current_batch} concise and realistic synthetic data entries as a JSON array. "
                "Ensure the entries are diverse, covering various scenarios and attributes relevant to the platform such as tech, food, travel, fashion, etc. "
                "Each entry should accurately reflect the structure and data types defined in the schema, "
                "with values that make sense for an influencer-business matching platform. "
                "Exclude any explanations or additional fields. "
                "Make sure to make the output a valid JSON. Do not include any comments or explanations in the output. "
                "Respond with valid JSON only, formatted to match the schema.\n\n"
                f"Schema (as JSON):\n{json.dumps(schema, indent=2)}\n\n"
                "Output:"
            )
            while True:
                try:
                    response = openai.chat.completions.create(
                        model="gpt-4o",
                        messages=[{"role": "user", "content": prompt}],
                        max_tokens=1024,
                        temperature=0.7,
                    )
                    break
                except openai.RateLimitError:
                    print("Rate limit reached. Waiting 10 seconds before retrying...")
                    time.sleep(10)
                except openai.OpenAIError as e:
                    print(f"OpenAI error: {e}. Waiting 5 seconds before retrying...")
                    time.sleep(5)
            content = response.choices[0].message.content.strip()
            # Remove code block markers if present
            if content.startswith("```json"):
                content = content[7:]
            if content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
            content = content.strip()
            try:
                data = json.loads(content)
                if isinstance(data, list):
                    for entry in data:
                        if not first_batch:
                            out_f.write(",\n")
                        out_f.write(json.dumps(entry, indent=2))
                        first_batch = False
                else:
                    print("Expected a list, got:", type(data))
            except json.JSONDecodeError:
                print("Could not parse response as JSON. Raw output:")
                print(content)
        out_f.write("\n]\n")

# Example usage:
if __name__ == "__main__":
    # Load your schema from file


    ######## Entity Type Configuration ########
    entity_type = "campaign"  # Change this to "influencer", "campaign", etc. as needed

    with open(f"data/schema/{entity_type}.json") as f:
        schema = json.load(f)
    generate_synthetic_data(schema, entity_type, n=5, batch_size=2, output_file=f"synthetic_{entity_type}.json")
    print(f"Generated and appended entries to synthetic_{entity_type}.json")