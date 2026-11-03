---
title: "How to automate client onboarding using Make.com and Notion"
excerpt: "A complete step-by-step technical guide to automating workflows with AI and modern APIs."
publishedAt: "2026-11-03"
category: "Agency Automation"
author: "Md. Selim Reza"
tags: ["Automation", "Make.com", "AI Workflows"]
workflowTool: "Make.com"
featured: false
---

## Architecture Overview

Scaling an agency requires eliminating friction in your operational handoffs. When a new client signs, manual data entry between your payment gateway, CRM, project management tool, and communication channels wastes valuable hours and introduces human error. 

This production-grade tutorial walks you through building an elite, resilient client onboarding pipeline using **Make.com** as the orchestration engine, **Notion** as the central relational database, and an **AI module** to intelligently parse and structure unstructured intake data.

```
[ Webhook / Typeform / Stripe ] 
       │
       ▼ (JSON Payload)
[ Make.com Router & Validation ]
       │
       ▼ (Raw Intake Data)
[ OpenAI / Claude AI (Data Normalization & Summarization) ]
       │
       ▼ (Structured Schema)
[ Notion Database (Create Client Record & Tasks) ]
       │
       ├────────────────────────┐
       ▼                        ▼
[ Slack Channel Creation ]  [ Automated Welcome Email (Gmail/Resend) ]
```

### The Pipeline Breakdown
1. **Input Trigger:** A webhook captures incoming data the moment a contract is signed or a checkout form is completed (e.g., Typeform, Stripe, Tally).
2. **Validation & Filtering:** A Make.com router checks for payload integrity, ensuring required fields (email, company name, project scope) are present before execution.
3. **AI Processing:** An LLM module cleans, categorizes, and summarizes the client's messy free-text input into an actionable, standardized JSON object.
4. **Data Storage & Sync:** Notion acts as the single source of truth, automatically provisioning a dedicated client profile database entry along with a tailored set of onboarding sub-tasks.
5. **Automated Dispatch:** A customized welcome email is dispatched via Gmail/Resend, and an internal alert fires off to a private Slack channel.

---

## Step 1: Setting Up the Trigger & Payload

To start, you need a reliable entry point that fires data into Make.com. For this tutorial, we will use a **Custom Webhook** in Make.com connected to your intake form or checkout provider.

### 1. Create the Make.com Scenario
1. Log into your Make.com account and create a new scenario.
2. Add a **Webhooks > Custom Webhook** module as your first step.
3. Click **Add**, name your webhook (e.g., *Agency Client Onboarding*), and copy the generated URL.
4. Send a test payload to this URL using Postman, cURL, or your form builder. 

### Example Test Payload (`application/json`)
```json
{
  "client_name": "Jane Doe",
  "company_name": "Acme Corp",
  "client_email": "jane@acmecorp.com",
  "tier": "Enterprise",
  "raw_project_goals": "We need an overhaul of our SEO strategy and custom dashboard integrations built within 4 weeks. Budget is flexible, priority is speed."
}
```

5. Once Make.com successfully determines the data structure from your test payload, click **OK** and move to the data transformation phase.

---

## Step 2: Processing Data with AI

Clients rarely write structured data. Free-text inputs like `raw_project_goals` need to be synthesized into concrete tags, estimated timelines, and internal team summaries. We will use the **OpenAI (Create a Prompt)** or **OpenAI (Create a Chat Completion)** module.

### 1. Configure the OpenAI Module
* **Connection:** Select your OpenAI API connection.
* **Model:** `gpt-4o` (recommended for low latency and high accuracy).
* **Messages:** Set up your system and user prompts to enforce a strict JSON output.

#### System Prompt
```text
You are an expert agency operations assistant. Your job is to analyze raw client intake notes, extract actionable data points, and output strictly valid JSON matching the requested schema. Do not include markdown formatting like ```json in your response, just output the raw JSON string.
```

#### User Prompt
```text
Analyze the following client intake form and extract these exact fields:
- "sentiment": A string evaluation of client tone ("High Priority", "Standard", "Complex")
- "estimated_weeks": Integer representing likely project duration based on scope text
- "core_deliverables": Array of strings summarizing clear deliverables
- "internal_summary": A 2-sentence briefing for the account manager

