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

Building a high-yield B2B outbound engine requires clean data and highly personalized qualification. Manual prospecting is slow, and generic scraping lists are bloated with dead leads. 

This production-grade architecture automates the entire pipeline by combining structured local data extraction with LLM-powered semantic analysis:

```
[Search Query] ──> [Google Places API] ──> [Target Website Scraper]
                                                   │
                                                   ▼
[Structured Lead Data] <── [Airtable/DB] <── [LangChain Scoring Agent]
```

The workflow operates in four stages:
1. **Input Trigger & Extraction:** A search query (e.g., *"Roofing Contractors in Miami"*) triggers the Google Places API to extract business names, physical addresses, ratings, and website URLs.
2. **Web Scraping & Content Extraction:** A resilient HTTP client scrapes the homepage and "About Us" pages of the extracted websites to gather raw context.
3. **LLM Scoring Agent:** A LangChain agent running `gpt-4o-mini` parses the scraped text against a strict Pydantic schema, evaluating B2B fit and classifying the lead into Tier 1, Tier 2, or Tier 3.
4. **Storage & Sync:** Qualified leads are formatted and saved to a structured database or Airtable for immediate sales outreach.

---

## Step 1: Setting Up the Environment & Dependencies

To run this pipeline, you need Python 3.10+ and API keys for Google Maps (Places API) and OpenAI.

First, install the required dependencies:

```bash
pip install langchain langchain-openai pydantic googlemaps beautifulsoup4 httpx
```

Next, set up your environment variables:

```bash
export OPENAI_API_KEY="your-openai-api-key"
export GOOGLE_MAPS_API_KEY="your-google-maps-key"
```

Here is the base initialization script importing our core modules:

```python
import os
from typing import Optional, List
from pydantic import BaseModel, Field, HttpUrl
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
import googlemaps
import httpx
from bs4 import BeautifulSoup

# Verify environment
assert os.getenv("OPENAI_API_KEY"), "Missing OPENAI_API_KEY"
assert os.getenv("GOOGLE_MAPS_API_KEY"), "Missing GOOGLE_MAPS_API_KEY"

# Initialize clients
gmaps_client = googlemaps.Client(key=os.getenv("GOOGLE_MAPS_API_KEY"))
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
```

---

## Step 2: Extracting Maps Data

We use the Google Places API to find target businesses. Once we retrieve the places, we extract their website URLs and scrape their homepages to gather context for our LLM.

```python
def fetch_local_businesses(query: str, limit: int = 10) -> List[dict]:
    """Fetches business details from Google Places API."""
    places_result = gmaps_client.places(query=query)
    businesses = []
    
    for place in places_result.get("results", [])[:limit]:
        place_id = place.get("place_id")
        # Fetch detailed place information (specifically website)
        details = gmaps_client.place(place_id=place_id, fields=["name", "formatted_phone_number", "website", "formatted_address"])
        result = details.get("result", {})
        
        if result.get("website"):
            businesses.append({
                "name": result.get("name"),
                "phone": result.get("formatted_phone_number"),
                "website": result.get("website"),
                "address": result.get("formatted_address")
            })
    return businesses

def scrape_website_homepage(url: str) -> str:
    """Scrapes the homepage of a target business and extracts raw text."""
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    try:
        with httpx.Client(timeout=10.0, follow_redirects=True, headers=headers) as client:
            response = client.get(url)
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
            return " ".join(chunk for chunk in chunks if chunk)[:4000] # Limit to 4000 chars for token efficiency
    except Exception as e:
        print(f"Failed to scrape {url}: {str(e)}")
        return ""
```

---

## Step 3: Automated Lead Scoring with LLM Chains

Now, we define our qualification criteria using **Pydantic**. We want the LLM to categorize leads into three tiers:
*   **Tier 1 (High Fit):** Clear B2B offering, modern website, active services, explicit contact info.
*   **Tier 2 (Medium Fit):** Local business, but website is outdated or services are poorly defined.
*   **Tier 3 (Low Fit):** Broken site, irrelevant industry, or strictly B2C with no high-ticket value.

```python
# Define structured output schema
class LeadQualification(BaseModel):
    company_name: str = Field(description="Name of the company being evaluated")
    estimated_size: str = Field(description="Estimated size category: Small, Medium, Large")
    primary_services: List[str] = Field(description="List of core services offered by the business")
    qualification_tier: str = Field(description="Tier 1 (High Fit), Tier 2 (Medium Fit), or Tier 3 (Low Fit)")
    fit_score: int = Field(description="A score from 1 to 100 based on B2B alignment and outreach potential")
    reasoning: str = Field(description="Detailed justification for the assigned tier and fit score")
    suggested_angle: str = Field(description="Personalized cold outreach angle based on their website copy")

# Create the structured LLM chain
structured_llm = llm.with_structured_output(LeadQualification)

qualification_prompt = ChatPromptTemplate.from_messages([
    ("system", (
        "You are an elite B2B Sales Development Representative. Your job is to analyze "
        "the scraped homepage content of a local business and qualify them as a potential B2B lead.\n\n"
        "Analyze the text carefully. Look for signs of high-ticket services, professional operations, "
        "and potential pain points (e.g., lack of online booking, outdated copy, missing social links)."
    )),
    ("user", "Company Name: {company_name}\nWebsite: {website}\nScraped Content:\n{scraped_content}")
])

qualification_chain = qualification_prompt | structured_llm
```

