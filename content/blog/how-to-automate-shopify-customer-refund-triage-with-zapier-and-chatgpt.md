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

Building a scalable, automated outbound engine requires moving away from manual list-building and generic outreach. This architecture automates the discovery and qualification of local business leads by combining Google Maps data extraction with an LLM-powered qualification agent.

The workflow operates in four distinct phases:

```
[Trigger / Search Query] 
       │
       ▼
[Google Maps Scraper] ──► Extracts: Name, Website, Phone, Rating, Address
       │
       ▼
[Web Content Fetcher] ──► Scrapes homepage HTML / Meta tags of the prospect
       │
       ▼
[LangChain LLM Agent] ──► Evaluates business fit & assigns Tier (1, 2, or 3)
       │
       ▼
[Structured Storage]  ──► Saves qualified leads to PostgreSQL / CRM
```

1. **Input Trigger:** A search query specifying an industry and location (e.g., "HVAC services in Austin, TX").
2. **Scraping Tool:** A Google Maps scraper (using SerpApi or a custom Playwright script) to extract high-level business details, specifically targeting the business's website URL.
3. **LLM Scoring Agent:** A LangChain agent powered by `gpt-4o` that fetches the homepage content of the extracted website, analyzes its services, and scores the lead's intent and fit.
4. **Storage:** Structured output is written to a database or CRM, filtering out low-tier prospects to protect sender reputation during outreach.

---

## Step 1: Setting Up the Environment & Dependencies

To build this pipeline, we will use modern LangChain packages (`@langchain/openai` and core community utilities) along with Pydantic for strict output parsing.

First, install the required dependencies:

```bash
pip install langchain langchain-openai pydantic beautifulsoup4 requests playright
playwright install
```

Next, set up your environment variables. Create a `.env` file or export them directly in your terminal:

```bash
export OPENAI_API_KEY="your-openai-api-key"
export SERPAPI_API_KEY="your-serpapi-api-key"
```

Now, let's initialize our environment and define our structured output schema using Pydantic. This schema ensures the LLM returns data in a predictable JSON format.

```python
import os
from typing import Literal
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()

# Define the structured output schema for lead qualification
class LeadQualification(BaseModel):
    business_name: str = Field(description="The official name of the business.")
    tier: Literal["Tier 1", "Tier 2", "Tier 3"] = Field(
        description="Tier 1: High-value target, modern site, clear B2B fit. Tier 2: Medium value, needs optimization. Tier 3: Poor fit, broken site, or irrelevant."
    )
    pain_points: list[str] = Field(description="Identified pain points from their website (e.g., no online booking, slow load speed, outdated design).")
    outreach_hook: str = Field(description="A highly personalized, specific cold outreach hook referencing their site content.")
    estimated_revenue_bracket: Literal["Low", "Medium", "High"] = Field(description="Estimated business scale based on site complexity and services.")
```

---

## Step 2: Extracting Maps Data

We will use SerpApi's Google Maps engine to extract local business listings. This method is highly reliable and avoids the IP-blocking issues associated with raw scraping of Google Maps.

The following script queries Google Maps, extracts key fields, and filters out listings that do not have a website.

```python
import requests

def fetch_google_maps_leads(query: str, limit: int = 10) -> list[dict]:
    """
    Fetches local business leads from Google Maps using SerpApi.
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

    try:
        response = requests.get("https://serpapi.com/search", params=params)
        response.raise_for_status()
        results = response.json()
    except Exception as e:
        print(f"Error fetching data from SerpApi: {e}")
        return []

    local_results = results.get("local_results", [])
    leads = []

    for business in local_results[:limit]:
        # We only want leads with websites to qualify
        if "website" in business and business["website"]:
            leads.append({
                "name": business.get("title"),
                "website": business.get("website"),
                "phone": business.get("phone"),
                "address": business.get("address"),
                "rating": business.get("rating"),
                "reviews": business.get("reviews")
            })
            
    return leads

# Example execution
if __name__ == "__main__":
    test_leads = fetch_google_maps_leads("Plumbers in Miami", limit=3)
    print(f"Extracted {len(test_leads)} leads with websites.")
```

---

## Step 3: Automated Lead Scoring with LLM Chains

Once we have the website URL, we need to fetch its content and pass it to our LangChain agent. To prevent token overflow, we will scrape only the homepage's text content, stripping out HTML tags, scripts, and styles.

```python
from bs4 import BeautifulSoup
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

def scrape_website_homepage(url: str) -> str:
    """
    Scrapes the homepage of a prospect and returns clean text content.
    """
    try:
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, "html.parser")
        
        # Remove script and style elements
        for script in soup(["script", "style"]):
            script.decompose()
            
        text = soup.get_text(separator=" ")
        # Clean up whitespace
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        clean_text = "\n".join(chunk for chunk in chunks if chunk)
        
        # Return first 4000 characters to stay within context limits
        return clean_text[:4000]
    except Exception as e:
        print(f"Failed to scrape {url}: {e}")
        return ""

def qualify_lead(lead_data: dict, website_text: str) -> LeadQualification:
    """
    Uses LangChain and GPT-4o to analyze website content and qualify the lead.
    """
    llm = ChatOpenAI(model="gpt-4o", temperature=0.2)
    structured_llm = llm.with_structured_output(LeadQualification)

    prompt_template = ChatPromptTemplate.from_messages([
        ("system", (
            "You are an elite B2B Growth Marketer and Lead Qualification Agent. "
            "Your job is to analyze a prospect's website content and Google Maps metadata "
            "to determine if they are a high-value fit for our premium digital marketing services.\n\n"
            "Evaluation Criteria:\n"
            "- Tier 1: Modern business, active services, but clear gaps like missing booking widgets or poor SEO copy.\n"
            "- Tier 2: Decent business, but website is outdated or slow.\n"
            "- Tier 3: Broken website, irrelevant industry, or no clear business operations."
        )),
        ("user", (
            "Prospect Metadata:\n"
            "Name: {name}\n"
            "Google Rating: {rating} ({reviews} reviews)\n"
            "Website: {website}\n\n"
            "Scraped Website Content:\n"
            "\"\"\"\n{web_content}\n\"\"\""
        ))
    ])

    # Chain execution
    chain = prompt_template | structured_llm
    
    result = chain.invoke({
        "name": lead_data["name"],
        "rating": lead_data.get("rating", "N/A"),
        "reviews": lead_data.get("reviews", "0"),
        "website": lead_data["website"],
        "web_content": website_text if website_text else "Could not retrieve website content."
    })
    
    return result
```

