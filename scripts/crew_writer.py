import os
import sys
import time
import datetime
import warnings

warnings.filterwarnings("ignore")
os.environ["PYTHONWARNINGS"] = "ignore"

from google import genai
from google.genai import types

# Prioritize the verified, working models from your API account
CANDIDATE_MODELS = [
    "gemini-flash-lite-latest",
    "gemini-flash-latest",
    "gemini-2.5-flash",
    "gemini-3.5-flash",
]

groq_key = os.environ.get("GROQ_API_KEY")
gemini_key = os.environ.get("GEMINI_API_KEY")

topic = sys.argv[1] if len(sys.argv) > 1 else "How to automate client onboarding using Make.com and Notion"

def generate_article_prompt(topic_text):
    return f"""
Write a production-grade, highly engaging markdown tutorial for an AI automation blog on:
Topic: "{topic_text}"

You must strictly output clean Markdown starting with this YAML frontmatter:
---
title: "{topic_text[:58]}"
excerpt: "A complete step-by-step technical guide to automating workflows with AI and modern APIs."
publishedAt: "{datetime.date.today().strftime('%Y-%m-%d')}"
category: "Agency Automation"
author: "Md. Selim Reza"
tags: ["Automation", "Make.com", "AI Workflows"]
workflowTool: "Make.com"
featured: false
---

Follow immediately with:
## Architecture Overview
A concise breakdown of the input trigger, the validation steps, data storage, and automated notifications.

## Step 1: Setting Up the Trigger & Payload
Explain inputs and setup.

## Step 2: Processing Data with AI
Explain prompt chains and structure.

## Step 3: Dispatch & CRM Sync
Explain synchronization and notification delivery.

## JSON Blueprint Configuration
Provide a sample JSON configuration block representing this workflow.

## Error Handling & Production Guidelines
Tips on rate limiting, retry logic, and edge cases.
"""

def run_with_gemini(topic_text, key):
    client = genai.Client(api_key=key)
    prompt = generate_article_prompt(topic_text)

    # 1. Primary Candidates with Quick Retry
    for model_name in CANDIDATE_MODELS:
        print(f"🔄 Attempting generation with '{model_name}'...")
        for attempt in range(1, 4):
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
                    wait_time = attempt * 3
                    print(f"⏳ '{model_name}' is busy (503). Waiting {wait_time}s...")
                    time.sleep(wait_time)
                else:
                    break

    # 2. Dynamic Model Discovery Fallback
    print("🔍 Probing API for any available generative models...")
    for m in client.models.list():
        m_name = m.name.replace("models/", "")
        if "flash" in m_name or "lite" in m_name:
            try:
                print(f"🧪 Testing: '{m_name}'...")
                response = client.models.generate_content(
                    model=m_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(temperature=0.3)
                )
                if response.text:
                    print(f"✨ Success with discovered model '{m_name}'!")
                    return response.text.strip()
            except Exception:
                continue

    raise Exception("All models exhausted.")

# Run generator
content = None

if groq_key:
    try:
        from crewai import Agent, Task, Crew, Process, LLM
        print("⚡ Using Groq Free Tier (Llama 3.3 70B)...")
        llm = LLM(model="groq/llama-3.3-70b-versatile", api_key=groq_key, temperature=0.3)
        architect = Agent(role="Workflow Architect", goal=f"Design {topic}", backstory="Expert engineer", llm=llm, verbose=False)
        writer = Agent(role="Writer", goal="Write tutorial", backstory="Tech writer", llm=llm, verbose=False)
        spec = Task(description=f"Blueprint for {topic}", expected_output="Tech spec", agent=architect)
        article = Task(description=generate_article_prompt(topic), expected_output="Markdown article", agent=writer)
        crew = Crew(agents=[architect, writer], tasks=[spec, article], process=Process.sequential)
        content = str(crew.kickoff()).strip()
    except Exception as e:
        print(f"Groq notice: {e}")

if not content and gemini_key:
    try:
        content = run_with_gemini(topic, gemini_key)
    except Exception as e:
        print(f"❌ Gemini failed: {e}")
        sys.exit(1)

if not content:
    print("❌ Error: No working API key provided.")
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
