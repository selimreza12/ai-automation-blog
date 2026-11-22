---
title: "How to automate client onboarding using Make.com and Notio"
excerpt: "A complete step-by-step technical guide to automating workflows with AI and modern APIs."
publishedAt: "2026-11-22"
category: "Agency Automation"
author: "Md. Selim Reza"
tags: ["Automation", "Make.com", "AI Workflows"]
workflowTool: "Make.com"
featured: false
---

Manual client onboarding is one of the fastest ways to cap an agency's growth. When a new contract is signed, team members often spend hours creating CRM records, building client portals, drafting kickoff emails, and pinging internal Slack channels.

In this tutorial, we will build a **production-grade client onboarding engine** using **Make.com**, **Notion**, and **OpenAI (GPT-4o)**. This workflow automatically parses incoming form data, enriches client goals using AI, generates a structured workspace inside Notion, and alerts your team on Slack.

---

## Architecture Overview

The system operates as an event-driven automation pipeline designed for low latency, zero data loss, and strict error containment.

```
[ Form / Webhook ] 
       │
       ▼
[ Make.com Custom Webhook ]
       │
       ▼
[ JSON Schema Validation ]
       │
       ▼
[ OpenAI (GPT-4o) ] ─── Parses scope, generates deliverables & kickoff email
       │
       ▼
[ Notion API ] ──────── Creates Client Page, Projects, & Master Task List
       │
       ▼
[ Slack API ] ───────── Sends structured team alert with deep links
```

### Components Breakdown

1. **Input Trigger**: A custom HTTPS POST webhook listening for inbound data from a form provider (Typeform, Tally, or custom frontend).
2. **Validation Layer**: Filters missing required fields (e.g., empty email, invalid company name) to prevent corrupted database entries.
3. **AI Processing Module**: An OpenAI API call using Structured Outputs (`json_schema`) to turn raw text responses into actionable milestones, risk ratings, and customized kickoff copy.
4. **Data Storage & Workspace Generation**: Calls to the Notion API to create a root Client Page within a database, populated with project metadata and relation properties.
5. **Notification Dispatch**: Sends a Slack payload with actionable buttons and direct links to the newly created Notion workspace.

---

## Step 1: Setting Up the Trigger & Payload

We start by capturing raw onboarding questionnaire responses using Make.com’s **Custom Webhook** module.

### Expected JSON Payload

Set your form builder or web app to send a `POST` request to your Make.com Webhook URL with the following JSON schema:

```json
{
  "client_name": "Acme Corp",
  "contact_person": "Jane Doe",
  "contact_email": "jane@acmecorp.com",
  "service_tier": "Enterprise Retainer",
  "project_goals": "We need to rebrand our SaaS platform and scale organic acquisition by 40% in Q3. Main pain point is low conversion on our current pricing page.",
  "target_kickoff_date": "2026-12-01"
}
```

### Module Configuration in Make.com

1. Add a **Webhooks -> Custom Webhook** module as the scenario trigger.
2. Click **Add**, name the webhook `Client Onboarding Intake`, and copy the generated URL.
3. Send a test payload using `curl` or Postman to define the data structure automatically:

```bash
curl -X POST https://hook.eu1.make.com/your-custom-webhook-id \
  -H "Content-Type: application/json" \
  -d '{
    "client_name": "Acme Corp",
    "contact_person": "Jane Doe",
    "contact_email": "jane@acmecorp.com",
    "service_tier": "Enterprise Retainer",
    "project_goals": "We need to rebrand our SaaS platform.",
    "target_kickoff_date": "2026-12-01"
  }'
```

4. Add a **Filter** immediately after the webhook:
   * **Condition**: `contact_email` *Contains* `@` **AND** `client_name` *Exists*.
   * This guarantees that downstream API calls never execute with incomplete payloads.

---

## Step 2: Processing Data with AI

Raw onboarding responses are rarely structured cleanly. We will pass `project_goals` through **OpenAI (GPT-4o)** using JSON Mode to structure deliverables, calculate an onboarding complexity score, and generate personalized communication.

### OpenAI Module Setup

Add the **OpenAI (ChatGPT) -> Create a Completion** module.

* **Model**: `gpt-4o`
* **Response Format**: `JSON Object`

#### System Prompt
```text
You are an executive project management AI for a digital agency. Analyze incoming client onboarding data and output strict JSON matching the required schema. Do not output markdown formatting wrappers (e.g., ```json).
```

#### User Prompt
```text
Analyze the following client onboarding input:
Client: {{1.client_name}}
Service Tier: {{1.service_tier}}
Goals: {{1.project_goals}}