### Running the Complete Pipeline

Here is how you tie the scraper and the qualification agent together:

```python
def run_pipeline(search_query: str):
    print(f"Starting pipeline for query: '{search_query}'...")
    raw_leads = fetch_google_maps_leads(search_query, limit=5)
    
    qualified_pipeline_results = []
    
    for lead in raw_leads:
        print(f"\nProcessing: {lead['name']} ({lead['website']})")
        web_content = scrape_website_homepage(lead["website"])
        
        qualification = qualify_lead(lead, web_content)
        
        # Combine original lead data with LLM qualification results
        final_lead_profile = {
            **lead,
            "qualification": qualification.model_dump()
        }
        qualified_pipeline_results.append(final_lead_profile)
        
        print(f"Assigned: {qualification.tier}")
        print(f"Hook: {qualification.outreach_hook}")
        
    return qualified_pipeline_results

if __name__ == "__main__":
    results = run_pipeline("Roofing contractors in Denver")
```

---

## JSON Blueprint Configuration

For enterprise automation platforms (such as custom internal tools or workflow engines), this configuration can be represented as a declarative JSON blueprint. This blueprint defines the execution steps, API integrations, and schema validation rules.

```json
{
  "workflow": {
    "id": "maps_lead_qualification_pipeline",
    "version": "1.1.0",
    "trigger": {
      "type": "schedule",
      "cron": "0 9 * * 1"
    },
    "steps": [
      {
        "id": "fetch_maps_data",
        "type": "api_call",
        "provider": "serpapi",
        "endpoint": "google_maps",
        "parameters": {
          "q": "HVAC repair Austin TX",
          "engine": "google_maps"
        }
      },
      {
        "id": "filter_and_scrape",
        "type": "http_request_loop",
        "input_source": "$.steps.fetch_maps_data.output.local_results",
        "conditions": {
          "has_website": true
        },
        "action": {
          "method": "GET",
          "url": "{{item.website}}",
          "timeout_ms": 10000
        }
      },
      {
        "id": "llm_qualification",
        "type": "langchain_agent",
        "model": "gpt-4o",
        "temperature": 0.2,
        "prompt_template": "Analyze website content: {{steps.filter_and_scrape.output.body}}",
        "output_schema": {
          "type": "object",
          "properties": {
            "tier": {
              "type": "string",
              "enum": ["Tier 1", "Tier 2", "Tier 3"]
            },
            "pain_points": {
              "type": "array",
              "items": { "type": "string" }
            },
            "outreach_hook": { "type": "string" }
          },
          "required": ["tier", "pain_points", "outreach_hook"]
        }
      }
    ]
  }
}
```

---

## Error Handling, Proxies & Rate Limits

When running this workflow at scale, you will encounter real-world web scraping challenges. Implement these production-grade strategies to keep your pipeline running smoothly:

### 1. Handling Scraping Failures & Captchas
Many business websites use Cloudflare, AWS WAF, or CAPTCHAs to block automated traffic. 
* **Solution:** Replace the basic `requests.get` call in Step 2 with a headless browser library like **Playwright** combined with **Stealth** plugins.
* **Proxy Rotation:** Integrate a residential proxy network (e.g., Bright Data, Oxylabs, or Smartproxy) into your scraping client.

```python
# Example of configuring proxies with requests
proxies = {
    "http": "http://username:password@residential.proxyprovider.com:8000",
    "https": "http://username:password@residential.proxyprovider.com:8000",
}
response = requests.get(url, headers=headers, proxies=proxies, timeout=10)
```

### 2. LLM Rate Limiting & Token Management
If you process 100 websites concurrently, you will quickly hit OpenAI's TPM (Tokens Per Minute) and RPM (Requests Per Minute) limits.
* **Solution:** Implement exponential backoff using Python's `tenacity` library on your LangChain invocation steps.
* **Token Optimization:** Strip out unnecessary HTML boilerplate (SVGs, inline CSS, script blocks) before passing the text to the LLM. Use `tiktoken` to measure the token count and truncate the input to a maximum of 3,000–4,000 tokens.

```python
from tenacity import retry, stop_after_attempt, wait_random_exponential

@retry(wait=wait_random_exponential(min=1, max=60), stop=stop_after_attempt(6))
def qualify_lead_with_retry(lead_data: dict, website_text: str) -> LeadQualification:
    return qualify_lead(lead_data, website_text)
```

### 3. Handling Missing or Broken Websites
Not all businesses keep their domains active. If a website is down, do not fail the entire run. Catch the exception, log the failure, and pass a fallback string (e.g., `"No website content available"`) to the LLM. The agent can still qualify the lead based on Google Maps reviews and rating metadata alone, assigning it a lower tier if necessary.