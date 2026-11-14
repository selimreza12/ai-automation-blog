---
title: "How to automate client onboarding using Make.com and Notion"
excerpt: "A complete step-by-step technical guide to automating workflows with AI and modern APIs."
publishedAt: "2026-11-14"
category: "Agency Automation"
author: "Md. Selim Reza"
tags: ["Automation", "Make.com", "AI Workflows"]
workflowTool: "Make.com"
featured: false
---

Manual client onboarding is one of the biggest friction points for growing agencies and SaaS operations. Collecting client requirements, drafting tailored scope summaries, creating CRM database entries, and setting up workspace pages manually can take anywhere from 45 minutes to 2 hours per client.

By combining **Make.com**, **OpenAI**, and **Notion**, you can reduce this entire sequence down to a **15-second fully automated background execution**. 

In this tutorial, you will build an end-to-end, production-grade automated onboarding pipeline that accepts intake form data, processes unstructured project details with AI, creates formatted workspace pages in Notion, and notifies your team instantly.

---

## Architecture Overview

The automation architecture follows an event-driven design pattern built for high throughput and zero data loss.

```
[ Client Form Submission ]
           │
           ▼
[ 1. Webhook Trigger / Payload Ingestion ]
           │
           ▼
[ Data Validation & Sanitization ]
           │
           ▼
[ 2. AI Processing Module (OpenAI API) ]
   ├── Schema Enforcement (JSON Mode)
   └── Risk & Action-Item Extraction
           │
           ▼
[ 3. CRM Sync (Notion API) ]
   ├── Create Parent Client Database Item
   └── Append Structured Sub-tasks & Notes
           │
           ▼
[ 4. Dispatch Notification (Slack / Email) ]
```

### Flow Breakdown
1. **Input Trigger**: A custom webhook receives structured JSON data from your frontend intake form (Typeform, Tally, or custom web app).
2. **Validation Layer**: Make.com filters sanitize fields, check string patterns (email regex, non-null values), and route invalid payloads to a dead-letter log.
3. **AI Intelligence Engine**: OpenAI processes unstructured scope notes, generates executive summaries, predicts project risk factors, and extracts action items into a clean JSON output.
4. **Data Persistence**: Make's Notion module dynamically creates a new page inside your master **Clients Database**, updating status tags, contract values, and block contents.
5. **Dispatch & Notification**: Slack dispatches an interactive notification containing deep links to the new Notion page and summary key-performance indicators (KPIs).

---

## Step 1: Setting Up the Trigger & Payload

### 1. Configure the Webhook Trigger Module
1. Log into **Make.com** and create a new Scenario.
2. Add a **Custom Webhook** module (Webhooks app) as the initial trigger.
3. Name the webhook `Client Onboarding Intake - Production`.
4. Copy the generated Webhook URL.

### 2. Payload Structure Definition
Your intake form should transmit a clean POST request. Below is the expected JSON schema payload sent to the Webhook URL:

```json
{
  "client_name": "Acme Innovations",
  "contact_person": "Sarah Jenkins",
  "contact_email": "sarah@acmeinnovations.io",
  "plan_tier": "Enterprise Retainer",
  "contract_value": 12500,
  "kickoff_date": "2026-12-01",
  "raw_scope_notes": "We need a complete rebranding and modern web application built on Next.js. Key focus on sub-second load times and custom Stripe integration. Priority timeline is tight before Q1 launch."
}
```

### 3. Payload Validation and Filtering
Right after the Webhook module, set up a **Data Validation Router** or Filter in Make.com to prevent malformed requests from consuming API credits.

- **Filter Condition**: `contact_email` **Contains** `@` **AND** `client_name` **Exists**.
- **Fallback**: If the validation fails, route the payload to a logging error branch (e.g., send a alert to a Slack `#dev-alerts` channel).

---

## Step 2: Processing Data with AI

To convert unstructured `raw_scope_notes` into structured task items and actionable insights, integrate an OpenAI **Create a Completion** module utilizing `gpt-4o`.

### System Prompt & Prompt Chaining
Configure the module settings:
- **Model**: `gpt-4o`
- **Response Format**: `JSON Object`

#### System Prompt
```text
You are an expert agency operations manager and project risk analyst. 
Your job is to analyze incoming client scope raw text and output a structured JSON response containing:
1. An executive summary (max 3 sentences).
2. Key project objectives (array of strings).
3. Potential technical risk factors (array of strings).
4. Immediate onboarding action items for the team (array of strings).

Strictly output valid JSON matching the schema provided by the user prompt.
```

#### User Prompt
```text
Analyze the following client submission details:
Client Name: {{1.client_name}}
Plan Tier: {{1.plan_tier}}
Raw Scope Notes: {{1.raw_scope_notes}}

Respond in the following JSON format:
{
  "executive_summary": "string",
  "key_objectives": ["string"],
  "risk_factors": ["string"],
  "onboarding_tasks": ["string"]
}
```

### Parse JSON Response
Add a **Parse JSON** module in Make.com right after OpenAI to parse the raw string output returned by the model (`1.choices[].message.content`), mapping it directly into usable variable tokens for the Notion module.

---

## Step 3: Dispatch & CRM Sync

### 1. Notion Database Mapping
Add the **Notion -> Create a Database Item** module. Select your target **Clients Master Database**.

Map the payload and AI variables to the Notion properties:

| Notion Database Property | Type | Value / Mapping |
| :--- | :--- | :--- |
| **Client Name** | Title | `{{1.client_name}}` |
| **Status** | Select | `Onboarding Pending` |
| **Contact Email** | Email | `{{1.contact_email}}` |
| **Contract Value** | Number | `{{1.contract_value}}` |
| **Kickoff Date** | Date | `{{1.kickoff_date}}` |
| **Executive Summary** | Text | `{{3.executive_summary}}` |

### 2. Dynamic Page Content Generation
Use the **Notion -> Append Page Content** module to inject rich formatted blocks into the newly created page.

Add the following block structures:
- **Heading 2**: `Project Objectives`
- **Bullet Items**: Iterate through `{{3.key_objectives}}` using Make's `map()` or an Array Iterator module.
- **Heading 2**: `Onboarding Action Items`
- **To-Do Items**: Iterate through `{{3.onboarding_tasks}}`.

```json
[
  {
    "object": "block",
    "type": "heading_2",
    "heading_2": {
      "rich_text": [{ "type": "text", "text": { "content": "AI-Generated Scope Analysis" } }]
    }
  },
  {
    "object": "block",
    "type": "callout",
    "callout": {
      "rich_text": [{ "type": "text", "text": { "content": "{{3.executive_summary}}" } }],
      "icon": { "emoji": "🤖" }
    }
  }
]
```

### 3. Dispatch Team Slack Notification
Add a **Slack -> Create a Message** module targeting your agency `#client-onboarding` channel.

#### Message Payload Markdown
```markdown
🚨 **New Client Onboarded: {{1.client_name}}**
• **Tier:** {{1.plan_tier}}
• **Contract Value:** ${{1.contract_value}}
• **Contact:** {{1.contact_person}} ({{1.contact_email}})

📝 **Executive Summary:**
_{{3.executive_summary}}_

🔗 <{{4.url}}|Open Notion Workspace Page>
```

---

## JSON Blueprint Configuration

Below is the standard Make.com JSON blueprint structure for this scenario pipeline. You can import this definition into your Make.com workspace:

```json
{
  "name": "Automated Client Onboarding Pipeline",
  "modules": [
    {
      "id": 1,
      "module": "gateway:CustomWebhook",
      "version": 1,
      "parameters": {
        "hook": 123456,
        "maxResults": 1
      }
    },
    {
      "id": 2,
      "module": "openai-gpt3:createChatCompletion",
      "version": 1,
      "parameters": {
        "model": "gpt-4o",
        "response_format": { "type": "json_object" },
        "messages": [
          {
            "role": "system",
            "content": "You are an AI assistant parsing agency scope notes into structured JSON."
          },
          {
            "role": "user",
            "content": "Client: {{1.client_name}}\nNotes: {{1.raw_scope_notes}}"
          }
        ]
      }
    },
    {
      "id": 3,
      "module": "json:ParseJSON",
      "version": 1,
      "parameters": {
        "json": "{{2.choices[1].message.content}}"
      }
    },
    {
      "id": 4,
      "module": "notion:createADatabaseItem",
      "version": 2,
      "parameters": {
        "databaseId": "060d4b99-3171-4a11-8ff8-e123456789ab",
        "properties": {
          "Name": { "title": [{ "text": { "content": "{{1.client_name}}" } }] },
          "Status": { "select": { "name": "Onboarding Pending" } },
          "Email": { "email": "{{1.contact_email}}" }
        }
      }
    },
    {
      "id": 5,
      "module": "slack:createAMessage",
      "version": 1,
      "parameters": {
        "channelType": "public",
        "channelId": "C0123456789",
        "text": "New client onboarded: {{1.client_name}}. Notion URL: {{4.url}}"
      }
    }
  ],
  "connections": [
    { "from": 1, "to": 2 },
    { "from": 2, "to": 3 },
    { "from": 3, "to": 4 },
    { "from": 4, "to": 5 }
  ]
}
```

---

## Error Handling & Production Guidelines

### 1. Rate Limiting Constraints
- **Notion API**: Standard Notion integration limits requests to **3 requests per second**. Use Make's **Rate Limit** setting or add a **Sleep module (1000ms)** if updating multiple child blocks sequentially.
- **OpenAI API**: Monitor your Tier rate limits (TPM/RPM). Ensure exponential backoff strategy is enabled under module advanced settings.

### 2. Make.com Directives for Production Reliability
Attach error directives to critical modules:
- **Break Directive**: Place a `Break` directives on the Notion and OpenAI modules. If an API experiences a `502 Bad Gateway` or `429 Rate Limit`, Make will store the execution in the incomplete executions queue and attempt automatically scheduled retries with exponential backoff.
- **Fallback / Catch Directive**: If OpenAI returns malformed JSON, use a `Resume` directive with a static fallback JSON object so the database item is still generated without crashing the scenario.

```
[ Module: OpenAI ] ──── (On Error) ───► [ Directive: Resume ] 
                                             └─ Fallback Payload
```

### 3. Webhook Authentication Guidelines
Always append a secret query parameter or header signature validation token to your incoming webhook endpoint (e.g., `https://hook.make.com/xyz?token=YOUR_SECURE_HASH`). Use a Make filter immediately following the webhook to verify that `token == YOUR_SECURE_HASH` before proceeding to execution.