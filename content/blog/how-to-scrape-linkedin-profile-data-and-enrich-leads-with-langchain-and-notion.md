---
title: "Scrape Google Maps & Qualify Leads with LangChain"
excerpt: "Automate local business lead extraction with LangChain agents and store qualified B2B prospects."
publishedAt: "2026-09-22"
category: "Data Scraping & Enrichment"
author: "AI Workflow Architect"
tags: ["LangChain", "Web Scraping", "Lead Generation", "Python"]
workflowTool: "LangChain"
featured: false
---

In B2B sales, manual prospecting is a massive bottleneck. Sales development representatives (SDRs) spend hours searching Google Maps for local businesses, visiting outdated websites, and manually qualifying whether a prospect has the budget or need for their services.

This tutorial demonstrates how to build a production-grade, fully automated lead generation pipeline. We will scrape high-intent local business data from Google Maps, use a LangChain agent to crawl and analyze their websites, score them into qualification tiers using an LLM, and output structured leads ready for your CRM or Notion workspace.

---

## Architecture Overview

The pipeline operates as a decoupled, four-stage asynchronous workflow designed for high throughput and resilience:

```
[ Input Query ] ──> [ Google Maps Scraper ] ──> [ Web Crawler / Parser ]
                                                        │
                                                        ▼
[ CRM / Notion ] <── [ Structured Output ] <── [ LangChain Scoring Agent ]
```

1. **Input Trigger:** A target search query (e.g., *"Dentists in Austin, TX"* or *"Roofing Contractors in Miami"*) initiates the run.
2. **Scraping Engine:** A Google Maps extraction utility retrieves core business metadata: Name, Website, Phone, Rating, and Address.
3. **Enrichment & Scoring Agent:** A LangChain agent visits the extracted website, scrapes the homepage/about page text, and evaluates the business against a custom Ideal Customer Profile (ICP) using structured LLM outputs.
4. **Storage:** The enriched, scored leads are structured into a clean schema and prepared for database insertion (e.g., Notion, PostgreSQL, or HubSpot).

---

## Step 1: Setting Up the Environment & Dependencies

We will use modern LangChain (`>=0.3`), Pydantic (`v2`) for structured schema validation, and `playwright` for robust, Javascript-enabled web scraping.

First, install the required dependencies:

```bash
pip install langchain langchain-openai pydantic playwright beautifulsoup4 requests
playwright install chromium
```

Next, set up your environment variables. Create a `.env` file or export them directly in your terminal:

```bash
export OPENAI_API_KEY="your-openai-api-key"
export SERPAPI_API_KEY="your-serpapi-api-key" # Used for reliable Google Maps scraping
```

Now, let's initialize our Python environment and define our structured data schemas using Pydantic.

```python
import os
from typing import List, Optional
from pydantic import BaseModel, Field, HttpUrl

# Define the schema for the initial Google Maps raw lead
class RawLead(BaseModel):
    name: str = Field(description="The official name of the business")
    website: Optional[str] = Field(None, description="The business website URL")
    phone: Optional[str] = Field(None, description="The business phone number")
    address: Optional[str] = Field(None, description="Physical address of the business")
    rating: Optional[float] = Field(None, description="Google Maps rating (0.0 to 5.0)")
    reviews_count: int = Field(default=0, description="Number of Google reviews")

# Define the schema for our final enriched and qualified lead
class QualifiedLead(BaseModel):
    business_name: str
    website: str
    qualification_tier: str = Field(
        description="Tier 1 (High Fit), Tier 2 (Medium Fit), or Tier 3 (Low Fit/Unqualified)"
    )
    justification: str = Field(
        description="Detailed reasoning explaining why this lead was assigned to this tier"
    )
    estimated_size: str = Field(
        description="Estimated business size or sophistication level based on site content"
    )
    recommended_outreach_angle: str = Field(
        description="A personalized hook or angle to use in cold outreach"
    )
```

---

## Step 2: Extracting Maps Data

To scrape Google Maps reliably without getting blocked by anti-bot measures, we will use **SerpApi**. It provides a clean, structured JSON output of Google Maps search results.

Here is the implementation of our Maps scraping utility:

```python
import requests

def scrape_google_maps(query: str, limit: int = 10) -> List[RawLead]:
    """
    Scrapes Google Maps using SerpApi based on a search query.
    """
    api_key = os.getenv("SERPAPI_API_KEY")
    if not api_key:
        raise ValueError("Missing SERPAPI_API_KEY environment variable.")
        
    params = {
        "engine": "google_maps",
        "q": query,
        "type": "search",
        "api_key": api_key
    }
    
    response = requests.get("https://serpapi.com/search", params=params)
    response.raise_for_status()
    results = response.json()
    
    local_results = results.get("local_results", [])
    raw_leads = []
    
    for item in local_results[:limit]:
        # Skip businesses without websites, as we cannot enrich them
        if not item.get("website"):
            continue
            
        lead = RawLead(
            name=item.get("title"),
            website=item.get("website"),
            phone=item.get("phone"),
            address=item.get("address"),
            rating=item.get("rating"),
            reviews_count=item.get("reviews_count", 0)
        )
        raw_leads.append(lead)
        
    return raw_leads

# Example Usage:
# leads = scrape_google_maps("Roofing contractors in Denver", limit=5)
# print(f"Found {len(leads)} leads with valid websites.")
```

---

## Step 3: Automated Lead Scoring with LLM Chains

Once we have the business's website, we need to crawl its homepage to extract context (services offered, copywriting quality, team size indicators) and pass that data to a LangChain agent for qualification.

### 1. The Web Crawler Utility
We will use a lightweight, headless Playwright script to fetch the raw HTML, stripping out script and style tags to minimize token usage.

```python
import asyncio
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright

async def crawl_website(url: str) -> str:
    """
    Asynchronously crawls a website and extracts clean, readable text.
    """
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            # Set a realistic user agent to avoid basic blocks
            context = await browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            )
            page = await context.new_page()
            # Set a timeout of 10 seconds
            await page.goto(url, wait_until="domcontentloaded", timeout=10000)
            content = await page.content()
            await browser.close()
            
            # Clean HTML with BeautifulSoup
            soup = BeautifulSoup(content, "html.parser")
            for script in soup(["script", "style", "nav", "footer"]):
                script.decompose()
                
            text = soup.get_text(separator=" ")
            # Clean up whitespace
            cleaned_text = " ".join(text.split())
            return cleaned_text[:4000] # Limit to first 4000 chars to save tokens
    except Exception as e:
        print(f"Failed to crawl {url}: {str(e)}")
        return ""
```

### 2. The LangChain Scoring Agent
Now, we construct our LangChain qualification chain. We use OpenAI's structured output capabilities to guarantee that our agent returns data matching our `QualifiedLead` Pydantic schema.

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

def create_qualification_chain():
    """
    Creates a LangChain runnable that outputs structured QualifiedLead data.
    """
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.2)
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", (
            "You are an elite B2B Growth Marketer and Lead Qualification Specialist.\n"
            "Your task is to evaluate a prospect's website content and determine if they are a good fit "
            "for high-ticket digital marketing and SEO services.\n\n"
            "Use the following criteria for grading:\n"
            "- **Tier 1 (High Fit)**: The website is outdated, lacks clear call-to-actions, has no active blog, "
            "but the business seems established (has multiple locations, team members, or high reviews).\n"
            "- **Tier 2 (Medium Fit)**: The website is modern but has minor SEO issues, or the business is "
            "mid-sized and could benefit from conversion rate optimization.\n"
            "- **Tier 3 (Low Fit/Unqualified)**: The website is already state-of-the-art, OR the business is "
            "extremely small (e.g., single freelancer/sole proprietor) with zero budget indicators."
        )),
        ("human", (
            "Business Name: {business_name}\n"
            "Website: {website}\n"
            "Scraped Website Content:\n"
            "---------------------\n"
            "{web_content}\n"
            "---------------------\n"
            "Analyze the content and output your structured qualification evaluation."
        ))
    ])
    
    # Bind the Pydantic schema to enforce structured output
    structured_llm = llm.with_structured_output(QualifiedLead)
    
    return prompt | structured_llm
```

### 3. Orchestrating the Pipeline
Let's tie the scraping, crawling, and qualification steps together into a single executable pipeline.

```python
async def run_lead_generation_pipeline(query: str, limit: int = 5):
    print(f"🚀 Starting pipeline for query: '{query}'")
    
    # Step 1: Scrape Google Maps
    raw_leads = scrape_google_maps(query, limit=limit)
    print(f"📍 Found {len(raw_leads)} potential leads with websites.")
    
    qualification_chain = create_qualification_chain()
    final_leads: List[QualifiedLead] = []
    
    for idx, raw_lead in enumerate(raw_leads, 1):
        print(f"\n[{idx}/{len(raw_leads)}] Processing: {raw_lead.name} ({raw_lead.website})")
        
        # Step 2: Crawl website
        web_content = await crawl_website(raw_lead.website)
        
        if not web_content:
            print(f"⚠️ Skipping {raw_lead.name} due to empty or failed crawl.")
            continue
            
        # Step 3: Run LangChain Qualification
        try:
            qualified_lead: QualifiedLead = qualification_chain.invoke({
                "business_name": raw_lead.name,
                "website": raw_lead.website,
                "web_content": web_content
            })
            
            print(f"✅ Qualified: {qualified_lead.business_name} -> {qualified_lead.qualification_tier}")
            print(f"💡 Angle: {qualified_lead.recommended_outreach_angle}")
            final_leads.append(qualified_lead)
        except Exception as e:
            print(f"❌ Error qualifying {raw_lead.name}: {str(e)}")
            
    return final_leads

