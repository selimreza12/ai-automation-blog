import os
import sys
import time
import datetime
import warnings

warnings.filterwarnings("ignore")
os.environ["PYTHONWARNINGS"] = "ignore"

from google import genai
from google.genai import types

# Active and latest supported free-tier models in priority order
CANDIDATE_MODELS = [
    "gemini-3.5-flash",
    "gemini-3.6-flash",
    "gemini-3.1-pro-preview",
    "gemini-3.8-flash",
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
title: "Automate Client Onboarding with Make.com & Notion"
excerpt: "Learn how to build an autonomous client onboarding system with Make.com, Notion databases, and automated Slack invites."
publishedAt: "{datetime.date.today().strftime('%Y-%m-%d')}"
category: "Agency Automation"
author: "AI Workflow Architect"
tags: ["Make.com", "Notion", "Client Onboarding", "Automation"]
workflowTool: "Make.com"
featured: false
---

Follow immediately with:
## Architecture Overview
A concise breakdown of the input trigger, the validation steps, Notion workspace provisioning, and email dispatch.

## Step 1: Setting Up the Inbound Webhook
Explain payload attributes (client_name, email, plan_tier).

## Step 2: Creating Client Records in Notion
Explain database mapping and custom properties.

## Step 3: Automated Welcome Email & Resource Delivery
Explain how to send assets and invite links.

## JSON Blueprint Configuration
Provide a sample JSON configuration block representing this Make.com workflow.

## Error Handling & Exception Management
Production guidelines for handling failed webhooks or duplicate onboarding submissions.
"""

def run_with_gemini(topic_text, key):
    client = genai.Client(api_key=key)
    prompt = generate_article_prompt(topic_text)

    # 1. Try Primary Candidate Models with Exponential Backoff
    for model_name in CANDIDATE_MODELS:
        print(f"🔄 Attempting generation with '{model_name}'...")
        for attempt in range(1, 4):  # Up to 3 retries on temporary 503
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
                    wait_time = attempt * 4
                    print(f"⏳ '{model_name}' is experiencing high demand (503). Retrying in {wait_time}s (Attempt {attempt}/3)...")
                    time.sleep(wait_time)
                elif "404" in err_msg:
                    print(f"⏩ '{model_name}' not available. Moving to next candidate...")
                    break
                else:
                    print(f"⚠️ Notice on '{model_name}': {err_msg[:80]}...")
                    time.sleep(2)
                    break

    # 2. Dynamic Model Discovery Fallback
    print("🔍 Probing API for any available generative models...")
    try:
        for m in client.models.list():
            m_name = m.name.replace("models/", "")
            if "flash" in m_name or "pro" in m_name:
                try:
                    print(f"🧪 Testing dynamically discovered model: '{m_name}'...")
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
    except Exception as e:
        print(f"Could not list models: {e}")

    raise Exception("All Gemini models exhausted. Consider adding GROQ_API_KEY as a backup.")

# Run generator
content = None

if groq_key:
    try:
        from crewai import Agent, Task, Crew, Process, LLM
        print("⚡ Using Groq Free Tier (Llama 3.3 70B)...")
        llm = LLM(model="groq/llama-3.3-70b-versatile", api_key=groq_key, temperature=0.3)
        architect = Agent(role="Workflow Architect", goal=f"Design {topic}", backstory="Expert engineer", llm=llm, verbose=False)
        writer = Agent(role="Writer", goal="Write markdown tutorial with frontmatter", backstory="Tech writer", llm=llm, verbose=False)
        spec = Task(description=f"Blueprint for {topic}", expected_output="Tech spec", agent=architect)
        article = Task(description=generate_article_prompt(topic), expected_output="Markdown article", agent=writer)
        crew = Crew(agents=[architect, writer], tasks=[spec, article], process=Process.sequential)
        content = str(crew.kickoff()).strip()
    except Exception as e:
        print(f"Groq warning: {e}")

if not content and gemini_key:
    try:
        content = run_with_gemini(topic, gemini_key)
    except Exception as e:
        print(f"❌ Gemini generation failed: {e}")
        sys.exit(1)

if not content:
    print("❌ Error: No working API key provided or generation failed.")
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
