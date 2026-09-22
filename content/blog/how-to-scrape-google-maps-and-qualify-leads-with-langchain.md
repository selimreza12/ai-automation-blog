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

## Architecture Overview

This automated lead generation pipeline extracts high-intent local business leads from Google Maps, enriches their profile data, and uses an LLM-powered scoring agent to qualify them. 

```
[Trigger: Search Query] 
       │
       ▼
[Google Maps Scraper] ──► Extracts: Name, Website, Phone, Reviews, Category
       │
       ▼
[Website Content Loader] ──► Fetches Homepage HTML / Meta Tags
       │
       ▼
[LangChain Scoring Agent] ──► Evaluates Fit & Assigns Tier (Tier 1/2/3) + Angle
       │
       ▼
[Structured Storage] ──► Saves Qualified Leads (JSON/CSV/CRM)
```

1. **Input Trigger**: A target niche and location query (e.g., *"Roofing contractors in Austin, TX"*).
2. **Scraping Engine**: Queries Google Maps via SerpAPI (or a custom Playwright scraper) to extract business names, websites, ratings, and phone numbers.
3. **LLM Scoring Agent**: A LangChain pipeline that crawls the target website, analyzes the business's positioning, and uses structured output (`Pydantic`) to classify the lead into Tier 1 (High Intent), Tier 2 (Medium Intent), or Tier 3 (Low Intent/Unsuitable).
4. **Storage**: Outputs structured JSON ready for CRM ingestion (HubSpot, Salesforce, or Airtable).

---

## Step 1: Setting Up the Environment & Dependencies

To build this pipeline, you need Python 3.10+ and several core libraries. We will use `langchain` for orchestration, `langchain-openai` for structured classification, and `pydantic` for schema enforcement.

First, install the required packages:

```bash
pip install langchain langchain-openai pydantic requests beautifulsoup4 pandas dotenv
```

Next, configure your environment variables in a `.env` file:

```env
OPENAI_API_KEY="your-openai-api-key"
SERPAPI_API_KEY="your-serpapi-api-key"
```

Now, initialize your imports and load the environment:

```python
import os
import json
import requests
from typing import Optional, List
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

load_dotenv()

# Verify API Keys
if not os.getenv("OPENAI_API_KEY") or not os.getenv("SERPAPI_API_KEY"):
    raise ValueError("Missing required API keys in environment variables.")
```

---

## Step 2: Extracting Maps Data

We will use SerpAPI's Google Maps engine to fetch local business data. This avoids IP bans and CAPTCHAs while returning clean, structured JSON.

```python
def scrape_google_maps(query: str, limit: int = 10) -> List[dict]:
    """
    Fetches local businesses from Google Maps using SerpAPI.
    """
    url = "https://serpapi.com/search"
    params = {
        "engine": "google_maps",
        "q": query,
        "api_key": os.getenv("SERPAPI_API_KEY"),
        "type": "search"
    }
    
    try:
        response = requests.get(url, params=params, timeout=15)
        response.raise_for_status()
        results = response.json().get("local_results", [])
        
        leads = []
        for place in results[:limit]:
            leads.append({
                "name": place.get("title"),
                "website": place.get("website"),
                "phone": place.get("phone"),
                "rating": place.get("rating"),
                "reviews": place.get("reviews"),
                "category": place.get("type"),
                "address": place.get("address")
            })
        return leads
    except Exception as e:
        print(f"Error scraping Google Maps: {e}")
        return []

# Example Usage
if __name__ == "__main__":
    raw_leads = scrape_google_maps("Med Spas in Miami", limit=3)
    print(f"Extracted {len(raw_leads)} raw leads.")
```

---

## Step 3: Automated Lead Scoring with LLM Chains

Once we have the website URLs, we need to scrape their homepages to extract context. We then pass this context to a LangChain agent that scores the lead based on custom criteria (e.g., whether they lack an online booking system or have poor copywriting).