### Running the Pipeline

Here is how you execute the complete pipeline to extract, scrape, and qualify:

```python
def run_lead_generation_pipeline(search_query: str):
    print(f"🔍 Searching Google Maps for: '{search_query}'...")
    raw_leads = fetch_local_businesses(search_query, limit=5)
    
    qualified_leads = []
    
    for lead in raw_leads:
        print(f"\n🌐 Scraping website for {lead['name']}: {lead['website']}...")
        content = scrape_website_homepage(lead['website'])
        
        if not content:
            print(f"⚠️ Skipping {lead['name']} due to empty or blocked website content.")
            continue
            
        print(f"🤖 Analyzing and scoring lead with LangChain...")
        try:
            qualification: LeadQualification = qualification_chain.invoke({
                "company_name": lead["name"],
                "website": lead["website"],
                "scraped_content": content
            })
            
            # Merge Google Maps data with LLM qualification data
            lead_profile = {**lead, **qualification.model_dump()}
            qualified_leads.append(lead_profile)
            
            print(f"✅ Qualified: {lead['name']} -> {qualification.qualification_tier} (Score: {qualification.fit_score}/100)")
        except Exception as e:
            print(f"❌ Error qualifying lead {lead['name']}: {e}")
            
    return qualified_leads

if __name__ == "__main__":
    results = run_lead_generation_pipeline("Commercial HVAC Contractors in Atlanta")
    # Output results to console or save to database
```

---

## JSON Blueprint Configuration

To run this workflow programmatically or integrate it into an orchestration platform (like LangGraph, Prefect, or custom microservices), use this standardized JSON configuration blueprint:

```json
{
  "workflow": {
    "name": "Google Maps Lead Enrichment & Qualification",
    "version": "1.2.0",
    "parameters": {
      "search_query": "Commercial HVAC Contractors in Atlanta",
      "max_places_to_fetch": 20,
      "scraping_timeout_seconds": 10,
      "target_qualification_tiers": ["Tier 1", "Tier 2"]
    },
    "llm_config": {
      "provider": "openai",
      "model": "gpt-4o-mini",
      "temperature": 0.0,
      "max_tokens": 800
    },
    "storage_target": {
      "type": "airtable",
      "base_id": "appXyZ123456",
      "table_name": "Qualified Leads",
      "mapping": {
        "Company": "company_name",
        "Website": "website",
        "Phone": "phone",
        "Tier": "qualification_tier",
        "Score": "fit_score",
        "Outreach Angle": "suggested_angle",
        "Reasoning": "reasoning"
      }
    }
  }
}
```

---

## Error Handling, Proxies & Rate Limits

When running this pipeline at scale, you will quickly encounter real-world bottlenecks. Implement these production strategies to keep your pipeline running smoothly:

### 1. Web Scraping & IP Bans
Many business websites use Cloudflare, AWS WAF, or basic IP rate-limiting. Standard `httpx` requests will eventually return `403 Forbidden` or `429 Too Many Requests`.
*   **Solution:** Integrate a smart proxy rotator (such as Bright Data, ZenRows, or Crawlbase). Replace your standard HTTP client with a proxy-enabled session:
    ```python
    proxies = {
        "all://": "http://username:password@proxy-server.com:port"
    }
    with httpx.Client(proxies=proxies) as client:
        # Requests are now routed through residential IPs
    ```

### 2. Handling Google Maps API Costs
The Google Places API can become expensive if you run broad queries daily.
*   **Solution:** Cache your search results. Store the `place_id` of every business you query in a local SQLite or Redis database. Before calling the Places API, check if the business has already been processed within the last 30 days.

### 3. LLM Rate Limits & Token Management
If you pass 4,000 characters of raw HTML text for 50 leads simultaneously, you will hit OpenAI's Tokens Per Minute (TPM) limit.
*   **Solution:** Use LangChain's built-in exponential backoff to automatically retry failed API calls:
    ```python
    llm = ChatOpenAI(
        model="gpt-4o-mini",
        max_retries=5,
        timeout=30
    )
    ```
*   **Text Truncation:** Ensure you strip HTML tags using BeautifulSoup's `get_text()` *before* sending data to the LLM. Never send raw HTML source code; only send clean, parsed text.