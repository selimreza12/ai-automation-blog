---
title: "How to automate client onboarding using Make.com and Notio"
excerpt: "A complete step-by-step technical guide to automating workflows with AI and modern APIs."
publishedAt: "2026-11-13"
category: "Agency Automation"
author: "Md. Selim Reza"
tags: ["Automation", "Make.com", "AI Workflows"]
workflowTool: "Make.com"
featured: false
---

## Architecture Overview

Manual onboarding introduces friction, delays time-to-value, and increases operational overhead for agency and SaaS teams. By constructing an event-driven, AI-augmented onboarding pipeline, you can process incoming client intake forms in under 30 seconds while maintaining high personalization and systematic tracking.

```
[ Form / Webhook Input ]
         │
         ▼
[ Make.com Webhook Listener ]
         │
         ▼
[ JSON Validation & Sanitization ]
         │
         ▼
[ OpenAI GPT-4o (Analysis & Extraction) ]
         │
         ▼
[ Notion API (Database Item & Project Page) ]
         │
         ▼
[ Slack / Email Notification Dispatch ]
```

### Flow Breakdown

1. **Input Trigger**: A custom HTTPS POST webhook receives a JSON payload from an intake form (e.g., Typeform, Tally, or a custom frontend).
2. **Validation & Sanitization**: The payload is validated for required fields (`client_name`, `contact_email`, `project_scope`) and normalized for down-stream processing.
3. **AI Processing**: An LLM (OpenAI GPT-4o) evaluates the intake form text to extract structured intelligence: key deliverables, risk rating, suggested tech stack, and a multi-phase project milestone timeline.
4. **Data Storage & Sync**: The system creates a centralized client page in Notion, auto-populating metadata properties (Select, Date, Rich Text) and inserting AI-generated kickoff blueprints directly into the page content body.
5. **Dispatch & Notifications**: A Slack Block Kit notification alerts account managers with an immediate execution summary and a direct deep link to the newly minted Notion workspace.

---

## Step 1: Setting Up the Trigger & Payload

The onboarding engine relies on a standard HTTP POST request. We start by configuring Make.com's **Custom Webhook** module to act as an idempotent listener.

### 1. Configure the Webhook Listener

1. In Make.com, create a new Scenario and add a **Webhooks -> Custom Webhook** module.
2. Click **Add** and set the Webhook name to `Client Onboarding Intake Receiver`.
3. Copy the generated IP/URL (e.g., `https://hook.make.com/your-unique-token`).

### 2. Define the Incoming JSON Payload

The intake payload must supply key metadata. Below is the production JSON schema expected by the endpoint:

```json
{
  "client_name": "Acme Corp",
  "contact_person": "Jane Doe",
  "contact_email": "jane@acmecorp.com",
  "company_website": "https://acmecorp.com",
  "budget_tier": "$10,000 - $25,000",
  "target_launch_date": "2026-12-01",
  "project_scope": "We need an end-to-end rebranding and modern web application development built with Next.js and Supabase. Key integrations include Stripe payments and HubSpot CRM sync. High priority on performance and SEO."
}
```

### 3. Data Validation Module Setup

Directly after the custom webhook, add a **Tools -> Data Parser** or basic Make.com **Filter** to ensure zero-value payloads are rejected before consuming API units.

* **Filter Rule**: `contact_email` *Exists* AND `project_scope` *Is not empty*.
* **Fallback Strategy**: If validation fails, route the module to an instant `HTTP - 400 Bad Request` response module with an explicit JSON error payload.

---

## Step 2: Processing Data with AI

Raw project scope descriptions are often unstructured. We route this data to an LLM module using **OpenAI (Create a Response / Chat Completion)** with standard JSON mode or function calling to ensure structural integrity.

### Model Configuration

* **Model**: `gpt-4o`
* **Temperature**: `0.2` (Low variance to produce structured outputs reliably)
* **Response Format**: `json_object`

### Prompt Architecture

