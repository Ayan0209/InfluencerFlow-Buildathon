import os
from jinja2 import Environment, FileSystemLoader
from app.utils.mock_data import MOCK_CREATORS

def generate_contract(campaign_id: int, creator_id: int, terms: dict) -> bytes:
    creator = next((c for c in MOCK_CREATORS if c['id'] == creator_id), None)
    creator_name = creator['name'] if creator else f'Creator {creator_id}'
    brand_name = 'BrandX'  # Stubbed; replace with real lookup if available
    env = Environment(loader=FileSystemLoader(os.path.join(os.path.dirname(__file__), '../utils/templates')))
    template = env.get_template('contract_template.md.j2')
    rendered = template.render(
        brand_name=brand_name,
        creator_name=creator_name,
        deliverables=terms.get('deliverables', []),
        rates=terms.get('rates', {}),
        timelines=terms.get('timelines', {})
    )
    return rendered.encode('utf-8') 