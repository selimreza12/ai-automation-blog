import os
import sys
import time
import datetime
import warnings

warnings.filterwarnings("ignore")
os.environ["PYTHONWARNINGS"] = "ignore"

from google import genai
from google.genai import types

# Candidate free-tier models in priority order
CANDIDATE_MODELS = [
    "gemini-3.5-flash", "gemini-2.5-flash",
    "gemini-3.5-flash",
    "gemini-3.8-flash",
    "gemini-3.6-flash",
    "gemini-2.5-pro",
]

groq_key = os.environ.get("GROQ_API_KEY")
gemini_key = os.environ.get("GEMINI_API_KEY")

topic = sys.argv[1] if len(sys.argv) > 1 else "How to scrape Google Maps and qualify leads with LangChain"

def run_with_groq(topic_text, key):
    print("⚡ Using Groq Free Tier (Llama 3.3 70B)...")
    from crewai import Agent, Task, Crew, Process, LLM

    llm = LLM(
        model="groq/llama-3.3-70b-versatile",
        api_key=key,
        temperature=0.3
    )

    architect = Agent(
        role="Workflow Architect",
        goal=f"Design an automation architecture for: {topic_text}",
        backstory="Expert systems engineer designing workflows in LangChain, Make, and Zapier.",
        llm=llm,
        verbose=False
    )

    writer = Agent(
        role="Technical Content Engineer",
        goal="Produce a comprehensive markdown tutorial with YAML frontmatter.",
        backstory="Technical author who writes production-grade code walkthroughs.",
        llm=llm,
        verbose=False
    )

    spec_task = Task(
        description=f"Draft architecture steps, data inputs, and code configs for: {topic_text}.",
        expected_output="Technical blueprint and outline.",
        agent=architect
    )

    article_task = Task(
        description=f"""
Write a complete Markdown article based on the technical spec.
Format requirements:
- Must begin with frontmatter:
---
title: "[Under 60 chars title]"
excerpt: "[Under 150 chars summary]"
publishedAt: "{datetime.date.today().strftime('%Y-%m-%d')}"
category: "Data Scraping & Enrichment"
author: "AI Workflow Architect"
tags: ["LangChain", "Web Scraping", "Lead Generation"]
workflowTool: "LangChain"
featured: false
---

Include:
- Architecture Overview
- Step-by-Step implementation
- A valid JSON blueprint or Python snippet block
- Edge cases and rate limiting guidelines
""",
        expected_output="Full markdown article with frontmatter and code blocks.",
        agent=writer
    )

    crew = Crew(
        agents=[architect, writer],
        tasks=[spec_task, article_task],
        process=Process.sequential,
        verbose=False
    )

    return str(crew.kickoff()).strip()

def run_with_gemini(topic_text, key):
    client = genai.Client(api_key=key)
    prompt = f"""
Write a production-grade, highly engaging markdown tutorial for an AI automation blog on:
Topic: "{topic_text}"

You must strictly output clean Markdown starting with this YAML frontmatter:
---
title: "Scrape Google Maps & Qualify Leads with LangChain"
excerpt: "Automate local business lead extraction with LangChain agents and store qualified B2B prospects."
publishedAt: "{datetime.date.today().strftime('%Y-%m-%d')}"
category: "Data Scraping & Enrichment"
author: "AI Workflow Architect"
tags: ["LangChain", "Web Scraping", "Lead Generation", "Python"]
workflowTool: "LangChain"
featured: false
---

Follow immediately with:
## Architecture Overview
A concise breakdown of the input trigger, the scraping tool, the LLM scoring agent, and storage.

## Step 1: Setting Up the Environment & Dependencies
Provide actual Python code snippets importing langchain, langchain_openai, and pydantic.

## Step 2: Extracting Maps Data
Provide the Python scraper or API call logic.

## Step 3: Automated Lead Scoring with LLM Chains
Show how an LLM agent evaluates prospect websites to score lead intent (Tier 1, Tier 2, Tier 3).

## JSON Blueprint Configuration
Provide a sample JSON config block representing this workflow.

## Error Handling, Proxies & Rate Limits
Production tips to avoid getting blocked.
"""

    last_error = None
    for model_name in CANDIDATE_MODELS:
        print(f"🔄 Attempting generation with '{model_name}'...")
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=types.GenerateContentConfig(temperature=0.3)
            )
            if response.text:
                print(f"✨ Successfully generated with '{model_name}'!")
                return response.text.strip()
        except Exception as err:
            err_msg = str(err)
            if "503" in err_msg or "UNAVAILABLE" in err_msg:
                print(f"⏳ '{model_name}' is experiencing high demand (503). Trying alternate model...")
            elif "404" in err_msg:
                print(f"⏩ '{model_name}' not available on this endpoint. Skipping...")
            else:
                print(f"⚠️ Notice on '{model_name}': {err_msg[:90]}... Retrying next...")
            last_error = err
            time.sleep(1)

    raise Exception(f"All Gemini models exhausted. Last error: {last_error}")

# Main execution
content = None

if groq_key:
    try:
        content = run_with_groq(topic, groq_key)
    except Exception as e:
        print(f"⚠️ Groq generation failed: {e}")

if not content and gemini_key:
    try:
        content = run_with_gemini(topic, gemini_key)
    except Exception as e:
        print(f"❌ Gemini generation failed: {e}")
        sys.exit(1)

if not content:
    print("❌ Error: No working API key provided or generation failed.")
    print("Export GROQ_API_KEY or GEMINI_API_KEY and run again.")
    sys.exit(1)

# Save to content/blog/
clean_slug = (
    topic.lower()
    .replace(" ", "-")
    .replace(".", "")
    .replace(",", "")
    .replace("?", "")
    .replace(":", "")
    .replace("'", "")
)
file_path = f"content/blog/{clean_slug}.md"

os.makedirs("content/blog", exist_ok=True)
with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print(f"✅ Success! Article created at: {file_path}")
