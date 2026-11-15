---
title: "How to automate client onboarding using Make.com and Notion"
excerpt: "A complete step-by-step technical guide to automating workflows with AI and modern APIs."
publishedAt: "2026-11-15"
category: "Agency Automation"
author: "Md. Selim Reza"
tags: ["Automation", "Make.com", "AI Workflows"]
workflowTool: "Make.com"
featured: false
---

## Architecture Overview

Manual client onboarding creates operational friction, delays project kickoffs, and introduces human error during data entry. An automated pipeline solves this by transforming raw submission data into structured project assets in seconds.

The following architecture defines an end-to-end client onboarding pipeline built on **Make.com**, **OpenAI**, **Notion**, and **Slack**:

```
[ Form Submission / Webhook ]
            │
            ▼
[ Module 1: Webhook Listener & Payload Validation ]
            │
            ▼
[ Module 2: OpenAI API (JSON Mode Analysis & Task Generation) ]
            │
            ▼
[ Module 3: Notion API (Create Client Project & Sub-tasks) ]
            │
            ▼
[ Module 4: Slack & Email Dispatch (Notifications & Welcome Kit) ]
```

### Pipeline Flow Breakdown
1. **Input Trigger**: A custom webhook receives structured form submissions (e.g., Tally, Typeform, or custom web apps).
2. **Validation Layer**: Make.com filters invalid emails, formats input strings, and validates mandatory payload parameters.
3. **AI Data Processing**: OpenAI (`gpt-4o`) analyzes intake notes, categorizes project urgency, generates tailored onboarding checklists, and writes a draft welcome message.
4. **Data Storage & Sync**: The Notion API creates a main client page inside a central database and Populates relational sub-tasks automatically.
5. **Dispatch & Notification**: A personalized welcome email is dispatched to the client while an alert with a direct Notion link fires to the agency team Slack channel.

---

## Step 1: Setting Up the Trigger & Payload

To capture client intake data reliably, configure a Webhook module in Make.com. Using webhooks rather than polling app triggers minimizes latency and guarantees immediate execution upon form submission.

### Webhook Payload Schema

Configure your intake form or frontend to POST the following JSON schema to your Make.com custom webhook endpoint:

```json
{
  "event_type": "client_onboarding_submitted",
  "timestamp": "2026-11-15T09:30:00Z",
  "client": {
    "first_name": "Sarah",
    "last_name": "Jenkins",
    "email": "sarah.jenkins@acmehealth.com",
    "company_name": "Acme Health Technologies",
    "website": "https://acmehealth.com"
  },
  "project": {
    "service_tier": "Enterprise AI Strategy",
    "budget_allocated": 25000,
    "target_launch_date": "2026-12-15",
    "intake_notes": "We need an internal knowledge base assistant integrated with Slack and custom pipeline logic for patient intake categorization. High priority on HIPAA compliance guidelines."
  }
}
```

### Make.com Module Setup: Webhook Listener

1. Add a **Webhooks > Custom Webhook** module to your scenario.
2. Click **Add** to create a new hook named `Client Onboarding Intake`.
3. Copy the generated URL and send a test POST request using Postman, cURL, or your form builder to determine the data structure automatically.

```bash
curl -X POST https://hook.eu1.make.com/your-unique-webhook-id \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "client_onboarding_submitted",
    "client": {
      "first_name": "Sarah",
      "last_name": "Jenkins",
      "email": "sarah.jenkins@acmehealth.com",
      "company_name": "Acme Health Technologies"
    },
    "project": {
      "service_tier": "Enterprise AI Strategy",
      "intake_notes": "Needs HIPAA compliant AI assistant."
    }
  }'
```

4. Add a **Filter** immediately following the Webhook module to validate data integrity:
   - **Condition 1**: `client.email` **Text operator: Contains** `@`
   - **Condition 2**: `client.company_name` **Exists**

---

## Step 2: Processing Data with AI

