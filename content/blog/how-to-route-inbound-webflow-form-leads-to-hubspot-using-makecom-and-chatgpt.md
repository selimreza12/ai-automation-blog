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

Manual lead generation is a silent killer of sales productivity. Reps spend hours copy-pasting local business details from Google Maps, visiting outdated websites, and guessing whether a prospect has the budget or need for their services. 

In this guide, we will build a production-grade, fully automated pipeline that extracts local business leads from Google Maps, scrapes their websites, and uses LangChain with GPT-4o to automatically qualify and score them into actionable tiers.

---

## Architecture Overview

This automated pipeline operates in four distinct stages to turn raw geographical queries into highly qualified B2B prospects:

```
[ Input Query ] ──> [ Google Maps Scraper ] ──> [ Website Content Extractor ]
                                                              │
[ Google Sheets / CRM ] <── [ Structured Lead Tiering ] <── [ LangChain LLM Agent ]
```

1. **Input Trigger:** A search query (e.g., *"Dentists in Austin, TX"* or *"HVAC Contractors in Chicago"*) initiates the workflow.
2. **Scraping Engine:** A Google Maps extraction utility retrieves business names, physical addresses, phone numbers, star ratings, and website URLs.
3. **LLM Scoring Agent:** A LangChain agent scrapes the homepage of each identified website, extracts its core positioning, and uses a structured Pydantic schema to classify the lead into Tier 1 (High Fit), Tier 2 (Medium Fit), or Tier 3 (Low Fit).
4. **Storage & Delivery:** Qualified leads are structured into clean JSON and prepared for direct injection into your CRM (e.g., HubSpot) or a database.

---

## Step 1: Setting Up the Environment & Dependencies

To get started, we need to install the required libraries. We will use `langchain` and `langchain-openai` for orchestrating our AI agent, `pydantic` for structured data validation, and `beautifulsoup4` along with `requests` for web scraping.

Run the following command in your terminal:

```bash
pip install langchain langchain-openai pydantic beautifulsoup4 requests google-search-results
```

Next, set up your environment variables. Create a `.env` file or export them directly in your terminal:

```bash
export OPENAI_API_KEY="your-openai-api-key"
export SERPAPI_API_KEY="your-serpapi-api-key" # Used for Google Maps scraping
```

Now, let's initialize our Python script and import the required modules:

```python
import os
import json
from typing import Optional, List
from enum import Enum
from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from bs4 import BeautifulSoup
import requests

# Ensure API keys are loaded
assert os.environ.get("OPENAI_API_KEY"), "Please set your OPENAI_API_KEY"
```

---

## Step 2: Extracting Maps Data

To extract local business data from Google Maps programmatically, we will use the SerpApi Google Maps tool. This provides a clean, structured JSON response containing business details, avoiding the need to write complex, fragile Selenium scripts to bypass Google's anti-scraping walls.

Here is the implementation of our Maps scraper:

```python
def fetch_google_maps_leads(query: str, limit: int = 5) -> List[dict]:
    """
    Fetches local business listings from Google Maps using SerpApi.
    """
    api_key = os.environ.get("SERPAPI_API_KEY")
    if not api_key:
        print("SerpApi key missing. Returning mock data for demonstration.")
        return get_mock_maps_data()

    url = "https://serpapi.com/search.json"
    params = {
        "engine": "google_maps",
        "q": query,
        "type": "search",
        "api_key": api_key
    }

    try:
        response = requests.get(url, params=params, timeout=15)
        response.raise_for_status()
        results = response.json().get("local_results", [])
        
        leads = []
        for place in results[:limit]:
            leads.append({
                "name": place.get("title"),
                "phone": place.get("phone"),
                "website": place.get("website"),
                "address": place.get("address"),
                "rating": place.get("rating"),
                "reviews": place.get("reviews"),
            })
        return leads
    except Exception as e:
        print(f"Error fetching Maps data: {e}")
        return get_mock_maps_data()

def get_mock_maps_data() -> List[dict]:
    return [
        {
            "name": "Austin Elite Dental",
            "phone": "+1 512-555-0199",
            "website": "https://example-elite-dental.com",
            "address": "1201 San Jacinto Blvd, Austin, TX 78701",
            "rating": 4.8,
            "reviews": 124
        },
        {
            "name": "Capital City Family Dentistry",
            "phone": "+1 512-555-0143",
            "website": None, # No website listed
            "address": "3801 S Congress Ave, Austin, TX 78704",
            "rating": 4.2,
            "reviews": 45
        }
    ]
```