Client Name: {{1.client_name}}
Company: {{1.company_name}}
Tier: {{1.tier}}
Raw Notes: {{1.raw_project_goals}}
```

### 2. Parse AI Response
Add a **JSON > Parse JSON** module immediately after the OpenAI step. Map the `Choices[1].Message.Content` from the OpenAI module into the JSON parser so downstream modules can access variables like `{{3.sentiment}}` natively.

---

## Step 3: Dispatch & CRM Sync

Now that your data is pristine, structured, and validated, it’s time to update Notion and alert your internal team.

### 1. Create the Notion Record
Add a **Notion > Create a Database Item** module. 
* Connect your Notion workspace and select your master **Clients Database**.
* Map your variables to the corresponding Notion properties:
  * **Name (Title):** `{{1.company_name}} - {{1.client_name}}`
  * **Email (Email):** `{{1.client_email}}`
  * **Tier (Select):** `{{1.tier}}`
  * **Project Status (Status):** `Onboarding`
  * **AI Summary (Text/Rich Text):** `{{3.internal_summary}}`
  * **Estimated Timeline (Number):** `{{3.estimated_weeks}}`

### 2. Fan-Out Notifications
Branch your execution path using a **Router** to execute these actions simultaneously:
* **Email Module (Gmail / Resend):** Send a personalized onboarding welcome sequence to `{{1.client_email}}`.
* **Slack Module:** Send a rich Block Kit notification to your `#client-wins` channel alerting your team of the new enterprise contract, complete with direct links to the newly created Notion client page.

---

## JSON Blueprint Configuration

Import this schema directly into Make.com to bootstrap your scenario structure instantly. 

```json
{
  "name": "Production-Grade Client Onboarding",
  "flow": [
    {
      "id": 1,
      "module": "gateway:CustomWebHook",
      "version": 1,
      "parameters": {},
      "mapper": {},
      "metadata": {
        "designer": { "x": 0, "y": 0 }
      }
    },
    {
      "id": 2,
      "module": "openai-m:createChatCompletion",
      "version": 1,
      "parameters": {
        "model": "gpt-4o"
      },
      "mapper": {
        "messages": [
          {
            "role": "system",
            "content": "You analyze client intake notes and output strict JSON."
          },
          {
            "role": "user",
            "content": "Extract deliverables for {{1.client_name}} at {{1.company_name}}."
          }
        ]
      },
      "metadata": {
        "designer": { "x": 300, "y": 0 }
      }
    },
    {
      "id": 3,
      "module": "json:ParseJSON",
      "version": 1,
      "parameters": {},
      "mapper": {
        "json": "{{2.choices[].message.content}}"
      },
      "metadata": {
        "designer": { "x": 600, "y": 0 }
      }
    },
    {
      "id": 4,
      "module": "notion:createDatabaseItem",
      "version": 2,
      "parameters": {
        "databaseId": "YOUR_NOTION_DATABASE_ID"
      },
      "mapper": {
        "title": "{{1.company_name}}",
        "properties": {
          "Email": "{{1.client_email}}",
          "Tier": "{{1.tier}}"
        }
      },
      "metadata": {
        "designer": { "x": 900, "y": 0 }
      }
    }
  ],
  "metadata": {
    "instant": true,
    "version": 1
  }
}
```

---

## Error Handling & Production Guidelines

When handling mission-critical business processes like client onboarding, failure is not an option. Implement these architectural best practices to ensure 99.9% pipeline uptime:

1. **Rate Limiting & Token Exhaustion (OpenAI):** 
   Always implement a **Directive Error Handler** on your OpenAI module. If OpenAI throws a `429 Too Many Requests` or `503 Service Unavailable`, attach a **Sleep** module set to retry after 15 seconds, wrapped in a 3-attempt fallback loop.
2. **Notion API Throttling:** 
   Notion enforces strict rate limits (roughly 3 requests per second on average). If you are batch-creating relational items (e.g., seeding 10 default onboarding tasks per client), insert a **Sleep** module with a 500ms delay between API calls to prevent `429` errors.
3. **Data Validation Gates:** 
   Never trust upstream payloads. Use Make.com’s built-in **Filter** feature directly after your webhook to verify that `client_email` contains an `@` symbol and that `company_name` is not empty. Drop malformed payloads into an error-logging data store for manual review.
4. **Dead Letter Queue (DLQ):** 
   Set up a fallback route on your global scenario error handler. If any module fails completely after retries, route the raw input payload into a dedicated "Failed Onboarding" Google Sheet or send an emergency alert via webhook to your engineering PagerDuty/Slack channel.