Output a JSON object containing:
1. "executive_summary": A 2-sentence executive summary.
2. "deliverables": An array of 3 concrete technical project deliverables.
3. "complexity_rating": "Low", "Medium", or "High" based on scope.
4. "kickoff_email_body": A professional welcome email draft addressed to {{1.contact_person}}.
```

### Sample Output Schema
```json
{
  "executive_summary": "Acme Corp aims to execute a complete SaaS platform rebrand while targeting a 40% increase in Q3 organic acquisition. Priority focus is optimizing pricing page conversion rates.",
  "deliverables": [
    "SaaS Pricing Page Redesign & UX Audit",
    "Brand Style Guide & Component Library",
    "Conversion Rate Optimization (CRO) A/B Testing Setup"
  ],
  "complexity_rating": "High",
  "kickoff_email_body": "Hi Jane,\n\nWelcome to the agency! We are thrilled to partner with Acme Corp on your upcoming rebrand and growth initiative..."
}
```

---

## Step 3: Dispatch & CRM Sync

Now that we have validated inputs and structured AI outputs, we sync the data across Notion and Slack.

```
[ Filter Passed ] ──► [ OpenAI Structuring ] ──► [ Notion: Create Page ] ──► [ Slack: Post Message ]
```

### 1. Notion API: Create Database Item

Add the **Notion -> Create a Database Item** module.

* **Database ID**: Select your target `Clients Master Database`.
* **Properties Mapping**:
  * **Client Name (Title)**: `{{1.client_name}}`
  * **Contact Email (Email)**: `{{1.contact_email}}`
  * **Service Tier (Select)**: `{{1.service_tier}}`
  * **Complexity (Select)**: `{{2.choices[].message.content.complexity_rating}}`
  * **Onboarding Status (Status)**: `Kickoff Scheduled`
  * **Target Date (Date)**: `{{1.target_kickoff_date}}`

* **Page Content (Markdown / Rich Text Blocks)**:
  Map `{{2.choices[].message.content.executive_summary}}` into a Callout block and iterate through `{{2.choices[].message.content.deliverables}}` to create bulleted list items.

### 2. Slack Notification Dispatch

Add the **Slack -> Create a Message** module to notify your delivery team.

* **Channel**: `#client-onboarding`
* **Message Type**: Advanced (Blocks API)

```json
[
  {
    "type": "header",
    "text": "🚀 New Client Onboarded: {{1.client_name}}"
  },
  {
    "type": "section",
    "fields": [
      {
        "type": "mrkdwn",
        "text": "*Contact:* {{1.contact_person}} (<mailto:{{1.contact_email}}|{{1.contact_email}}>)"
      },
      {
        "type": "mrkdwn",
        "text": "*Complexity:* {{2.choices[].message.content.complexity_rating}}"
      }
    ]
  },
  {
    "type": "section",
    "text": {
      "type": "mrkdwn",
      "text": "*Executive Summary:*\n{{2.choices[].message.content.executive_summary}}"
    }
  },
  {
    "type": "actions",
    "elements": [
      {
        "type": "button",
        "text": "View in Notion",
        "url": "{{3.url}}",
        "style": "primary"
      }
    ]
  }
]
```

---

## JSON Blueprint Configuration

Below is a representative JSON export structure of the scenario blueprint. You can reference this configuration pattern to map modules in Make.com.

```json
{
  "name": "Client Onboarding Engine (Notion + AI)",
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
      "module": "openai-gpt3:createCompletion",
      "version": 1,
      "parameters": {
        "model": "gpt-4o",
        "temperature": 0.2
      },
      "mapper": {
        "messages": [
          {
            "role": "system",
            "content": "You are a project management assistant. Return valid JSON only."
          },
          {
            "role": "user",
            "content": "{{1.project_goals}}"
          }
        ],
        "response_format": { "type": "json_object" }
      }
    },
    {
      "id": 3,
      "module": "notion:createADatabaseItem",
      "version": 2,
      "mapper": {
        "databaseId": "database_id_hash",
        "properties": {
          "Name": { "title": [{ "text": { "content": "{{1.client_name}}" } }] },
          "Email": { "email": "{{1.contact_email}}" }
        }
      }
    },
    {
      "id": 4,
      "module": "slack:createMessage",
      "version": 1,
      "mapper": {
        "channel": "C0123456789",
        "text": "New onboarding received for {{1.client_name}}"
      }
    }
  ],
  "connections": [
    { "from": 1, "to": 2 },
    { "from": 2, "to": 3 },
    { "from": 3, "to": 4 }
  ]
}
```

---

## Error Handling & Production Guidelines

To deploy this scenario securely in a enterprise environment, implement the following error handling patterns:

### 1. Handling Rate Limits (HTTP 429)
Both OpenAI and Notion enforce rate limits. Enable **Exponential Backoff** in Make.com settings:
* Open Scenario Settings (gear icon at the bottom toolbar).
* Toggle **Allow storing incomplete executions** to `YES`.
* Attach an **Error Handler Directive (`Break`)** to the Notion and OpenAI modules. Set the retry count to `3` with a 2-minute interval.

```
[ Notion Module ] ──(Error)──► [ Directive: Break (3 Retries, 2m Delay) ]
```

### 2. Preventing Duplicate Executions (Idempotency)
If a form provider submits duplicate payloads due to network timeouts:
* Store incoming `contact_email` values in a Data Store or query Notion via **Search Objects** before processing.
* If a Notion page already exists with `contact_email == {{1.contact_email}}`, route the scenario to an early termination path using a **Router**.

### 3. Payload Schema Validation
Never trust un-sanitized client input. Use Make's built-in `trim()`, `lower()`, and Regex functions (`replace()`) to clean email inputs and string parameters before executing external API calls.