import os
import sys
import datetime
from google import genai
from google.genai import types

# 1. Initialize client
api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    print("❌ Error: GEMINI_API_KEY environment variable is not set.")
    sys.exit(1)

client = genai.Client(api_key=api_key)

TOPIC = sys.argv[1] if len(sys.argv) > 1 else "How to Automate Invoicing with Make.com and QuickBooks"

prompt = f"""
You are a senior workflow architect writing a production-grade tutorial for an AI automation blog.
Topic: {TOPIC}

Return your output in EXACTLY this format with markdown frontmatter:
---
title: "[Clean SEO optimized title under 65 chars]"
excerpt: "[Engaging meta description under 150 chars]"
publishedAt: "{datetime.date.today().strftime('%Y-%m-%d')}"
category: "Finance Automation"
author: "Workflow Architect"
tags: ["Make.com", "Accounting", "Automation"]
workflowTool: "Make.com"
featured: false
---

[Complete step-by-step guide with:
- Architecture Overview
- Step-by-step trigger and actions
- A small sample JSON config code block representing the workflow
- Pro tips and error handling strategies]
"""

print(f"⚡ Generating article for topic: '{TOPIC}'...")

response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents=prompt,
    config=types.GenerateContentConfig(
        temperature=0.2,
    )
)

slug = TOPIC.lower().replace(" ", "-").replace(".", "").replace(",", "")
file_name = f"content/blog/{slug}.md"

os.makedirs("content/blog", exist_ok=True)
with open(file_name, "w", encoding="utf-8") as f:
    f.write(response.text.strip())

print(f"✅ Success! Created article: {file_name}")