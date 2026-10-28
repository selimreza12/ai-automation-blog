---
title: "How to automate client onboarding using Make.com and Notion"
excerpt: "A complete step-by-step technical guide to automating workflows with AI and modern APIs."
publishedAt: "2026-10-28"
category: "Agency Automation"
author: "Md. Selim Reza"
tags: ["Automation", "Make.com", "AI Workflows"]
workflowTool: "Make.com"
featured: false
---

## Architecture Overview

Scaling an agency or freelance business requires eliminating manual overhead. Client onboarding is the prime candidate for automation: it is repetitive, data-heavy, and sets the critical first impression for your new clients. 

This production-grade tutorial details how to build an end-to-end, resilient client onboarding engine using **Make.com**, **Notion**, and **OpenAI**. 

```
[ Webhook Trigger (Typeform/Tally) ]
               │
               ▼
   [ Data Validation & Filtering ]
               │
               ▼
     [ OpenAI (Data Enrichment) ]
               │
               ▼
[ Notion Database (Client Workspace Sync) ]
               │
               ▼
  [ Gmail / Slack (Instant Notifications) ]
```

1. **Input Trigger:** A webhook captures raw form submissions (e.g., Tally, Typeform, or Webflow) when a client signs a contract or fills out an onboarding questionnaire.
2. **Validation & Filtering:** Make.com filters out spam payloads and normalizes incoming data strings (e.g., lowercasing emails, formatting phone numbers).
3. **Data Storage & Processing:** OpenAI analyzes the client’s project goals and categorizes them, while Notion automatically generates a bespoke client portal database and project roadmap.
4. **Automated Notifications:** Slack channels are alerted internally, and a personalized welcome email containing access links goes out to the client instantly.

---

## Step 1: Setting Up the Trigger & Payload

The foundation of a reliable automation is a clean, structured payload. We will use a Webhook as our trigger point.

### Webhook Configuration
1. In Make.com, create a new scenario and add a **Webhooks > Custom Webhook** module.
2. Copy the generated webhook URL and paste it into your form builder’s integration settings (e.g., Tally.so or Typeform).
3. Send a test submission containing the following fields to initialize the data structure:
   - `client_name` (String)
   - `company_email` (Email)
   - `company_name` (String)
   - `project_scope` (Long Text)
   - `budget_tier` (Dropdown: Starter, Growth, Enterprise)

```json
{
  "client_name": "Jane Doe",
  "company_email": "jane@acmecorp.com",
  "company_name": "Acme Corp",
  "project_scope": "We need a complete brand redesign and automated marketing pipeline.",
  "budget_tier": "Growth"
}
```

### Data Normalization Router
Add a **Data Sanitizer** or a **Set Multiple Variables** module right after the webhook to strip whitespace and normalize casing:
* `email`: `{{lower(1.company_email)}}`
* `cleaned_name`: `{{title(1.client_name)}}`

---

## Step 2: Processing Data with AI

To make your onboarding truly intelligent, pass the raw `project_scope` through an OpenAI module to automatically extract key deliverables, estimate complexity, and draft an initial internal brief.

### OpenAI API Module Setup
1. Add an **OpenAI > Create a Completion** (or Chat Completions) module.
2. Select your model (e.g., `gpt-4o-mini` for speed and cost-efficiency).
3. Use the following production-ready system and user prompt structure:

**System Prompt:**
```text
You are an expert agency operations manager. Analyze the incoming client project scope and output a strict JSON object with three keys: 
1. "summary" (A 2-sentence summary of the core objective), 
2. "key_deliverables" (An array of 3 actionable milestone tasks), and 
3. "risk_level" (Low, Medium, or High based on scope clarity).
Do not output markdown code blocks in the response, just raw JSON.
```

**User Prompt:**
```text
Client: {{1.company_name}}
Budget: {{1.budget_tier}}
Scope: {{1.project_scope}}
```

Use a **JSON Parser** module immediately following the OpenAI module to map the stringified AI output into usable variables for downstream systems.

---

## Step 3: Dispatch & CRM Sync

With the data validated and enriched by AI, we now push the information into Notion and dispatch notifications.

### 1. Notion Database Synchronization
Add a **Notion > Create a Database Item** module. 
* Connect it to your master **Client Hub** database.
* Map your variables to the corresponding Notion property types:
  * **Name (Title):** `{{1.company_name}} - {{1.client_name}}`
  * **Email (Email):** `{{1.company_email}}`
  * **Status (Select):** `Onboarding`
  * **Budget Tier (Select):** `{{1.budget_tier}}`
  * **AI Brief (Rich Text):** `{{AI_Parser.summary}}`
  * **Risk Level (Status):** `{{AI_Parser.risk_level}}`

### 2. Internal Slack Notification
Add a **Slack > Create a Message** module to alert your delivery team:
```text
🚀 *New Client Onboarded!*
*Company:* {{1.company_name}}
*Contact:* {{1.client_name}} ({{1.company_email}})
*Budget Tier:* {{1.budget_tier}}
*AI Risk Assessment:* `{{AI_Parser.risk_level}}`
*Notion Workspace:* <{{Notion.url}}|View Client Hub>
```

---

## JSON Blueprint Configuration

Import this schema directly into Make.com via **"Import Blueprint"** to initialize the basic framework of this automation scenario.

```json
{
  "name": "Client Onboarding Automation",
  "flow": [
    {
      "id": 1,
      "module": "webhooks:CustomWebHook",
      "version": 1,
      "parameters": {},
      "options": {
        "url": "https://hook.eu1.make.com/your-unique-webhook-hash"
      },
      "mapper": {},
      "metadata": {
        "designer": { "x": 0, "y": 0 }
      }
    },
    {
      "id": 2,
      "module": "openai:CreateACompletion",
      "version": 1,
      "parameters": {
        "model": "gpt-4o-mini"
      },
      "mapper": {
        "messages": [
          {
            "role": "system",
            "content": "Analyze the scope and return a JSON summary."
          },
          {
            "role": "user",
            "content": "{{1.project_scope}}"
          }
        ]
      },
      "metadata": {
        "designer": { "x": 300, "y": 0 }
      }
    },
    {
      "id": 3,
      "module": "notion:createDatabaseItem",
      "version": 1,
      "parameters": {},
      "mapper": {
        "databaseId": "your_notion_database_id_here",
        "properties": {
          "Name": "{{1.company_name}}"
        }
      },
      "metadata": {
        "designer": { "x": 600, "y": 0 }
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

When deploying this workflow to production, you must account for API rate limits, downtime, and malformed inputs.

1. **Implement Direct Error Branching:**
   * Right-click your Notion and OpenAI modules and select **Add error handler**.
   * Attach an **Email / Send an Email** module to notify your admin team (`admin@youragency.com`) whenever an API timeout or schema validation failure occurs.
2. **Handle Rate Limiting (HTTP 429):**
   * OpenAI and Notion APIs enforce strict rate limits. Add a **Sleep** module with a 2-second delay if you are processing high volumes of batch client applications.
   * Configure automatic retries on critical modules (set attempts to `3` with a `10-second` interval inside module settings).
3. **Data Security & GDPR Compliance:**
   * Ensure your OpenAI enterprise settings have **Data Privacy mode** enabled so client project data is never used to train foundational models.
   * Purge raw webhook logs in Make.com after 30 days if handling PII (Personally Identifiable Information) under strict regulatory frameworks.