Raw intake notes are often unstructured. We use OpenAI's API in **JSON Mode** to parse unstructured scope details into actionable task arrays and generate formatted deliverables for Notion.

### OpenAI Module Configuration

Add an **OpenAI (ChatGPT) > Create a Completion** module. Set the module settings as follows:

- **Model**: `gpt-4o`
- **Response Format**: `JSON Object`
- **Temperature**: `0.2` (low temperature ensures deterministic, consistent output)

### Prompt Engineering

#### System Prompt
```text
You are an expert technical project manager at a top-tier automation agency. 
Your task is to analyze client intake submissions and transform them into structured project initialization data.

You MUST respond strictly with a single, valid JSON object matching this schema:
{
  "executive_summary": "Concise 2-sentence summary of the project scope",
  "risk_assessment": "Low | Medium | High",
  "compliance_requirements": ["Array of detected compliance topics"],
  "custom_onboarding_tasks": [
    {
      "task_name": "Short task title",
      "category": "Technical Setup | Discovery | Compliance | Ops",
      "priority": "High | Medium | Low"
    }
  ],
  "client_welcome_email": "Formatted draft email body to send to client"
}
```

#### User Prompt (Dynamic Data Mapping)
```text
Analyze the following client intake data:

Company Name: {{1.client.company_name}}
Contact Name: {{1.client.first_name}} {{1.client.last_name}}
Service Tier: {{1.project.service_tier}}
Target Launch: {{1.project.target_launch_date}}
Raw Intake Notes: {{1.project.intake_notes}}
```

### Parsing JSON Output
Follow the OpenAI module with a **JSON > Parse JSON** module. Map the output string `choices[].message.content` into the Data Structure input field to extract typed variables for Notion creation.

---

## Step 3: Dispatch & CRM Sync

Once the data is parsed and structured, the pipeline writes records to Notion, notifies internal teams, and sends the client welcome materials.

```
[ Parse JSON ] 
      │
      ├──► [ Notion: Create Page in Clients DB ]
      │         │
      │         ▼
      │    [ Iterator: Create Notion Sub-tasks ]
      │
      ├──► [ Slack: Post Rich Notification Block ]
      │
      └──► [ Email: Send Custom Welcome Email ]
```

### 1. Creating the Primary Notion Page
Add a **Notion > Create a Database Item** module targeting your **Clients** Database. Map the properties as follows:

| Notion Database Property | Type | Mapping Source |
| :--- | :--- | :--- |
| **Client Name** | Title | `{{1.client.company_name}}` |
| **Primary Contact** | Text | `{{1.client.first_name}} {{1.client.last_name}}` |
| **Contact Email** | Email | `{{1.client.email}}` |
| **Status** | Select | `Onboarding` |
| **Service Tier** | Select | `{{1.project.service_tier}}` |
| **Risk Level** | Select | `{{2.risk_assessment}}` |
| **Executive Summary** | Text | `{{2.executive_summary}}` |

### 2. Creating Iterative Tasks in Notion
To create individual task items extracted by the AI:

1. Add an **Iterator** module.
2. Map the array `{{2.custom_onboarding_tasks}}` as the input array.
3. Attach a **Notion > Create a Database Item** module to the Iterator targeting the **Tasks** database.
4. Set the `Client Project` relation property to the **ID** of the page created in the previous Notion step.

### 3. Dispatching Notifications & Client Email

#### Slack Channel Alert
Add a **Slack > Create a Message** module using Block Kit for visual formatting:

```json
{
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "🚀 New Client Onboarded: {{1.client.company_name}}"
      }
    },
    {
      "type": "section",
      "fields": [
        {
          "type": "mrkdwn",
          "text": "*Tier:*\n{{1.project.service_tier}}"
        },
        {
          "type": "mrkdwn",
          "text": "*Risk Level:*\n{{2.risk_assessment}}"
        }
      ]
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Executive Summary:*\n{{2.executive_summary}}"
      }
    },
    {
      "type": "actions",
      "elements": [
        {
          "type": "button",
          "text": {
            "type": "plain_text",
            "text": "View Notion Workspace"
          },
          "url": "{{3.url}}"
        }
      ]
    }
  ]
}
```

