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

Manual lead generation is a silent killer of sales productivity. Reps spend hours searching Google Maps, copying website URLs, browsing outdated homepages, and guessing whether a business is a good fit for their B2B services. 

In this guide, we will build a production-grade, fully automated pipeline that extracts local business data from Google Maps, scrapes their websites, and uses LangChain with OpenAI to automatically qualify them into actionable sales tiers (Tier 1, Tier 2, Tier 3) based on custom business criteria.

---

## Architecture Overview

The pipeline operates as a sequential, event-driven workflow designed to minimize API costs and maximize data accuracy:

```
[ Search Query ] 
       │
       ▼
┌──────────────────────────────┐
│  Step 1: Google Maps Scraper │ ──► Extracts Name, Website, Phone, Reviews
└──────────────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│  Step 2: Web Scraping Engine │ ──► Fetches homepage HTML & extracts raw text
└──────────────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│  Step 3: LangChain LLM Agent │ ──► Evaluates site content & scores lead
└──────────────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│   Structured JSON Output     │ ──► Saved to CRM, Database, or CSV
└──────────────────────────────┘
```

1. **Input Trigger:** A target search query (e.g., *"Dentists in Austin, TX"*).
2. **Scraping Tool:** We query the Google Maps API (via SerpApi) to retrieve local business details, filtering out those without websites.
3. **Web Scraper:** A lightweight, resilient scraper fetches the homepage content of each business.
4. **LLM Scoring Agent:** A LangChain chain powered by `gpt-4o-mini` parses the text, extracts key business indicators, and outputs a structured Pydantic schema containing the qualification tier and a personalized outreach angle.
5. **Storage:** The structured data is validated and exported.

---

## Step 1: Setting Up the Environment & Dependencies

To get started, create a virtual environment and install the required dependencies. We will use `langchain-openai` for our LLM integration, `pydantic` for structured output validation, and `google-search-results` to interface with SerpApi.

```bash
pip install langchain langchain-openai pydantic google-search-results beautifulsoup4 requests python-dotenv
```

Create a `.env` file in your project root to store your API credentials:

```env
OPENAI_API_KEY=your_openai_api_key_here
SERPAPI_API_KEY=your_serpapi_api_key_here
```

Now, let's initialize our environment and import the core modules:

```python
import os
from typing import Optional, List
from enum import Enum
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()

# Verify API keys are loaded
assert os.getenv("OPENAI_API_KEY"), "Missing OPENAI_API_KEY"
assert os.getenv("SERPAPI_API_KEY"), "Missing SERPAPI_API_KEY"
```

---

## Step 2: Extracting Maps Data

We will use SerpApi's Google Maps search engine to extract local business listings. This provides clean, structured JSON data including the business name, rating, address, and—most importantly—their website URL.

```python
from serpapi import GoogleSearch

def fetch_google_maps_leads(query: str, limit: int = 10) -> List[dict]:
    """
    Fetches local business listings from Google Maps using SerpApi.
    """
    params = {
        "engine": "google_maps",
        "q": query,
        "api_key": os.getenv("SERPAPI_API_KEY"),
        "num": limit
    }
    
    search = GoogleSearch(params)
    results = search.get_dict()
    
    raw_places = results.get("local_results", [])
    leads = []
    
    for place in raw_places:
        # We only care about businesses with a website to qualify
        if place.get("website"):
            leads.append({
                "name": place.get("title"),
                "website": place.get("website"),
                "phone": place.get("phone", "N/A"),
                "address": place.get("address", "N/A"),
                "rating": place.get("rating", 0.0),
                "reviews": place.get("reviews", 0)
            })
            
    return leads[:limit]

# Example execution:
if __name__ == "__main__":
    test_leads = fetch_google_maps_leads("Web Design Agencies in Miami", limit=3)
    print(f"Extracted {len(test_leads)} leads with websites.")
```

---

## Step 3: Automated Lead Scoring with LLM Chains

