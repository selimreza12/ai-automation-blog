---
title: "How to automate client onboarding using Make.com and Notion"
excerpt: "A complete step-by-step technical guide to automating workflows with AI and modern APIs."
publishedAt: "2026-11-08"
category: "Agency Automation"
author: "Md. Selim Reza"
tags: ["Automation", "Make.com", "AI Workflows"]
workflowTool: "Make.com"
featured: false
---

## Architecture Overview

Manual client onboarding creates operational friction, increases time-to-value, and risks human error during data entry. By combining **Make.com**, **OpenAI**, and **Notion**, agencies can transform raw onboarding form submissions into dynamic, AI-enriched client portals and automated internal workflows within seconds.

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│ Webhook / Form  │ ──> │  Make.com Filter │ ──> │ OpenAI (GPT-4o)  │
│  (Client Input) │     │   & Validation   │     │ (Task / Strategy)│
└─────────────────┘     └──────────────────┘     └──────────────────┘
                                                          │
                                                          ▼
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Slack / Email  │ <── │ Dynamic Task Loop│ <── │ Notion Client DB │
│ Notification    │     │  (Make Iterator) │     │ & Portal Sync    │
└─────────────────┘     └──────────────────┘     └──────────────────┘
```

### Flow Breakdown

1. **Input Trigger**: A custom webhook captures structured intake data (Typeform, Tally, or custom web app).
2. **Validation Layer**: Make.com filters verify payload completeness, email validity, and target workspace status.
3. **AI Processing Engine**: GPT-4o analyzes client goals, categorizes project urgency, generates tailored onboarding task lists, and crafts a personalized welcome summary in JSON format.
4. **Data Persistence**: Make.com creates a primary client record in the Notion **Clients Workspace**, creates a dedicated project page, and populates sub-tasks via an iterator.
5. **Notification Dispatch**: An automated Slack notification alerts the internal account team, while a personalized welcome email is dispatched to the client with their Notion Portal link.

---

## Step 1: Setting Up the Trigger & Payload

To capture client intake data reliably, set up a custom HTTP Webhook in Make.com. This decouples the onboarding frontend from your processing pipeline.

### Webhook Configuration

1. In Make.com, create a new scenario and add the **Webhooks -> Custom Webhook** module.
2. Generate a public webhook URL (e.g., `https://hook.eu1.make.com/your-unique-hash`).
3. Send a test `POST` request with your client intake payload.

### Standard Intake JSON Payload

```json
{
  "client_info": {
    "company_name": "Apex Digital Labs",
    "contact_name": "Sarah Jenkins",
    "contact_email": "sarah@apexdigital.com",
    "tier": "Enterprise"
  },
  "project_details": {
    "service_type": "AI Automation Retainer",
    "budget": "$15,000/mo",
    "primary_goals": "Automate customer support ticket triage and sync CRM data directly to Snowflake.",
    "target_launch_date": "2026-12-01"
  },
  "metadata": {
    "submitted_at": "2026-11-08T10:30:00Z",
    "submission_id": "sub_984321749"
  }
}
```

### Make.com Router & Validation Setup

Add a **Basic Filter** immediately following the Webhook module to drop malformed payloads:

* **Condition 1**: `client_info.contact_email` **Contains** `@`
* **Condition 2**: `client_info.company_name` **Exists**
* **Condition 3**: `project_details.primary_goals` **Length greater than** `10`

---

## Step 2: Processing Data with AI

Raw onboarding responses are rarely structured enough to drop directly into operational databases. We use OpenAI's `chat/completions` engine with Structured Outputs (`response_format: { type: "json_object" }`) to generate standardized project blueprints.

### Make.com OpenAI Module Configuration

* **Module**: OpenAI (ChatGPT) -> *Create a Completion*
* **Model**: `gpt-4o`
* **Temperature**: `0.2` (Low variance for consistent output)

### System Prompt

```text
You are an expert agency operations architect. Analyze client intake payloads and generate structured JSON containing operational roadmaps, risk flags, and sub-tasks for client onboarding.

Output format MUST strictly adhere to this JSON structure:
{
  "executive_summary": "String",
  "project_complexity": "Low" | "Medium" | "High",
  "recommended_tech_stack": ["String"],
  "action_items": [
    {
      "task_name": "String",
      "assigned_role": "String",
      "priority": "P1" | "P2" | "P3",
      "estimated_hours": 0
    }
  ]
}
```

### User Prompt Mapping

```text
Analyze the following client intake submission:
Company Name: {{1.client_info.company_name}}
Contact Name: {{1.client_info.contact_name}}
Service Type: {{1.project_details.service_type}}
Primary Goals: {{1.project_details.primary_goals}}
Target Date: {{1.project_details.target_launch_date}}
```

### Example AI Output Payload

```json
{
  "executive_summary": "Apex Digital Labs requires an enterprise-grade AI triage engine and Snowflake pipeline setup.",
  "project_complexity": "High",
  "recommended_tech_stack": ["Make.com", "OpenAI API", "Snowflake", "Zendesk API"],
  "action_items": [
    {
      "task_name": "Audit current Zendesk API access and rate limits",
      "assigned_role": "Solutions Architect",
      "priority": "P1",
      "estimated_hours": 4
    },
    {
      "task_name": "Draft Snowflake schema mapping document",
      "assigned_role": "Data Engineer",
      "priority": "P1",
      "estimated_hours": 8
    },
    {
      "task_name": "Configure Make.com error-handling modules & webhooks",
      "assigned_role": "Automation Specialist",
      "priority": "P2",
      "estimated_hours": 6
    }
  ]
}
```

---

## Step 3: Dispatch & CRM Sync

Once OpenAI returns the structured analysis, Make.com parses the JSON object and updates Notion and team communication tools.

### 1. Create Notion Client Record

Connect the **Notion -> Create a Database Item** module configured to your **Clients Database**.

| Field Name | Type | Value Mapping |
| :--- | :--- | :--- |
| **Client Name** | Title | `{{1.client_info.company_name}}` |
| **Primary Contact**| Text | `{{1.client_info.contact_name}} ({{1.client_info.contact_email}})` |
| **Tier** | Select | `{{1.client_info.tier}}` |
| **Complexity** | Select | `{{2.json.project_complexity}}` |
| **AI Summary** | Text | `{{2.json.executive_summary}}` |
| **Status** | Status | `Onboarding Active` |

### 2. Iterate and Create Tasks in Notion

Add a **JSON -> Parse JSON** module (or reference the native Make OpenAI output), then route through an **Iterator**:

* **Array**: `{{2.json.action_items}}`

Inside the Iterator loop, place a **Notion -> Create a Database Item** module targeting your **Master Tasks Database**:

* **Task Title**: `{{3.task_name}}`
* **Role Assigned**: `{{3.assigned_role}}`
* **Priority**: `{{3.priority}}`
* **Est. Hours**: `{{3.estimated_hours}}`
* **Parent Client (Relation)**: `{{Notion Database Item ID from Step 1}}`

### 3. Team Slack Notification

After task creation completes (via a **Numeric Aggregator**), trigger a Slack **Create a Message** call to your team channel:

```markdown
🚨 *New Client Onboarded: {{1.client_info.company_name}}*
*Tier:* {{1.client_info.tier}} | *Complexity:* {{2.json.project_complexity}}
*Summary:* {{2.json.executive_summary}}

🔗 <{{Notion_Page_URL}}|Open Notion Client Portal>
```

---

## JSON Blueprint Configuration

Import this blueprint structure into Make.com via the **Import Blueprint** option to instantiate the baseline flow.

```json
{
  "name": "Automated Client Onboarding Engine",
  "scenario": {
    "submodules": [
      {
        "id": 1,
        "module": "gateway:CustomWebhook",
        "version": 1,
        "parameters": {
          "hook": 781029,
          "maxResults": 1
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
        }
      },
      {
        "id": 3,
        "module": "notion:createADatabaseItem",
        "version": 2,
        "parameters": {
          "databaseId": "bd8271e8-782a-4f91-b389-9a3d721bb011"
        }
      },
      {
        "id": 4,
        "module": "builtin:Iterator",
        "version": 1,
        "parameters": {
          "array": "{{2.response.body.choices[0].message.content.action_items}}"
        }
      },
      {
        "id": 5,
        "module": "notion:createADatabaseItem",
        "version": 2,
        "parameters": {
          "databaseId": "ee4819aa-110c-4c22-aa11-827361540984"
        }
      }
    ],
    "routes": [
      {
        "source": 1,
        "target": 2
      },
      {
        "source": 2,
        "target": 3
      },
      {
        "source": 3,
        "target": 4
      },
      {
        "source": 4,
        "target": 5
      }
    ]
  }
}
```

---

## Error Handling & Production Guidelines

Production workflows require defensive design patterns to withstand rate limits, invalid input, and third-party API downtime.

```
       [Primary Flow Module]
                 │
                 ▼ (Error Detected)
    ┌─────────────────────────┐
    │  Make Directive Directive│
    └─────────────────────────┘
        │                 │
 (HTTP 429 / 5xx)     (Schema / Validation Error)
        │                 │
        ▼                 ▼
   [Break Directive]  [Commit / Rollback Directive]
   (Retry Strategy)   (Alert Ops Team via Webhook)
```

### 1. Handling API Rate Limits & Transient Failures

* **Notion API Limits**: Notion enforces a baseline rate limit of **3 requests per second**. When creating multiple sub-tasks via an Iterator, batch iterations using a **Sleep** module set to `350ms` between iterations, or configure the Notion module with a **Break** error handler directive.
* **OpenAI Rate Limits**: Attach a **Break Directive** to the OpenAI module:
  * **NumberOfRetries**: `3`
  * **IntervalBetweenAttempts**: `1` minute (Exponential Backoff enabled).

### 2. Validating AI Output Integrity

AI model responses can occasionally deviate from expected schema. Prevent database corruption with strict JSON checks:

1. Enable **JSON Schema Enforcement** in the OpenAI completion options if available.
2. Route OpenAI response through a **Make.com Filter**:
   * Filter rule: `{{2.json.action_items}}` **Is an Array**
   * If validation fails, route the payload to a **Fallback Error Handler** (e.g., Slack alert to Ops team with the raw input for manual intervention).

### 3. Idempotency & Data Deduplication

* Generate a unique submission hash combining `submission_id` and `contact_email`.
* Query the Notion **Clients Database** using a **Notion -> Search Database Items** module prior to creation.
* If a page with the matching hash exists, execute an **Update Page** operation instead of duplicating the database entry.