#### System Prompt
```text
You are an expert agency operations manager and technical architect. 
Your task is to analyze raw client intake data and transform it into a structured, highly actionable client profile.

Output strict JSON matching the following schema:
{
  "summary": "String (2-3 sentences summarising the project objectives)",
  "risk_rating": "String (Low | Medium | High)",
  "risk_factors": ["Array of strings describing potential delivery risks"],
  "recommended_stack": ["Array of technologies"],
  "deliverables": ["Array of strategic milestones"],
  "initial_kickoff_agenda": ["Array of agenda items for the first meeting"]
}
```

#### User Prompt
```text
Analyze the following client intake data:

Client Name: {{1.client_name}}
Website: {{1.company_website}}
Budget Tier: {{1.budget_tier}}
Target Launch Date: {{1.target_launch_date}}
Raw Scope Description: {{1.project_scope}}
```

### Output Example Parsing

The OpenAI module returns a structured JSON payload ready for direct mapping in Make.com:

```json
{
  "summary": "Acme Corp requires a comprehensive rebranding and high-performance web platform built on Next.js and Supabase, featuring native Stripe and HubSpot integrations.",
  "risk_rating": "Medium",
  "risk_factors": [
    "Tight launch date relative to double integration scope (Stripe + HubSpot).",
    "Requires alignment between brand design and modern component engineering."
  ],
  "recommended_stack": ["Next.js", "Supabase", "Stripe API", "HubSpot API", "Tailwind CSS"],
  "deliverables": [
    "Brand Identity & UI Kit Design",
    "Database Schema & Supabase Backend Setup",
    "Next.js Frontend Architecture Implementation",
    "Third-Party API Integration (Stripe & HubSpot)",
    "QA, Performance Optimization & SEO Audit"
  ],
  "initial_kickoff_agenda": [
    "Review brand identity parameters and design constraints",
    "Finalize API authentication and data mapping logic for HubSpot",
    "Confirm milestone timeline and design review sign-off steps"
  ]
}
```

---

## Step 3: Dispatch & CRM Sync

With structured data in hand, Make.com provisions the project environment in **Notion** and dispatches alerts to **Slack**.

### 1. Notion API Integration

Add the **Notion -> Create a Database Item** module.

* **Database ID**: Connect your target `Client CRM` or `Projects` Notion database.
* **Property Mapping**:

| Notion Field Name | Field Type | Dynamic Value (Make.com Mapping) |
| :--- | :--- | :--- |
| **Project Name** | Title | `{{1.client_name}} - Onboarding` |
| **Contact Email** | Email | `{{1.contact_email}}` |
| **Status** | Select | `Onboarding` |
| **Risk Rating** | Select | `{{2.json.risk_rating}}` |
| **Budget Tier** | Select | `{{1.budget_tier}}` |
| **Target Launch** | Date | `{{1.target_launch_date}}` |

#### Adding Rich Page Content Body
Under the Notion module's **Page Content** section, inject dynamic Notion Blocks using standard structural mappings:

```markdown
## Executive Summary
{{2.json.summary}}

## Deliverables & Milestones
{{#each 2.json.deliverables}}
- {{this}}
{{/each}}

## Identified Risk Factors
{{#each 2.json.risk_factors}}
- ⚠️ {{this}}
{{/each}}

## Initial Kickoff Agenda
{{#each 2.json.initial_kickoff_agenda}}
1. {{this}}
{{/each}}
```

### 2. Team Dispatch via Slack

Add a **Slack -> Create a Message** module using `chat.postMessage` with Slack Block Kit formatting.

```json
{
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "🚀 New Client Onboarded: {{1.client_name}}"
      }
    },
    {
      "type": "section",
      "fields": [
        {
          "type": "mrkdwn",
          "text": "*Contact:* {{1.contact_person}} ({{1.contact_email}})"
        },
        {
          "type": "mrkdwn",
          "text": "*Risk Rating:* {{2.json.risk_rating}}"
        }
      ]
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Summary:* {{2.json.summary}}"
      }
    },
    {
      "type": "actions",
      "elements": [
        {
          "type": "button",
          "text": {
            "type": "plain_text",
            "text": "Open Notion Page"
          },
          "url": "{{3.url}}"
        }
      ]
    }
  ]
}
```