# To run the async pipeline:
# if __name__ == "__main__":
#     leads = asyncio.run(run_lead_generation_pipeline("Plumbers in Phoenix", limit=3))
```

---

## JSON Blueprint Configuration

For enterprise automation platforms (like n8n, LangGraph, or custom internal orchestration engines), you can represent this multi-step agentic workflow using a declarative JSON blueprint:

```json
{
  "workflowName": "Google Maps Lead Enrichment & Scoring Pipeline",
  "version": "1.2.0",
  "nodes": [
    {
      "id": "maps_scraper",
      "type": "trigger_action",
      "tool": "SerpApiGoogleMaps",
      "parameters": {
        "query": "{{input.query}}",
        "limit": 20
      },
      "outputs": ["raw_leads_list"]
    },
    {
      "id": "web_crawler",
      "type": "iterator_action",
      "input": "raw_leads_list",
      "tool": "PlaywrightHeadlessCrawler",
      "parameters": {
        "target_field": "website",
        "timeout_ms": 10000,
        "max_characters": 4000
      },
      "outputs": ["crawled_pages"]
    },
    {
      "id": "langchain_scoring_agent",
      "type": "llm_agent",
      "model": "gpt-4o-mini",
      "temperature": 0.2,
      "system_prompt": "You are an elite B2B Growth Marketer. Analyze the scraped website content and assign a qualification tier (Tier 1, Tier 2, Tier 3) based on the target ICP criteria.",
      "structured_schema": {
        "type": "object",
        "properties": {
          "business_name": { "type": "string" },
          "website": { "type": "string" },
          "qualification_tier": { "type": "string", "enum": ["Tier 1", "Tier 2", "Tier 3"] },
          "justification": { "type": "string" },
          "recommended_outreach_angle": { "type": "string" }
        },
        "required": ["business_name", "website", "qualification_tier", "justification", "recommended_outreach_angle"]
      },
      "outputs": ["qualified_leads"]
    }
  ]
}
```

---

## Error Handling, Proxies & Rate Limits

When running this pipeline at scale, you will inevitably run into network blocks, rate limits, and malformed websites. Implement these production-grade strategies to keep your pipeline running smoothly:

### 1. Proxy Rotation for Web Crawling
Many business websites use Cloudflare or AWS WAF to block headless scrapers. To bypass this, integrate a proxy rotation service (such as Bright Data, Oxylabs, or Smartproxy) into your Playwright configuration:

```python
# Example of configuring Playwright with a rotating proxy
browser = await p.chromium.launch(
    headless=True,
    proxy={
        "server": "http://your-proxy-provider.com:8000",
        "username": "your-proxy-username",
        "password": "your-proxy-password"
    }
)
```

### 2. Handling Rate Limits (LLM & Scraping APIs)
* **OpenAI Rate Limits:** If you are processing hundreds of leads concurrently, you will hit TPM (Tokens Per Minute) limits. Use `asyncio.Semaphore` to limit concurrent LLM calls:
  ```python
  # Limit concurrency to 5 parallel tasks
  semaphore = asyncio.Semaphore(5)
  
  async def bound_qualification(sem, lead, chain):
      async with sem:
          return await chain.ainvoke(...)
  ```
* **Exponential Backoff:** Wrap your external API calls (SerpApi, OpenAI) in a retry decorator like `tenacity` to handle transient network errors (`502`, `503`, or `429` status codes) gracefully.

### 3. Graceful Fallbacks for Unreachable Sites
Not all websites are crawlable (some may be down, others might have strict geoblocks). Ensure your pipeline doesn't crash when a single site fails:
* Always wrap your crawling logic in a `try/except` block.
* If a crawl fails, fall back to evaluating the lead *solely* on their Google Maps metadata (rating, review count, and category) rather than discarding the lead entirely.