#### Welcome Email Output
Add an **Email / Gmail / SendGrid** module to send the AI-crafted welcome email:
- **To**: `{{1.client.email}}`
- **Subject**: `Welcome to Agency Name - Getting Started with {{1.project.service_tier}}`
- **Body**: `{{2.client_welcome_email}}`

---

## JSON Blueprint Configuration

Below is a reference export representation of the scenario execution flow. You can import equivalent JSON structure logic into Make.com scenario builder:

```json
{
  "name": "Production Client Onboarding Pipeline",
  "modules": [
    {
      "id": 1,
      "module": "gateway:CustomWebhook",
      "version": 1,
      "parameters": {
        "hook": "client_intake_webhook"
      }
    },
    {
      "id": 2,
      "module": "openai-gpt:createCompletion",
      "version": 1,
      "parameters": {
        "model": "gpt-4o",
        "response_format": { "type": "json_object" }
      }
    },
    {
      "id": 3,
      "module": "json:ParseJSON",
      "version": 1
    },
    {
      "id": 4,
      "module": "notion:createADatabaseItem",
      "version": 2
    },
    {
      "id": 5,
      "module": "builtin:Iterator",
      "version": 1
    },
    {
      "id": 6,
      "module": "notion:createADatabaseItem",
      "version": 2
    },
    {
      "id": 7,
      "module": "slack:createMessage",
      "version": 1
    }
  ],
  "routes": [
    {
      "source": 1,
      "target": 2,
      "filter": {
        "name": "Validate Email",
        "formula": "contains(1.client.email; @)"
      }
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
    },
    {
      "source": 5,
      "target": 6
    },
    {
      "source": 4,
      "target": 7
    }
  ]
}
```

---

## Error Handling & Production Guidelines

Production-ready automations must gracefully handle external API outages, rate limits, and corrupted input data.

```
       [ Intake Webhook ]
               │
               ▼
   [ Data Validation Filter ] ──(Invalid Payload)──► [ Data Store / Log Error ]
               │
         (Valid Payload)
               │
               ▼
      [ OpenAI API Call ] ─────(429 / 5xx Error)───► [ Break Directive (Retry 3x) ]
               │
         (Success Output)
               │
               ▼
       [ Notion API Call ] ────(Rate Limit Error)───► [ Commit & Resume ]
```

### 1. Managing Rate Limits & API Quotas
- **Notion API Rate Limits**: Notion enforces an average limit of 3 requests per second. When running sub-task iterations using the **Iterator** module, insert a **Tools > Sleep** module set to `350 milliseconds` inside the loop to avoid triggering `HTTP 429 Too Many Requests`.
- **OpenAI Tier Limits**: Ensure your OpenAI account has sufficient credit reserves. If high processing traffic occurs, configure Make's module settings to use exponential backoff retry cycles.

### 2. Implementing Error Directives
Right-click critical modules in Make (OpenAI, Notion API) and configure error handlers:

- **Break Directive**: Attach an **Error handler > Break** directive to the OpenAI module. Set:
  - **Number of retries**: `3`
  - **Interval between attempts**: `1 minute`
  - This ensures that transient server errors (HTTP 500/503) do not drop execution data.
- **Commit / Fallback Directive**: If the optional email step fails, log the failed notification into a Make **Data Store** without rolling back the entire Notion database item creation.

### 3. Deduplication Logic
Prevent double submissions from firing duplicate setup pipelines:

1. Insert a **Data Store > Search Records** module before creating a Notion record.
2. Search by `client.email`.
3. Set a filter condition: **Only proceed if Total Number of Bundles equals 0**.
4. If a match is found, divert the route to append notes to the existing database record rather than creating a duplicate workspace entry.