Once we have the business websites, we need to scrape their homepages and pass the text to an LLM. 

To ensure our LLM outputs reliable, structured data instead of free-form text, we will use **LangChain's structured output engine** bound to a **Pydantic schema**.

### 1. Define the Structured Output Schema

We define a `LeadTier` enum and a Pydantic model that the LLM must conform to.

```python
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

class LeadTier(str, Enum):
    TIER_1 = "Tier 1 (High Fit - Immediate Outreach)"
    TIER_2 = "Tier 2 (Medium Fit - Nurture)"
    TIER_3 = "Tier 3 (Low Fit - Discard)"

class LeadQualification(BaseModel):
    tier: LeadTier = Field(description="The qualification tier of the business based on their website content.")
    reasoning: str = Field(description="Detailed explanation of why this tier was assigned.")
    services_offered: List[str] = Field(description="List of services or products identified on their website.")
    estimated_company_size: str = Field(description="Inferred size of the company (e.g., Solo, Boutique, Mid-market, Enterprise).")
    suggested_outreach_angle: str = Field(description="A highly personalized, pain-point-driven outreach hook for sales reps.")
```

### 2. Build the Web Scraper & Qualification Chain

We will write a robust helper function to scrape the raw text from the target website, clean it, and pass it to our LangChain qualification agent.

```python
import requests
from bs4 import BeautifulSoup

def scrape_website_text(url: str) -> str:
    """
    Fetches the raw HTML of a website and extracts clean text.
    """
    try:
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code != 200:
            return ""
        
        soup = BeautifulSoup(response.text, "html.parser")
        
        # Remove script and style elements
        for script in soup(["script", "style"]):
            script.decompose()
            
        text = soup.get_text(separator=" ")
        # Clean up whitespace
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        return " ".join(chunk for chunk in chunks if chunk)[:4000] # Cap at 4000 chars to save tokens
    except Exception as e:
        print(f"Failed to scrape {url}: {e}")
        return ""

def qualify_lead(business_name: str, website_text: str) -> LeadQualification:
    """
    Uses LangChain and GPT-4o-mini to qualify a lead based on scraped website text.
    """
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
    structured_llm = llm.with_structured_output(LeadQualification)
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", (
            "You are an elite B2B Sales Development Representative (SDR) specializing in lead qualification.\n"
            "Analyze the provided website text of a business and qualify them based on these criteria:\n\n"
            "- **Tier 1**: Modern website, clear high-value services, active business, looks like they have budget.\n"
            "- **Tier 2**: Decent website but lacks optimization, missing clear service definitions, or looks like a small boutique shop.\n"
            "- **Tier 3**: Outdated website, broken layout, single-person operation, or completely irrelevant niche.\n\n"
            "Be objective and critical. Provide a highly personalized outreach angle based on their specific services."
        )),
        ("human", "Business Name: {business_name}\nWebsite Content:\n{website_text}")
    ])
    
    chain = prompt | structured_llm
    return chain.invoke({"business_name": business_name, "website_text": website_text})
```

### 3. Orchestrate the Pipeline

Now, let's tie the Google Maps scraper and the LangChain qualification agent together.

```python
def run_lead_generation_pipeline(query: str, limit: int = 5):
    print(f"🚀 Starting pipeline for query: '{query}'")
    leads = fetch_google_maps_leads(query, limit=limit)
    
    qualified_leads = []
    
    for lead in leads:
        print(f"\n🔍 Processing: {lead['name']} ({lead['website']})")
        web_text = scrape_website_text(lead["website"])
        
        if not web_text:
            print(f"⚠️ Skipping {lead['name']} - Could not scrape website.")
            continue
            
        qualification = qualify_lead(lead["name"], web_text)
        
        enriched_lead = {
            **lead,
            "qualification": qualification.dict()
        }
        qualified_leads.append(enriched_lead)
        
        print(f"✅ Qualified as: {qualification.tier}")
        print(f"💡 Outreach Angle: {qualification.suggested_outreach_angle}")
        
    return qualified_leads

if __name__ == "__main__":
    results = run_lead_generation_pipeline("Dental Clinics in Austin", limit=2)
```