### 1. Define the Lead Qualification Schema

We use Pydantic to enforce a strict output schema from our LLM.

```python
class LeadQualification(BaseModel):
    tier: str = Field(
        description="Lead classification: 'Tier 1' (High fit, immediate pain point), 'Tier 2' (Moderate fit), 'Tier 3' (Poor fit/Do not contact)"
    )
    pain_points: List[str] = Field(
        description="Identified business pain points (e.g., 'No online booking', 'Outdated design', 'Missing social proof')"
    )
    outreach_angle: str = Field(
        description="A highly personalized cold outreach hook targeting their specific weaknesses."
    )
    confidence_score: float = Field(
        description="Confidence score of the evaluation between 0.0 and 1.0"
    )
```

### 2. Build the Scraper & Qualification Chain

```python
def fetch_website_snippet(url: str) -> str:
    """
    Fetches the homepage HTML and extracts text content safely.
    """
    if not url:
        return "No website available."
    try:
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
        response = requests.get(url, headers=headers, timeout=10)
        soup = BeautifulSoup(response.text, "html.parser")
        
        # Remove script and style elements
        for script in soup(["script", "style"]):
            script.decompose()
            
        text = soup.get_text()
        # Clean up whitespace
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        clean_text = "\n".join(chunk for chunk in chunks if chunk)
        
        return clean_text[:3000] # Limit to first 3000 chars to save tokens
    except Exception as e:
        return f"Failed to crawl website: {str(e)}"

def qualify_lead(lead_data: dict, website_text: str) -> LeadQualification:
    """
    Uses LangChain and GPT-4o-mini to qualify the lead based on scraped data.
    """
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
    structured_llm = llm.with_structured_output(LeadQualification)
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", (
            "You are an elite B2B Lead Generation Specialist. Your job is to evaluate "
            "local businesses and qualify them for our digital marketing & automation services.\n\n"
            "Qualification Criteria:\n"
            "- Tier 1 (High Fit): Business has a website but lacks modern conversion features (e.g., no online booking, no chatbot, poor mobile layout, low review count).\n"
            "- Tier 2 (Medium Fit): Business has a functional website but has room for optimization (e.g., slow load times, weak SEO, missing social links).\n"
            "- Tier 3 (Low Fit): Business either has an incredibly optimized modern site, or is completely irrelevant to digital services."
        )),
        ("user", (
            "Evaluate this business:\n\n"
            "Business Name: {name}\n"
            "Category: {category}\n"
            "Google Rating: {rating} ({reviews} reviews)\n"
            "Website Content Snippet:\n{web_content}\n\n"
            "Provide your structured qualification analysis."
        ))
    ])
    
    chain = prompt | structured_llm
    
    return chain.invoke({
        "name": lead_data["name"],
        "category": lead_data["category"],
        "rating": lead_data.get("rating", "N/A"),
        "reviews": lead_data.get("reviews", "N/A"),
        "web_content": website_text
    })
```

### 3. Orchestrate the Complete Pipeline

```python
def run_lead_generation_pipeline(search_query: str, max_leads: int = 5):
    print(f"🚀 Starting pipeline for query: '{search_query}'")
    raw_leads = scrape_google_maps(search_query, limit=max_leads)
    
    qualified_pipeline_output = []
    
    for idx, lead in enumerate(raw_leads):
        print(f"\nProcessing [{idx+1}/{len(raw_leads)}]: {lead['name']}")
        
        # Step 1: Crawl website
        web_content = "No website provided."
        if lead["website"]:
            print(f"🔗 Crawling website: {lead['website']}")
            web_content = fetch_website_snippet(lead["website"])
        
        # Step 2: Run qualification agent
        print("🧠 Running AI Qualification Agent...")
        qualification = qualify_lead(lead, web_content)
        
        # Step 3: Merge results
        enriched_lead = {
            **lead,
            "qualification": qualification.model_dump()
        }
        qualified_pipeline_output.append(enriched_lead)
        
        print(f"✅ Result: {qualification.tier} | Confidence: {qualification.confidence_score}")
        
    return qualified_pipeline_output

if __name__ == "__main__":
    results = run_lead_generation_pipeline("Chiropractors in Denver", max_leads=3)
    print("\n🎯 Final Pipeline Output:")
    print(json.dumps(results, indent=2))
```

