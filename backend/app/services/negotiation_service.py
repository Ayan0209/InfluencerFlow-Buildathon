# backend/app/services/negotiation_service.py

import os
from typing import Dict, Optional

from app.services.supabase_client import supabase
from app.config import OPENAI_API_KEY



# OpenAI setup (assumes you’ve already set OPENAI_API_KEY in env)
import openai
# openai.api_key = os.getenv("OPENAI_API_KEY", "")
openai_client = openai.OpenAI(api_key=OPENAI_API_KEY)

def _fetch_campaign_budget(campaign_id: str) -> Optional[float]:
    """
    Helper to get the campaign's budget as a float.
    """
    resp = (
        supabase.table("campaign")
        .select("budget")
        .eq("id", campaign_id)
        .single()
        .execute()
    )
    if resp and not getattr(resp, "error", None) and resp.data:
        return float(resp.data.get("budget", 0))
    return None


def _fetch_influencer_rate(influencer_id: str) -> Optional[float]:
    """
    Helper to get the influencer's rate_per_post as a float.
    """
    resp = (
        supabase.table("influencer")
        .select("rate_per_post")
        .eq("id", influencer_id)
        .single()
        .execute()
    )
    if resp and not getattr(resp, "error", None) and resp.data:
        return float(resp.data.get("rate_per_post", 0))
    return None


def _fetch_campaign_deliverables(campaign_id: str) -> Optional[list]:
    """
    Helper to get the campaign's deliverables array.
    Returns the Python list, or empty list if none.
    """
    resp = (
        supabase.table("campaign")
        .select("deliverables")   # assume deliverables is a text[] or JSONB array
        .eq("id", campaign_id)
        .single()
        .execute()
    )
    if resp and not getattr(resp, "error", None) and resp.data:
        return resp.data.get("deliverables", []) or []
    return []


def add_negotiation_message(
    campaign_id: str,
    influencer_id: str,
    sender_type: str,
    message: str
) -> Optional[Dict]:
    """
    Insert a new negotiation row (sender_type is "business" or "influencer").
    Returns the newly inserted row (as a dict), or None on failure.
    """
    data = {
        "campaign_id": campaign_id,
        "influencer_id": influencer_id,
        "sender_type": sender_type,
        "message": message,
    }
    resp = supabase.table("negotiations").insert(data).execute()
    if resp and not getattr(resp, "error", None) and resp.data:
        return resp.data[0]
    return None


def business_ai_response(
    campaign_id: str,
    influencer_id: str,
    incoming_message: str
) -> Optional[str]:
    """
    Generate a “Business Agent” response via OpenAI, using:
      - campaign budget
      - influencer rate_per_post
      - number of deliverables in campaign
      - total cost = rate_per_post * number_of_deliverables
      - the influencer's latest message (incoming_message)
    Inserts that AI‐generated message into `negotiations` with sender_type="business".
    Returns the AI‐generated text, or None on failure.
    """

    # 1) Fetch budget, influencer rate, and deliverables
    budget = _fetch_campaign_budget(campaign_id) or 0.0
    infl_rate = _fetch_influencer_rate(influencer_id) or 0.0
    deliverables = _fetch_campaign_deliverables(campaign_id) or []
    num_deliverables = len(deliverables)

    # 2) Calculate total cost
    total_cost = infl_rate * num_deliverables

    # 3) Decide if total_cost exceeds budget
    is_over_budget = total_cost > budget
    shortfall = total_cost - budget if is_over_budget else 0.0

    # 4) Build a detailed prompt for GPT
    prompt_lines = [
        "You are a brand’s Business Agent negotiating a rate with an influencer.",
        f"- Campaign Budget: ₹{budget:.2f}",
        f"- Influencer’s Current Rate per Post: ₹{infl_rate:.2f}",
        f"- Number of Deliverables Required: {num_deliverables}",
        f"- Total Cost (rate × deliverables): ₹{total_cost:.2f}",
    ]

    if is_over_budget:
        prompt_lines.append(f"- This total cost exceeds the budget by ₹{shortfall:.2f}.")
        prompt_lines.append(
            "You need to propose a counter‐offer that keeps the overall spend under budget. "
            "You may suggest reducing the rate, adjusting the number of deliverables, or "
            "offering a package deal."
        )
    else:
        prompt_lines.append("- The total cost is within budget.")
        prompt_lines.append(
            "You may affirm the influencer’s current rate and confirm next steps to draft a contract."
        )

    prompt_lines.append("")
    prompt_lines.append("The influencer’s latest message is:")
    prompt_lines.append(f"\"\"\"{incoming_message}\"\"\"\n")
    prompt_lines.append("Draft a concise, professional, polite response keeping in mind the above details.")

    prompt = "\n".join(prompt_lines)

    # 5) Call OpenAI to generate a response
    try:
        chat_resp = openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a helpful negotiation assistant for brand-influencer talks."},
                {"role": "user", "content": prompt},
            ],
            max_tokens=200,
            temperature=0.7,
        )
        ai_text = chat_resp.choices[0].message.content.strip()
    except Exception:
        # 6) Fallback if OpenAI is unavailable
        if is_over_budget:
            # Suggest a rate that brings total under budget, e.g. budget / num_deliverables
            suggested_rate = (budget / num_deliverables) if num_deliverables > 0 else budget
            ai_text = (
                f"Thank you for your proposal. Our budget is ₹{budget:.2f}, and we have "
                f"{num_deliverables} deliverables, which at your current rate of ₹{infl_rate:.2f} "
                f"per post would cost ₹{total_cost:.2f}, exceeding our budget by ₹{shortfall:.2f}. "
                f"Would you consider ₹{suggested_rate:.2f} per post instead, so we remain within budget? "
                "We value your work and hope to find a mutually acceptable agreement."
            )
        else:
            ai_text = (
                f"Thanks for your message. Our budget is ₹{budget:.2f}, and at a rate of ₹{infl_rate:.2f} per post "
                f"for {num_deliverables} deliverables (total ₹{total_cost:.2f}), we are within budget. "
                "We’d be happy to move forward—please let us know if you agree and we can draft a contract."
            )

    # 7) Insert the AI response into negotiations table
    inserted = add_negotiation_message(
        campaign_id=campaign_id,
        influencer_id=influencer_id,
        sender_type="business",
        message=ai_text,
    )
    if inserted:
        return ai_text
    return None

def handle_influencer_message_and_counter(
    campaign_id: str,
    influencer_id: str,
    influencer_message: str
) -> Optional[str]:
    """
    1) Insert the influencer's message (sender_type="influencer").
    2) Generate & insert a business AI response.
    Returns the AI response text, or None on failure.
    """

    # a) Insert influencer’s message
    inf_inserted = add_negotiation_message(
        campaign_id=campaign_id,
        influencer_id=influencer_id,
        sender_type="influencer",
        message=influencer_message,
    )
    if not inf_inserted:
        return None

    # b) Generate & insert business reply
    return business_ai_response(campaign_id, influencer_id, influencer_message)

def list_negotiation_messages(campaign_id: str, influencer_id: str) -> Optional[list]:
    """
    List all negotiations for a given campaign.
    Returns a list of negotiation rows, or None on failure.
    """
    resp = supabase.table("negotiations").select("*").eq("campaign_id", campaign_id).eq("influencer_id", influencer_id).execute()
    return resp.data if resp and not getattr(resp, "error", None) else None

