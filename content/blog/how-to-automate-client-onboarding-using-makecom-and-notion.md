---
title: "How to automate client onboarding using Make.com and Notio"
excerpt: "A complete step-by-step technical guide to automating workflows with AI and modern APIs."
publishedAt: "2026-11-24"
category: "Agency Automation"
author: "Md. Selim Reza"
tags: ["Automation", "Make.com", "AI Workflows"]
workflowTool: "Make.com"
featured: false
---

## Architecture Overview

Manual onboarding creates friction, delayed time-to-value, and operational overhead. This architecture automates client ingestion, data enrichment, custom strategy generation, CRM record creation, and team notification into a zero-touch pipeline.

```
[ Form Submission ] ──> [ Make.com Webhook ] ──> [ Input Sanitization ]
                                                      │
[ Slack / Email ] <── [ Notion Sync & Tasks ] <── [ OpenAI Analysis ]
```

### End-to-End Pipeline Breakdown

1. **Ingestion Layer (Trigger):** Captures raw client intake data via HTTP Webhook payload (e.g., Typeform, Tally, or custom web form).
2. **Validation & Normalization:** Filters out malformed inputs, sanitizes strings, and enforces required fields.
3. **AI Processing Engine:** Routes unstructured brief data to OpenAI (GPT-4o) using structured JSON outputs to extract key risks, generate action items, and draft personalized welcome materials.
4. **CRM & Operational Storage:** Atomically creates a primary Client Hub record in Notion and populates relational onboarding task databases.
5. **Notification & Dispatch:** Broadcasts high-priority alerts to internal Slack channels and dispatches personalized onboarding assets to the client via email.

---

## Step 1: Setting Up the Trigger & Payload

The onboarding workflow initiates when a client submits an intake form. We capture this via a custom Webhook in Make.com.

### 1. Configure the Webhook Listener

1. In Make.com, create a new scenario and add a **Custom Webhook** module (Webhooks app).
2. Click **Add**, name the webhook `Client Onboarding Intake`, and copy the generated target URL.
3. Configure your frontend form (Typeform, Tally, or custom API POST request) to deliver a JSON payload to this endpoint.

### 2. Expected Data Payload Schema

Ensure your form sends structured JSON matching this interface:

```json
{
  "client_name": "Acme Corp",
  "contact_person": "Sarah Connor",
  "email": "sarah@acmecorp.com",
  "budget": 15000,
  "kickoff_date": "2026-12-01",
  "raw_brief": "We need to automate our lead routing across 3 sales teams and integrate our HubSpot CRM with custom PostgreSQL databases. Key pain point: manual entry delays response times by 4 hours."
}
```

### 3. Data Sanitization & Input Parsing

Add a Make.com **Tools: Set Variables** module immediately after the Webhook module to normalize variables and protect against missing payloads.

* **Clean Name:** `trim({{1.client_name}})`
* **Sanitized Email:** `lower(trim({{1.email}}))`
* **Safe Brief:** `ifempty({{1.raw_brief}}; "No details provided.")`

---

## Step 2: Processing Data with AI

Raw onboarding briefs often contain unstructured data. We use OpenAI’s API within Make.com to parse the brief into structured tasks, extract key technical requirements, and perform risk analysis.

### 1. OpenAI Module Setup

Add the **OpenAI (ChatGPT)** module with the action **Create a Completion (v2)**. Select model `gpt-4o`.

Set **Response Format** to `json_object` to ensure reliable mapping downstream.

### 2. Prompt Engineering Configuration

#### System Prompt
```text
You are an elite Agency Operations AI. Your job is to process raw client intake forms into structured JSON containing strategic goals, high-priority onboarding tasks, and risk factors.

You MUST return valid JSON adhering to this exact schema:
{
  "summary": "String",
  "risk_score": "Low | Medium | High",
  "risk_analysis": "String",
  "suggested_tasks": [
    {
      "task_name": "String",
      "priority": "High | Medium | Low",
      "category": "Setup | Strategy | Technical"
    }
  ],
  "welcome_email_body": "String"
}
```

#### User Prompt
```text
Client Name: {{2.clean_name}}
Contact: {{1.contact_person}}
Budget: ${{1.budget}}
Kickoff Target: {{1.kickoff_date}}
Raw Intake Brief: {{2.safe_brief}}
```

---

## Step 3: Dispatch & CRM Sync

Once OpenAI generates structured insights, we sync records across Notion and inform team members.

### 1. Notion Setup: Client Database Sync

Add a **Notion: Create a Database Item** module. Map the parsed variables to your "Clients" database properties:

| Notion Property | Type | Variable / Value |
| :--- | :--- | :--- |
| **Client Name** | Title | `{{2.clean_name}}` |
| **Status** | Status | `Onboarding` |
| **Contact Email** | Email | `{{2.sanitized_email}}` |
| **Contract Value**| Number | `{{1.budget}}` |
| **Risk Level** | Select | `{{parseJSON(3.message.content).risk_score}}` |
| **AI Executive Summary** | Text | `{{parseJSON(3.message.content).summary}}` |

Save the returned **Notion Page ID** (`{{4.id}}`) for task linking.

### 2. Batch Creating Tasks in Notion

To automatically add tasks to a relational "Tasks" database linked to the Client:

1. Add an **Iterator** module.
2. Set the array input to `{{parseJSON(3.message.content).suggested_tasks}}`.
3. Follow with a **Notion: Create a Database Item** module (for the Tasks database).
4. Map properties:
   * **Task Name:** `{{5.value.task_name}}`
   * **Priority:** `{{5.value.priority}}`
   * **Category:** `{{5.value.category}}`
   * **Client Relation:** `[{{4.id}}]`

### 3. Team Alerts & Client Dispatch

Finally, notify internal stakeholders and dispatch welcome emails.

* **Slack Module (Create a Message):** Send a rich markdown message to `#client-onboarding`.
  ```text
  🚀 *New Client Onboarded: {{2.clean_name}}*
  • *Value:* ${{1.budget}}
  • *Risk Score:* {{parseJSON(3.message.content).risk_score}}
  • *Notion Hub:* {{4.url}}
  
  *Executive Summary:*
  {{parseJSON(3.message.content).summary}}
  ```
* **Email Module (Send an Email):** Route `{{parseJSON(3.message.content).welcome_email_body}}` to `{{2.sanitized_email}}`.

---

## JSON Blueprint Configuration

Import this JSON template directly into Make.com to generate the underlying scenario structure:

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
      "module": "util:SetVariables",
      "version": 1,
      "mapper": {
        "variables": [
          { "name": "clean_name", "value": "{{trim(1.client_name)}}" },
          { "name": "sanitized_email", "value": "{{lower(trim(1.email))}}" },
          { "name": "safe_brief", "value": "{{ifempty(1.raw_brief, 'No brief provided.')}}" }
        ]
      }
    },
    {
      "id": 3,
      "module": "openai-gpt3:createChatCompletion",
      "version": 1,
      "parameters": {
        "model": "gpt-4o",
        "response_format": { "type": "json_object" }
      }
    },
    {
      "id": 4,
      "module": "notion:createADatabaseItem",
      "version": 1,
      "parameters": {
        "databaseId": "notion_client_db_id"
      }
    },
    {
      "id": 5,
      "module": "util:Iterator",
      "version": 1,
      "mapper": {
        "array": "{{parseJSON(3.message.content).suggested_tasks}}"
      }
    },
    {
      "id": 6,
      "module": "notion:createADatabaseItem",
      "version": 1,
      "parameters": {
        "databaseId": "notion_tasks_db_id"
      }
    },
    {
      "id": 7,
      "module": "slack:createAMessage",
      "version": 1,
      "parameters": {
        "channelType": "public",
        "channelId": "C0123456789"
      }
    }
  ],
  "connections": []
}
```

---

## Error Handling & Production Guidelines

Production workflows require defensive configurations to maintain data consistency during unexpected downtime or API limits.

```
[ Module Action ] ──( Error )──> [ Catch Router ] ──> [ Backup Store / Alert ]
                                       │
                                 [ Retry Pass ]
```

### 1. Handling API Rate Limits & Quotas
* **Notion Rate Limits:** Notion enforces a strict 3 requests-per-second limit. Enable **Sequential Processing** in Scenario Settings to prevent concurrency bottlenecks when iterating tasks.
* **OpenAI Fallback:** Wrap the OpenAI module in a **Break** directive to retry API calls up to 3 times with exponential backoff (e.g., 1 min, 5 min, 15 min) in case of rate limits (`429`) or server instability (`5xx`).

### 2. Strict Schema Validation & JSON Parsing Edge Cases
* Model output formatting can occasionally break if the system prompt is violated. Always pass raw OpenAI string outputs through a Make.com `parseJSON()` function.
* Direct the output of `parseJSON()` to a **Catch Error Directive**. Set the fallback route to a secondary module that manually sets emergency tasks and alerts an admin in Slack.

### 3. State Management & Data Idempotency
* **Prevent Duplicate Syncs:** Generate an MD5 hash of `email + client_name` using Make's `md5()` function. Check against Notion before record creation to ensure idempotency when retrying failed scenario runs.
* **Data Rollback Strategy:** If the task creation loop fails mid-way, tag the parent Notion client page status as `Onboarding Error` so team members know manual setup is required.