---

## JSON Blueprint Configuration

Below is a valid Make.com scenario blueprint structure. You can import this directly into Make.com via **Scenarios -> Import Blueprint**.

```json
{
  "name": "Automated Client Onboarding Engine",
  "version": 1,
  "scenario": {
    "substeps": [],
    "modules": [
      {
        "id": 1,
        "module": "gateway:CustomWebhook",
        "version": 1,
        "parameters": {
          "hook": 12345,
          "maxResults": 1
        },
        "mapper": {},
        "metadata": {
          "designer": {
            "x": 0,
            "y": 0
          }
        }
      },
      {
        "id": 2,
        "module": "openai-gpt3:createChatCompletion",
        "version": 1,
        "parameters": {
          "model": "gpt-4o",
          "temperature": 0.2,
          "response_format": { "type": "json_object" }
        },
        "mapper": {
          "messages": [
            {
              "role": "system",
              "content": "You are an expert agency operations manager. Output valid strict JSON matching schema: {summary: string, risk_rating: string, risk_factors: array, recommended_stack: array, deliverables: array, initial_kickoff_agenda: array}"
            },
            {
              "role": "user",
              "content": "Client: {{1.client_name}}\nScope: {{1.project_scope}}"
            }
          ]
        },
        "metadata": {
          "designer": {
            "x": 300,
            "y": 0
          }
        }
      },
      {
        "id": 3,
        "module": "notion:createADatabaseItem",
        "version": 2,
        "parameters": {
          "database_id": "your-notion-db-uuid"
        },
        "mapper": {
          "properties": {
            "Name": { "title": [{"text": {"content": "{{1.client_name}}"}}]},
            "Email": { "email": "{{1.contact_email}}" },
            "Risk Rating": { "select": { "name": "{{2.json.risk_rating}}" } }
          }
        },
        "metadata": {
          "designer": {
            "x": 600,
            "y": 0
          }
        }
      },
      {
        "id": 4,
        "module": "slack:createAMessage",
        "version": 1,
        "parameters": {
          "channelType": "public",
          "account": 1
        },
        "mapper": {
          "channel": "C012345678",
          "text": "New client onboarded: {{1.client_name}}. View page: {{3.url}}"
        },
        "metadata": {
          "designer": {
            "x": 900,
            "y": 0
          }
        }
      }
    ],
    "routes": []
  }
}
```

---

## Error Handling & Production Guidelines

To deploy this workflow reliably in a production setting, implement the following operational safeguards:

### 1. Handling API Rate Limits & Timeouts

* **OpenAI Rate Limits (429 / 503)**: Attach a **Break Error Handler** to the OpenAI module. Set execution retries to `3`, with an exponential backoff interval of `2, 4, 8` minutes.
* **Notion API Rate Limits**: The Notion API enforces a rate limit of **3 requests per second**. Enable standard queueing in Make scenario settings by setting **Sequential Processing** to `True`.

### 2. Edge Case Routing & Rollbacks

Add an explicit **Router** directly following the OpenAI module to evaluate response validity:

* **Fallback Route (Parsing Failure)**: If `{{2.json.summary}}` is empty (due to standard LLM parsing failure or safety flag triggers), route execution to a **Human-in-the-Loop** Slack channel with raw webhook details.
* **Data Sanitization**: Sanitize all incoming intake data strings to prevent prompt injection vectors (e.g., stripping deliberate instruction overrides from input strings like `"Ignore all previous instructions..."`).

### 3. Data Privacy and Compliance

* Ensure **PII (Personally Identifiable Information)** processed by the OpenAI API is executed under enterprise agreements where data input is **not used for model training**.
* Use explicit field mapping instead of passing raw key-value objects down the chain to prevent leaking internal operational data into third-party notifications.