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

Manual client onboarding is prone to latency, data fragmentation, and high operational overhead. By combining **Make.com**, **OpenAI**, and **Notion**, agencies can build an end-to-end automated pipeline that provisions workspaces, generates custom action plans, and notifies key stakeholders within seconds of intake form submission.

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│ Webhook / Form  │────>│  Make.com Filter │────>│  OpenAI API      │
│ (Typeform/Tally)│     │  & Validation    │     │  (Data Extraction│
└─────────────────┘     └──────────────────┘     │   & Planning)    │
                                                 └────────┬─────────┘
                                                          │
┌─────────────────┐     ┌──────────────────┐              │
│ Slack / Email   │<────│ Notion API       │<─────────────┘
│ Dispatch        │     │ Workspace Sync   │
└─────────────────┘     └──────────────────┘
```

The system operates across four primary stages:

1. **Input Trigger & Validation:** Listens for incoming webhook payloads from intake forms, sanitizes the raw data, and validates required parameters.
2. **AI Analysis & Content Generation:** Passes raw project scopes to an LLM to generate structured milestones, executive summaries, and personalized welcome messaging.
3. **CRM & Database Persistence:** Interacts with the Notion API to create client records, populate project boards, and link nested deliverables.
4. **Stakeholder Dispatch:** Distributes actionable alerts to internal team channels via Slack and dispatches onboarding documentation to the client.

---

## Step 1: Setting Up the Trigger & Payload

The onboarding workflow begins with an inbound payload—typically from a form builder like Tally, Typeform, or a custom frontend app posted to a **Make.com Custom Webhook**.

### Webhook Data Schema

Set up your form or API caller to send a POST payload formatted as follows:

```json
{
  "client": {
    "company_name": "Acme Corp",
    "contact_name": "Jane Doe",
    "email": "jane@acme.com",
    "tier": "Enterprise"
  },
  "project": {
    "title": "Q4 Rebranding & Web Design",
    "budget": 25000,
    "target_launch_date": "2026-12-15",
    "raw_scope_notes": "We need a complete redesign of our marketing site, modernizing our design system in Figma, and migrating our CMS to Webflow. Key risks include tight timelines around our annual conference."
  }
}
```

### Make.com Trigger Configuration

1. Add a **Webhooks > Custom Webhook** module to your Make.com scenario.
2. Click **Add** and copy the generated webhook URL.
3. Send a test POST request to determine the data structure automatically.
4. Insert a **Filter** immediately after the webhook module to validate essential payload keys:
   * **Condition:** `client.email` *Exists*
   * **AND:** `client.company_name` *Exists*
   * **AND:** `project.raw_scope_notes` *Exists*

```
[Webhook Trigger] ── (Filter: Required Fields Present?) ──> [Next Module]
```

---

## Step 2: Processing Data with AI

Raw client intake data is rarely ready for direct database insertion. We use an AI step to structure unformatted text notes into actionable tasks, risk summaries, and client-facing communication templates.

### Module Setup: OpenAI (Create a Completion / Chat Response)

* **Model:** `gpt-4o` (or `gpt-4o-mini` for high-throughput, low-latency requirements)
* **Response Format:** `json_object`

#### System Prompt

```text
You are an expert agency operations architect. Your job is to process raw project intake submissions and convert them into structured project plans.

You MUST respond strictly in valid JSON using the following structure:
{
  "executive_summary": "string",
  "risk_assessment": "string",
  "milestones": [
    {
      "task_name": "string",
      "phase": "Discovery|Design|Development|Launch",
      "estimated_days": 5
    }
  ],
  "welcome_email_body": "string"
}
```

#### User Prompt

```text
Process the following client intake context:
Company: {{1.client.company_name}}
Contact: {{1.client.contact_name}}
Scope: {{1.project.raw_scope_notes}}
Target Date: {{1.project.target_launch_date}}
```

### Parsing the JSON Response

If you do not enforce response schemas natively at the API level, add a **JSON > Parse JSON** module immediately following the OpenAI node. Pass `choices[1].message.content` into the Parse JSON module to expose dynamic tokens for Notion field mapping.

---

## Step 3: Dispatch & CRM Sync

Once the payload is structured, we write the data to Notion and trigger downstream alerts.

### Notion Database Schema Setup

Prepare three related databases in Notion:
1. **Clients:** (Name, Contact Email, Tier, Status)
2. **Projects:** (Project Title, Client Relation, Executive Summary, Launch Date)
3. **Tasks:** (Task Name, Phase, Project Relation, Status)

### Execution Sequence in Make.com

#### 1. Create Client Record
Add a **Notion > Create a Database Item** module for the **Clients** database:
* **Name:** `{{1.client.company_name}}`
* **Email Property:** `{{1.client.email}}`
* **Status:** `Active`

#### 2. Create Project Record
Add a second **Notion > Create a Database Item** module mapped to the **Projects** database:
* **Project Title:** `{{1.project.title}}`
* **Client Relation:** ID from the *Create Client Record* module (`{{3.id}}`)
* **Executive Summary:** `{{2.parsed_json.executive_summary}}`
* **Launch Date:** `{{1.project.target_launch_date}}`

#### 3. Populate Milestones (Iterator Pattern)
Add an **Iterator** module to cycle through the generated AI task array:
* **Array Input:** `{{2.parsed_json.milestones}}`

Inside the iterator flow, attach a **Notion > Create a Database Item** module targeting the **Tasks** database:
* **Task Name:** `{{4.value.task_name}}`
* **Phase:** `{{4.value.phase}}`
* **Project Relation:** ID from the *Create Project Record* module (`{{3.id}}`)

```
[OpenAI / Parse JSON] ──> [Notion: Create Client] ──> [Notion: Create Project] ──> [Iterator] ──> [Notion: Create Task]
```

#### 4. Stakeholder Dispatch

After task iteration completes, send outbound notifications using a **Router**:

* **Path A (Internal Alert via Slack):**
  * Module: **Slack > Create a Message**
  * Channel: `#client-onboarding`
  * Text Payload:
    ```text
    🚀 *New Client Onboarded!*
    *Company:* {{1.client.company_name}}
    *Scope Summary:* {{2.parsed_json.executive_summary}}
    *Notion Project Page:* https://notion.so/{{3.id}}
    ```

* **Path B (External Outreach via Gmail/SendGrid):**
  * Module: **Gmail > Send an Email**
  * To: `{{1.client.email}}`
  * Subject: `Welcome to the Team, {{1.client.contact_name}}!`
  * Body: `{{2.parsed_json.welcome_email_body}}`

---

## JSON Blueprint Configuration

Below is an abstract representation of the Make.com scenario blueprint structure. This can be adapted for importing directly into custom scenario templates or reviewed to understand module connectivity.

```json
{
  "name": "Production Client Onboarding Pipeline",
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
        "response_format": { "type": "json_object" }
      }
    },
    {
      "id": 3,
      "module": "json:ParseJSON",
      "version": 1,
      "parameters": {
        "type": "strict"
      }
    },
    {
      "id": 4,
      "module": "notion:createDatabaseItem",
      "version": 2,
      "parameters": {
        "databaseId": "notion-db-clients-uuid"
      }
    },
    {
      "id": 5,
      "module": "notion:createDatabaseItem",
      "version": 2,
      "parameters": {
        "databaseId": "notion-db-projects-uuid"
      }
    },
    {
      "id": 6,
      "module": "builtin:Iterator",
      "version": 1,
      "parameters": {}
    },
    {
      "id": 7,
      "module": "notion:createDatabaseItem",
      "version": 2,
      "parameters": {
        "databaseId": "notion-db-tasks-uuid"
      }
    },
    {
      "id": 8,
      "module": "slack:createMessage",
      "version": 1,
      "parameters": {
        "channelType": "public",
        "channelId": "C01234567"
      }
    }
  ],
  "routes": [
    {
      "source": 1,
      "target": 2,
      "filter": {
        "name": "Validate Email Exists",
        "formula": "{{1.client.email}} != ''"
      }
    },
    { "source": 2, "target": 3 },
    { "source": 3, "target": 4 },
    { "source": 4, "target": 5 },
    { "source": 5, "target": 6 },
    { "source": 6, "target": 7 },
    { "source": 5, "target": 8 }
  ]
}
```

---

## Error Handling & Production Guidelines

Production environments require robust error isolation to handle third-party service outages, rate limits, and non-conforming user input.

### 1. Handling API Rate Limits & Backoff Strategies

* **Notion API Limits:** The Notion API enforces an average limit of **3 requests per second**. When creating multiple sub-items inside an Iterator, insert a **Tools > Sleep** module set to `350ms` between iterations to prevent `429 Too Many Requests` status codes.
* **OpenAI Rate Limits:** Configure the OpenAI module's internal retry mechanism, or place a **Break Directive** error handler on the module to auto-retry with exponential backoff on `5xx` server responses.

### 2. Error Directives Configuration

Attach error-handling directives to crucial nodes:

* **Webhook Directives:** Add a **Commit** or **Ignore** directive on initial filters to drop malformed payloads gracefully without pausing scenario execution.
* **Notion Directives:** Attach a **Break** directive on Notion creation modules. If Notion experiences downtime, Make.com will queue the execution execution buffer and retry automatically at set intervals (e.g., after 5, 15, and 45 minutes).

```
[Notion Creation Module] 
       │
       └── (Error Path) ──> [Break Directive: Store execution & retry later]
```

### 3. Edge Case Mitigations

* **Duplicate Client Entries:** Before running *Notion > Create Client*, place a **Notion > Search Objects** module querying by `client.email`. Use a Router condition:
  * **If Search returns results:** Map the existing Notion Client ID.
  * **If Search returns 0 results:** Create a new Client database entry.
* **Malformed AI JSON Output:** Wrap the Parse JSON step with an **Incomplete Execution** buffer or fallback default block. If the parser fails to read the model's response, fall back to a manual workflow by sending a simplified alert to Slack containing the raw input data.
* **Idempotency Keys:** Include the inbound submission ID (e.g., `1.id`) in a custom Notion property called `Intake Submission ID` to verify that duplicate webhooks do not trigger redundant project creation.