# backend/app/services/contract_service.py

import os
from jinja2 import Environment, FileSystemLoader
from app.utils.mock_data import MOCK_CREATORS

def generate_contract(campaign_id: int, creator_id: int, terms: dict) -> bytes:
    # 1. Find the creator name from mock data
    creator = next((c for c in MOCK_CREATORS if c["id"] == creator_id), None)
    creator_name = creator["name"] if creator else f"Creator {creator_id}"

    # 2. Stubbed brand name (replace with real DB lookup if available)
    brand_name = "BrandX"

    # 3. Set up Jinja2 to load templates from `app/utils/templates`
    templates_path = os.path.join(os.path.dirname(__file__), "..", "utils", "templates")
    env = Environment(loader=FileSystemLoader(templates_path))
    template = env.get_template("contract_template.md.j2")

    # 4. Extract exactly the keys you send in JSON (ensure they match)
    deliverables = terms.get("deliverables", "")
    rate         = terms.get("rate", "")
    timeline     = terms.get("timeline", "")
    milestone    = terms.get("milestone", "")

    # 5. Render the template using those exact names
    rendered = template.render(
        brand_name=brand_name,
        creator_name=creator_name,
        deliverables=deliverables,
        rate=rate,
        timeline=timeline,
        milestone=milestone,
    )

    # 6. Return as UTF-8 bytes
    return rendered.encode("utf-8")
