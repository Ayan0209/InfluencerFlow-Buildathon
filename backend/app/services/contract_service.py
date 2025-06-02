# backend/app/services/contract_service.py

import os
import io
from typing import Optional

from jinja2 import Environment, FileSystemLoader
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

from app.services.supabase_client import supabase
from app.services.campaign_service import get_finalized_terms
from app.services.influencer_service import get_influencer_by_id
from app.services.campaign_service import get_campaign_by_id


def generate_contract(campaign_id: str, creator_id: Optional[str] = None) -> bytes:
    """
    1) Load campaign, business, and influencer rows from the database
    2) Render a legally styled Markdown template via Jinja2
    3) Convert the Markdown to a one‑page PDF via ReportLab
    """

    # ——— 1) Fetch from Supabase ———

    # a) Campaign row
    cam_resp = (
        supabase.table("campaign")
        .select("title, budget, deliverables, proposed_dates, business_id")
        .eq("id", campaign_id)
        .single()
        .execute()
    )
    if cam_resp is None or getattr(cam_resp, "error", None) or not cam_resp.data:
        raise RuntimeError(f"Campaign {campaign_id} not found")
    campaign = cam_resp.data
    campaign_title = campaign.get("title")
    budget = campaign.get("budget")
    deliverables_list = campaign.get("deliverables") or []
    # proposed_dates comes back as a string like "[2025-06-01,2025-06-15)" – convert to two parts
    daterange = campaign.get("proposed_dates")  # e.g. "[2025-06-01,2025-06-15)"
    # strip brackets and split on comma
    if isinstance(daterange, str) and "," in daterange:
        start_date = daterange.strip("[]()").split(",")[0]
        end_date = daterange.strip("[]()").split(",")[1]
    else:
        start_date = end_date = "TBD"

    business_id = campaign.get("business_id")

    # b) Business row (brand info)
    biz_resp = (
        supabase.table("business")
        .select("name, email, phone, website_url")
        .eq("id", business_id)
        .single()
        .execute()
    )
    if biz_resp is None or getattr(biz_resp, "error", None) or not biz_resp.data:
        raise RuntimeError(f"Business {business_id} not found")
    business = biz_resp.data
    brand_name = business.get("name")
    brand_email = business.get("email")
    brand_phone = business.get("phone") or ""
    brand_website = business.get("website_url") or ""

    # c) Influencer row (if provided)
    if creator_id:
        infl_resp = (
            supabase.table("influencer")
            .select("name, username, email")
            .eq("id", creator_id)
            .single()
            .execute()
        )
        if infl_resp is None or getattr(infl_resp, "error", None) or not infl_resp.data:
            raise RuntimeError(f"Influencer {creator_id} not found")
        influencer = infl_resp.data
        creator_name = influencer.get("name")
        creator_username = influencer.get("username")
        creator_email = influencer.get("email")
    else:
        creator_name = "__________________"
        creator_username = ""
        creator_email = ""

    # d) (Optional) fetch join table entry to pull any pre‑negotiated rate_per_post or other terms
    # For example purposes, let’s assume we want to check if campaign_influencer has a rate_per_post override
    rate_per_post = None
    if creator_id:
        join_resp = (
            supabase.table("campaign_influencer")
            .select("rate_per_post")
            .eq("campaign_id", campaign_id)
            .eq("influencer_id", creator_id)
            .single()
            .execute()
        )
        if join_resp and not getattr(join_resp, "error", None) and join_resp.data:
            rate_per_post = join_resp.data.get("rate_per_post")

    # If no rate_per_post in join table, we fall back to a simple split of campaign.budget
    if rate_per_post is None and budget:
        # e.g. 20% of budget
        rate_per_post = budget * 0.2  

    # Format deliverables as a bullet list
    bullet_deliverables = "\n".join(f"- {d}" for d in deliverables_list)

    # ——— 2) Render Markdown via Jinja2 ———

    templates_path = os.path.join(os.path.dirname(__file__), "..", "utils", "templates")
    env = Environment(loader=FileSystemLoader(templates_path))

    # Load our new legally styled contract template
    template = env.get_template("contract_template.md.j2")

    rendered_md = template.render(
        campaign_title=campaign_title,
        brand_name=brand_name,
        brand_email=brand_email,
        brand_phone=brand_phone,
        brand_website=brand_website,
        creator_name=creator_name,
        creator_username=creator_username,
        creator_email=creator_email,
        start_date=start_date,
        end_date=end_date,
        budget=budget,
        rate_per_post=rate_per_post,
        bullet_deliverables=bullet_deliverables,
    )

    # ——— 3) Convert Markdown to PDF using ReportLab ———

    # Split into lines for PDF layout
    lines = rendered_md.splitlines()

    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter

    pdf.setFont("Times-Roman", 12)
    x_margin = 40
    y_position = height - 50  # start near top

    for line in lines:
        pdf.drawString(x_margin, y_position, line)
        y_position -= 16
        if y_position < 50:
            pdf.showPage()         # new page
            pdf.setFont("Times-Roman", 12)
            y_position = height - 50

    pdf.showPage()
    pdf.save()

    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes


