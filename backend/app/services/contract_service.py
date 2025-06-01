import os
from jinja2 import Environment, FileSystemLoader
from elasticsearch import Elasticsearch

# Initialize Elasticsearch client (adjust host and auth as needed)
es = Elasticsearch(
    hosts=[os.getenv("ELASTICSEARCH_URL", "https://localhost:9200")],
    basic_auth=("elastic", os.getenv("ELASTICSEARCH_PASSWORD", "NWZVgF9*6g_OsqiNlGy7")),
    verify_certs=False
)

def get_creator_by_id(creator_id: int) -> dict:
    try:
        resp = es.search(
            index="creators",
            query={"term": {"id": creator_id}},
            size=1
        )
        hits = resp["hits"]["hits"]
        return hits[0]["_source"] if hits else None
    except Exception as e:
        print(f"Error fetching creator from Elasticsearch: {e}")
        return None

def generate_contract(campaign_id: int, creator_id: int, terms: dict) -> bytes:
    creator = get_creator_by_id(creator_id)
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