---

## JSON Blueprint Configuration

This declarative JSON blueprint represents the workflow configuration. It can be used to port this logic into custom workflow builders, low-code automation platforms, or internal microservices.

```json
{
  "workflow": {
    "name": "Google Maps Lead Enrichment & Qualification",
    "version": "1.0.0",
    "trigger": {
      "type": "manual_or_cron",
      "parameters": {
        "search_query": "Roofing Contractors in Atlanta",
        "max_leads": 20
      }
    },
    "steps": [
      {
        "id": "google_maps_scraper",
        "provider": "serpapi",
        "engine": "google_maps",
        "outputs": {
          "name": "title",
          "website": "website",
          "phone": "phone",
          "rating": "rating",
          "reviews": "reviews"
        }
      },
      {
        "id": "web_crawler",
        "provider": "custom_http_request",
        "timeout_seconds": 10,
        "max_characters_extracted": 3000,
        "fallback": "Skip to qualification with empty content"
      },
      {
        "id": "langchain_classifier",
        "provider": "openai",
        "model": "gpt-4o-mini",
        "temperature": 0.0,
        "schema_type": "pydantic",
        "schema": {
          "tier": "string (Tier 1 | Tier 2 | Tier 3)",
          "pain_points": "array of strings",
          "outreach_angle": "string",
          "confidence_score": "float"
        }
      }
    ],
    "storage": {
      "destination": "postgresql_or_crm",
      "table_name": "qualified_leads"
    }
  }
}
```

---

## Error Handling, Proxies & Rate Limits

When running this pipeline at scale, you will encounter real-world web scraping bottlenecks. Implement these production-grade strategies to keep your pipeline running smoothly:

### 1. Handling Missing or Broken Websites
Many local businesses have broken links or expired domains listed on Google Maps. 
* **Fix**: Wrap your HTTP requests in a `try-except` block with a strict timeout (maximum 10 seconds). If a website fails to load, do not halt the pipeline; instead, pass a fallback string like `"Website unreachable. Qualify based on Google Maps metadata only."` to the LLM.

### 2. Avoiding IP Bans with Rotating Proxies
If you crawl hundreds of local websites directly from your server's IP, you will eventually get blocked by Cloudflare or AWS WAF.
* **Fix**: Integrate a proxy rotation service (such as Bright Data, Oxylabs, or ScrapeOps) into your `requests` session:
  ```python
  proxies = {
      "http": "http://username:password@gate.smartproxy.com:7000",
      "https": "http://username:password@gate.smartproxy.com:7000",
  }
  response = requests.get(url, headers=headers, proxies=proxies, timeout=10)
  ```

### 3. Managing OpenAI Rate Limits
Processing dozens of leads concurrently can trigger OpenAI's Rate Limit Errors (`429: Too Many Requests`).
* **Fix**: Implement exponential backoff using the `tenacity` library, or use LangChain's built-in batching capabilities which handle concurrent requests gracefully:
  ```python
  # Batch processing with LangChain
  results = chain.batch(inputs, config={"max_concurrency": 5})
  ```

### 4. Handling Schema Validation Failures
Occasionally, the LLM might return a JSON structure that doesn't perfectly match your Pydantic schema.
* **Fix**: Use LangChain's `with_structured_output` which automatically handles JSON parsing under the hood. For mission-critical pipelines, wrap the chain invocation in a retry loop that feeds the validation error back to the LLM to self-correct.