def generate_contract_with_terms(
    campaign_id: str,
    influencer_id: str
) -> bytes:
    """
    1) Fetch campaign, influencer, and finalized terms.
    2) Build a simple one‑page PDF via ReportLab based on those values.
    """

    # ——— 1) Fetch from our services ———

    # a) Campaign row
    campaign = get_campaign_by_id(campaign_id)
    if not campaign:
        raise RuntimeError(f"Campaign {campaign_id} not found")

    campaign_title = campaign.get("title", "Untitled Campaign")
    # proposed_dates is a string like "[2025-06-01,2025-06-15)"
    pd = campaign.get("proposed_dates", "")
    if isinstance(pd, str) and "," in pd:
        start_date = pd.strip("[]()").split(",")[0]
        end_date = pd.strip("[]()").split(",")[1]
    else:
        start_date = end_date = "TBD"

    # b) Influencer row
    influencer = get_influencer_by_id(influencer_id)
    if not influencer:
        raise RuntimeError(f"Influencer {influencer_id} not found")

    influencer_name = influencer.get("name", "Unknown Creator")

    # c) Finalized terms (rate + deliverable details)
    terms = get_finalized_terms(campaign_id, influencer_id)
    if not terms:
        raise RuntimeError("Finalized terms not found for this campaign/influencer")

    agreed_rate = terms.get("agreed_rate_per_post", 0.0)
    deliverable_details = terms.get("final_deliverable_details", "")

    # d) Fetch business name (so we can display “Brand X”)
    biz_resp = (
        supabase.table("business")
        .select("name")
        .eq("id", campaign.get("business_id"))
        .single()
        .execute()
    )
    if not biz_resp or getattr(biz_resp, "error", None) or not biz_resp.data:
        brand_name = "Brand"
    else:
        brand_name = biz_resp.data.get("name", "Brand")

    # ——— 2) Build PDF via ReportLab ———

    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter

    # Set up fonts and margins
    pdf.setFont("Times-Bold", 16)
    y = height - 50
    x_margin = 40

    # Title
    pdf.drawString(x_margin, y, f"Contract: {campaign_title}")
    y -= 30

    pdf.setFont("Times-Roman", 12)
    pdf.drawString(x_margin, y, f"Brand: {brand_name}")
    y -= 18

    pdf.drawString(x_margin, y, f"Influencer: {influencer_name}")
    y -= 18

    pdf.drawString(x_margin, y, f"Campaign Dates: {start_date} to {end_date}")
    y -= 18

    pdf.drawString(x_margin, y, f"Agreed Rate (per post): ₹{agreed_rate:.2f}")
    y -= 24

    pdf.setFont("Times-Bold", 12)
    pdf.drawString(x_margin, y, "Deliverable Details:")
    y -= 18

    pdf.setFont("Times-Roman", 12)
    # Wrap deliverable_details if it’s long
    max_width = width - 2 * x_margin
    text_obj = pdf.beginText(x_margin, y)
    text_obj.setFont("Times-Roman", 12)
    for line in deliverable_details.splitlines():
        # ReportLab doesn’t auto-wrap, so we manually wrap at ~80 chars
        pieces = [line[i : i + 80] for i in range(0, len(line), 80)]
        for piece in pieces:
            text_obj.textLine(piece)
            y -= 14
    pdf.drawText(text_obj)

    # Move down a bit
    y -= 30

    # Terms & Conditions stub
    pdf.setFont("Times-Bold", 12)
    pdf.drawString(x_margin, y, "Terms & Conditions:")
    y -= 18

    pdf.setFont("Times-Roman", 12)
    tcs = [
        "1. Influencer agrees to deliver the above content by the agreed dates.",
        "2. Brand will pay the agreed rate within 30 days of submission.",
        "3. Usage rights remain with the Brand for marketing purposes.",
        "4. This contract is governed by applicable local laws.",
    ]
    for tc in tcs:
        pdf.drawString(x_margin + 20, y, f"- {tc}")
        y -= 16

    # Signature lines at bottom
    y = 100
    pdf.setFont("Times-Roman", 12)
    pdf.drawString(x_margin, y, "Brand Signature: ____________________________")
    pdf.drawString(x_margin + 300, y, "Date: ____________")
    y -= 40
    pdf.drawString(x_margin, y, "Influencer Signature: _______________________")
    pdf.drawString(x_margin + 300, y, "Date: ____________")

    pdf.showPage()
    pdf.save()

    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes