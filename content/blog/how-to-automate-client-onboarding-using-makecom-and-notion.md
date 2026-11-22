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

## Architecture Overview

Manual client onboarding creates bottlenecks, introduces human error, and delays project kickoff. By pairing **Make.com** as an orchestration middleware with **OpenAI** for cognitive processing and **Notion** as a dynamic CRM, you can build an enterprise-grade automated onboarding pipeline.

The target system architecture executes in four distinct phases:

```
[ Form / Webhook Trigger ] 
          │
          ▼
[ Phase 1: Payload Parsing & Validation ]
          │
          ▼
[ Phase 2: AI Summarization & Action Plan Generation ]
          │
          ▼
[ Phase 3: Notion Database Sync & Dynamic Asset Creation ]
          │
          ▼
[ Phase 4: Multi-Channel Dispatch (Slack & Email) ]
```

1. **Input Trigger**: A custom webhook receives raw JSON from an intake form (Tally, Typeform, or custom frontend).
2. **Validation Layer**: Filters and normalizes payload inputs, handling edge cases such as missing required parameters.
3. **AI Processing Layer**: An OpenAI API node ingests intake parameters to produce a structured JSON object containing a project brief, calculated risk scores, and a tailored onboarding checklist.
4. **Data Storage & Sync**: A target Notion CRM database ingests the validated client data and constructs an embedded page populated with dynamic project blocks.
5. **Notification Dispatch**: Triggers automated, personalized confirmation messages via Gmail/Resend and sends internal team alerts via Slack.

---

## Step 1: Setting Up the Trigger & Payload

To achieve sub-second execution latency, we start with a custom **Make.com Custom Webhook** module instead of polling-based triggers.

### 1. Configure the Webhook Listener

1. In Make.com, create a new scenario and add a **Custom Webhook** module (Webhooks app).
2. Set the webhook name to `Client Onboarding Intake (Prod)`.
3. Copy the generated execution URL.

### 2. Sample Inbound Payload Schema

Your intake form or application frontend should output a JSON payload structured like this:

```json
{
  "event": "client_intake_submitted",
  "timestamp": "2026-11-22T10:15:30Z",
  "client": {
    "first_name": "Sarah",
    "last_name": "Connor",
    "email": "sarah@cyberdyne.io",
    "company_name": "Cyberdyne Systems",
    "website": "https://cyberdyne.io",
    "tier": "Enterprise",
    "budget": 25000
  },
  "project_scope": {
    "primary_goal": "Migrate legacy CRM infrastructure to a custom AI-driven workspace.",
    "timeline": "6 weeks",
    "technical_stack": ["Salesforce", "HubSpot", "Python", "AWS"]
  }
}
```

### 3. Data Validation & Pre-processing

Directly following the Webhook trigger module, add a **Router** or direct **Filter** condition:

* **Condition**: `client.email` **Exists** AND `client.company_name` **Exists** AND `client.budget` **Greater than or equal to** `0`
* If the payload fails validation, direct the flow to an early HTTP Response node (Status `400 Bad Request`).

---

## Step 2: Processing Data with AI

Instead of copying static text into Notion, we pass the intake data into OpenAI (`gpt-4o`) to generate an intelligent project brief and custom action items structured as strict JSON.

### 1. OpenAI Module Configuration

Add an **OpenAI (ChatGPT) - Create a Prompt Completion** module using the chat completions endpoint (`v1/chat/completions`).

Set **Response Format** to `JSON Object`.

### 2. System and User Prompt Design

**System Prompt:**
```text
You are an expert AI agency project manager. Your job is to parse raw client intake data and output a structured JSON response. 

You must strictly output valid JSON matching this schema:
{
  "executive_summary": "string",
  "risk_assessment": "Low" | "Medium" | "High",
  "recommended_milestones": ["string"],
  "custom_welcome_message": "string"
}
```

**User Prompt (Mapping Make.com variables):**
```text
Analyze the following client intake submission:

Client: {{1.client.first_name}} {{1.client.last_name}}
Company: {{1.client.company_name}}
Tier: {{1.client.tier}}
Budget: ${{1.client.budget}}
Primary Goal: {{1.project_scope.primary_goal}}
Target Timeline: {{1.project_scope.timeline}}
Tech Stack: {{1.project_scope.technical_stack}}

Generate:
1. A 2-sentence executive summary.
2. A technical risk assessment based on timeline and budget.
3. 4 logical project milestones.
4. A personalized, professional welcome email.
```

### 3. Parsing the Structured JSON

Add a **JSON - Parse JSON** module immediately after OpenAI to transform the string output into standard Make.com variables:

* **JSON String**: `{{2.choices[1].message.content}}`

---

## Step 3: Dispatch & CRM Sync

With data validated and processed, we synchronize it into our Notion CRM database and issue internal/external notifications.

### 1. Syncing to Notion CRM

Add the **Notion - Create a Database Item** module.

#### Property Mappings

| Notion Database Property | Type | Make.com Variable / Formula |
| :--- | :--- | :--- |
| **Client Name** | Title | `{{1.client.company_name}}` |
| **Contact Email** | Email | `{{1.client.email}}` |
| **Status** | Status | `Onboarding` |
| **Tier** | Select | `{{1.client.tier}}` |
| **Budget** | Number | `{{1.client.budget}}` |
| **Risk Level** | Select | `{{3.risk_assessment}}` |
| **Onboarding Date** | Date | `{{now}}` |

#### Adding Dynamic Content Blocks to the Notion Page Body

In the **Content** section of the Notion module, inject dynamic markdown blocks:

```markdown
## Executive Brief
{{3.executive_summary}}

## Technical Scope & Milestones
{{#each 3.recommended_milestones}}
- [ ] {{this}}
{{/each}}

## Internal Notes & Technical Stack
- **Tech Stack:** {{join(1.project_scope.technical_stack; ", ")}}
- **Target Timeline:** {{1.project_scope.timeline}}
```

### 2. Multi-Channel Notification Dispatch

#### A. External: Send Personalized Welcome Email
Add a **Gmail - Send an Email** (or Resend/SendGrid) module:
* **To**: `{{1.client.email}}`
* **Subject**: `Welcome to {{Company_Name}} - Next Steps for {{1.client.company_name}}`
* **Body (HTML/Plain Text)**: `{{3.custom_welcome_message}}`

#### B. Internal: Slack Alert
Add a **Slack - Create a Message** module:
* **Channel**: `#client-onboarding`
* **Message**:
  ```text
  🚀 *New Client Onboarded!*
  *Company:* {{1.client.company_name}}
  *Tier:* {{1.client.tier}} | *Budget:* ${{1.client.budget}}
  *Risk Level:* {{3.risk_assessment}}
  *Notion Page:* {{4.url}}
  ```

---

## JSON Blueprint Configuration

Below is a compatible blueprint JSON block representing this pipeline. You can import this structure into Make.com via **Scenarios -> Import Blueprint**.

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
      },
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
        "response_format": { "type": "json_object" }
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
      "module": "json:ParseJSON",
      "version": 1,
      "metadata": {
        "designer": {
          "x": 600,
          "y": 0
        }
      }
    },
    {
      "id": 4,
      "module": "notion:createADatabaseItem",
      "version": 2,
      "metadata": {
        "designer": {
          "x": 900,
          "y": 0
        }
      }
    },
    {
      "id": 5,
      "module": "slack:createAMessage",
      "version": 1,
      "metadata": {
        "designer": {
          "x": 1200,
          "y": 0
        }
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

To move from a developer prototype to an enterprise production setup, apply these resiliency patterns:

### 1. Handling API Rate Limits & Transient Errors

* **OpenAI Rate Limits (`HTTP 429`)**: Right-click the OpenAI module in Make.com and attach a **Break** error handler module. Set **Number of retries** to `3` and **Interval between attempts** to `1 minute`.
* **Notion API Limits**: The Notion API occasionally returns `502 Bad Gateway` or `503 Service Unavailable`. Use a **Retry** directive on the Notion module with exponential backoff.

### 2. Payload Validation & Sanitization

* **Malformed JSON Inputs**: Attach an **Ignore** directive to the JSON Parser module to prevent malformed responses from stopping scenario execution.
* **XSS / HTML Injection**: If rendered on dynamic web portals, sanitize text inputs from the initial webhook (`client.first_name`, `client.company_name`) before inserting them into downstream payloads.

### 3. Execution Logging and Auditing

* **Data Retention**: Ensure **Data stores** or a secondary audit logger (e.g., Datadog, Airtable, or PostgreSQL) captures raw payload hashes and execution IDs for debugging.
* **DLQ (Dead Letter Queue)**: Place an email/Slack notification node at the end of an unhandled error execution route so your engineering team receives instant alerts when an onboarding pipeline fails.