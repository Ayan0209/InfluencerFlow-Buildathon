import openai
from app.config import OPENAI_API_KEY
from app.services.openai_service import openai_client
from app.utils.mock_data import MOCK_CREATORS

def send_outreach_email(campaign_id: int, creator_id: int, brief: str) -> dict:
    creator = next((c for c in MOCK_CREATORS if c['id'] == creator_id), None)
    creator_name = creator['name'] if creator else f'Creator {creator_id}'
    prompt = f"""
You are an expert outreach manager. Write a personalized email (subject and body) to {creator_name} about a campaign. The campaign brief is: {brief}
Return the subject and body as JSON with keys 'subject' and 'body'.
"""
    response = openai_client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are an expert outreach manager drafting emails to creators."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=300
    )
    import json
    try:
        result = json.loads(response.choices[0].message.content)
        subject = result.get('subject', 'Collaboration Opportunity')
        body = result.get('body', '')
    except Exception:
        subject = 'Collaboration Opportunity'
        body = response.choices[0].message.content
    print('Sending email to creator_id:', creator_id, 'subject:', subject)
    return {"success": True, "subject": subject, "body": body} 