---

## JSON Blueprint Configuration

If you are deploying this workflow inside an enterprise automation platform (such as n8n, Make, or a custom internal orchestrator), you can represent this LangChain agentic workflow with the following declarative JSON blueprint:

```json
{
  "workflow": {
    "name": "Google Maps Lead Scraper & Qualifier",
    "version": "1.0.0",
    "nodes": [
      {
        "id": "trigger_search",
        "type": "cron",
        "properties": {
          "schedule": "0 9 * * 1",
          "query": "Plumbing Contractors in Phoenix"
        }
      },
      {
        "id": "maps_scraper",
        "type": "serpapi_google_maps",
        "properties": {
          "api_key": "{{env.SERPAPI_API_KEY}}",
          "limit": 50
        }
      },
      {
        "id": "http_web_scraper",
        "type": "headless_browser",
        "properties": {
          "target_url": "{{nodes.maps_scraper.output.website}}",
          "timeout_ms": 10000
        }
      },
      {
        "id": "langchain_agent",
        "type": "llm_chain",
        "properties": {
          "model": "gpt-4o-mini",
          "temperature": 0.0,
          "response_format": "json_object",
          "schema": {
            "type": "object",
            "properties": {
              "tier": { "type": "string", "enum": ["Tier 1", "Tier 2", "Tier 3"] },
              "reasoning": { "type": "string" },
              "suggested_outreach_angle": { "type": "string" }
            },
            "required": ["tier", "reasoning", "suggested_outreach_angle"]
          }
        }
      }
    ],
    "connections": [
      { "from": "trigger_search", "to": "maps_scraper" },
      { "from": "maps_scraper", "to": "http_web_scraper" },
      { "from": "http_web_scraper", "to": "langchain_agent" }
    ]
  }
}
```

---

## Error Handling, Proxies & Rate Limits

Running web scrapers and LLMs at scale in production requires defensive engineering. Here is how to keep your pipeline from breaking:

### 1. Handling Anti-Bot Protection (Cloudflare/CAPTCHAs)
Many business websites use Cloudflare, AWS WAF, or Akamai to block automated scripts. 
* **Solution:** Replace the basic `requests` library with a stealth browser or a proxy-backed scraping API like **ScrapingBee** or **ZenRows**.
* **Implementation:**
  ```python
  # Example using a proxy service instead of direct requests
  def scrape_with_proxy(url: str) -> str:
      proxy_url = f"http://api.scrapingdog.com/scrape?api_key=YOUR_KEY&url={url}"
      response = requests.get(proxy_url)
      return response.text
  ```

### 2. Handling LLM Rate Limits & Token Overflows
If you scrape a massive homepage, you might exceed the context window of the LLM or hit rate limits (TPM/RPM).
* **Solution 1 (Truncation):** Always slice your scraped text to a safe limit (e.g., `text[:4000]`). The core value proposition of a business is almost always found in the header, hero section, and top navigation.
* **Solution 2 (Exponential Backoff):** Wrap your LangChain calls in a retry decorator using the `tenacity` library:
  ```python
  from tenacity import retry, stop_after_attempt, wait_random_exponential

  @retry(wait=wait_random_exponential(min=1, max=60), stop=stop_after_attempt(5))
  def qualify_lead_with_retry(business_name: str, website_text: str):
      return qualify_lead(business_name, website_text)
  ```

### 3. Handling Missing or Broken Websites
Many local businesses have broken links on Google Maps.
* **Solution:** Implement strict validation. If the website URL is empty, does not resolve, or returns a `404`/`500` status code, immediately flag the lead as **Tier 3** without spending LLM tokens. This simple check can save up to 30% on your monthly OpenAI bill.