---

## Step 3: Automated Lead Scoring with LLM Chains

Once we have the website URL, we need to scrape its homepage content and pass it to our LangChain LLM agent. 

To ensure our agent outputs predictable, production-ready data, we will use **Pydantic** to define a strict schema. The LLM must categorize the lead into one of three tiers:
*   **Tier 1 (High Fit):** Has an active business, offers premium services, but has clear digital marketing or technical gaps (e.g., no modern booking system, slow site, or missing SEO optimization).
*   **Tier 2 (Medium Fit):** Standard business, moderate online presence, potential fit for standard packages.
*   **Tier 3 (Low Fit):** No website, out of business, or already fully optimized with an in-house agency.

### 1. Define the Structured Output Schema

```python
class LeadTier(str, Enum):
    TIER_1 = "Tier 1 (High Fit)"
    TIER_2 = "Tier 2 (Medium Fit)"
    TIER_3 = "Tier 3 (Low Fit)"

class LeadQualification(BaseModel):
    tier: LeadTier = Field(description="The qualification tier of the business based on their website content.")
    confidence_score: float = Field(description="Confidence score between 0.0 and 1.0.")
    pain_points: List[str] = Field(description="Identified technical, design, or marketing weaknesses on their website.")
    outreach_angle: str = Field(description="A highly personalized, value-first hook to use in a cold email or call.")
    estimated_budget_capacity: str = Field(description="Estimated budget capacity: High, Medium, or Low.")
```

### 2. Implement the Website Scraper & Qualification Chain

```python
def scrape_website_homepage(url: Optional[str]) -> str:
    """
    Scrapes the raw text content of a website's homepage.
    """
    if not url:
        return "No website available for this business."
    
    try:
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, "html.parser")
        # Remove script and style elements to clean up text
        for script in soup(["script", "style"]):
            script.decompose()
            
        text = soup.get_text(separator=" ")
        # Clean up whitespace
        cleaned_text = " ".join(text.split())
        return cleaned_text[:3000] # Limit to first 3000 chars to save tokens
    except Exception as e:
        return f"Failed to scrape website: {str(e)}"

def qualify_lead(business_name: str, website_text: str) -> LeadQualification:
    """
    Uses LangChain and GPT-4o to analyze website content and qualify the lead.
    """
    llm = ChatOpenAI(model="gpt-4o", temperature=0.2)
    structured_llm = llm.with_structured_output(LeadQualification)

    prompt = ChatPromptTemplate.from_messages([
        ("system", (
            "You are an elite B2B Growth Consultant specializing in local business lead qualification.\n"
            "Your job is to analyze a prospect's website content and determine if they are a good fit "
            "for high-ticket digital marketing, SEO, and custom web development services.\n\n"
            "Analyze the business: {business_name}\n"
            "Website Content:\n{website_text}\n\n"
            "Evaluate their current positioning, identify technical or marketing gaps, and output "
            "your structured analysis strictly matching the requested schema."
        ))
    ])

    # Combine prompt and structured LLM into a chain
    qualification_chain = prompt | structured_llm
    
    return qualification_chain.invoke({
        "business_name": business_name,
        "website_text": website_text
    })
```

### 3. Running the Pipeline

Let's tie the scraping and qualification steps together in a main execution loop:

```python
if __name__ == "__main__":
    search_query = "Dentists in Austin, TX"
    print(f"🚀 Starting lead generation pipeline for: '{search_query}'...")
    
    # Step 1: Fetch leads from Google Maps
    raw_leads = fetch_google_maps_leads(search_query, limit=2)
    
    qualified_leads_portfolio = []

    for lead in raw_leads:
        print(f"\nEvaluating: {lead['name']}...")
        
        # Step 2: Scrape website content
        homepage_content = scrape_website_homepage(lead["website"])
        
        # Step 3: Qualify with LangChain
        if lead["website"]:
            qualification = qualify_lead(lead["name"], homepage_content)
        else:
            # Auto-assign to Tier 3 if no website exists (or flag for custom web design outreach)
            qualification = LeadQualification(
                tier=LeadTier.TIER_1, # High fit for a new website build!
                confidence_score=0.9,
                pain_points=["No digital footprint", "Missing Google Maps website link"],
                outreach_angle="Offer a free mock-up of a modern, fast-loading website to capture local search traffic.",
                estimated_budget_capacity="Medium"
            )
        
        # Merge data
        enriched_lead = {
            "business_info": lead,
            "qualification": qualification.model_dump()
        }
        qualified_leads_portfolio.append(enriched_lead)
        
        print(f"Result: {qualification.tier} | Confidence: {qualification.confidence_score}")
        print(f"Suggested Hook: {qualification.outreach_angle}")

    # Save output
    with open("qualified_leads.json", "w") as f:
        json.dump(qualified_leads_portfolio, f, indent=2)
    print("\n✅ Pipeline execution complete. Results saved to 'qualified_leads.json'.")
```

---

## JSON Blueprint Configuration

For enterprise deployments, you should manage your pipeline using a centralized configuration file. This allows you to adjust qualification parameters, target industries, and model settings without modifying the core Python code.

Save this configuration as `pipeline_config.json`:

```json
{
  "pipeline_metadata": {
    "name": "Google Maps Lead Enrichment & Qualification",
    "version": "2.1.0",
    "target_geographies": ["Austin, TX", "Denver, CO", "Miami, FL"]
  },
  "scraping_parameters": {
    "serpapi_engine": "google_maps",
    "max_results_per_query": 50,
    "request_timeout_seconds": 15,
    "user_agent_rotation": true
  },
  "llm_agent_settings": {
    "model": "gpt-4o",
    "temperature": 0.15,
    "max_tokens_limit": 4096,
    "qualification_criteria": {
      "tier_1_conditions": {
        "min_rating": 4.0,
        "max_reviews": 150,
        "website_speed_issues": true,
        "missing_ssl": true
      }
    }
  },
  "storage_targets": {
    "local_json_path": "./data/output/qualified_leads.json",
    "crm_sync": {
      "enabled": true,
      "platform": "HubSpot",
      "deal_stage": "Lead Identified"
    }
  }
}
```

---

## Error Handling, Proxies & Rate Limits

Running web scrapers and AI agents at scale requires robust defensive engineering. If you run this pipeline across hundreds of leads daily, you will encounter rate limits, IP blocks, and malformed HTML. Use these production-grade strategies to keep your pipeline running smoothly:

### 1. Implement Exponential Backoff for LLM Calls
API rate limits (`HTTP 429`) can halt your pipeline. Use the `tenacity` library to automatically retry failed LLM or scraping requests:

```python
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
def qualify_lead_with_retry(business_name: str, website_text: str) -> LeadQualification:
    return qualify_lead(business_name, website_text)
```

### 2. Use Rotating Proxies for Website Scraping
Target websites will quickly block your server's IP address if you scrape dozens of sites in a short window. Integrate a rotating proxy service (such as Bright Data, Oxylabs, or ScraperAPI) into your `requests` calls:

```python
PROXIES = {
    "http": "http://username:password@proxy-server.com:8000",
    "https": "http://username:password@proxy-server.com:8000",
}

response = requests.get(url, headers=headers, proxies=PROXIES, timeout=10)
```

### 3. Handle Token Limits Gracefully
Some local business websites contain massive amounts of text or inline scripts that can exceed the context window of your LLM or inflate your API bill. Always clean and truncate your scraped text:
* Strip out `<nav>`, `<footer>`, `<script>`, and `<style>` tags using BeautifulSoup before extracting text.
* Truncate the final string to a safe limit (e.g., 3,000 to 4,000 characters). The core value proposition and contact details are almost always found in the header and hero sections of the homepage.