---
title: "How to automate client onboarding using Make.com and Notion"
excerpt: "A complete step-by-step technical guide to automating workflows with AI and modern APIs."
publishedAt: "2026-11-21"
category: "Agency Automation"
author: "Md. Selim Reza"
tags: ["Automation", "Make.com", "AI Workflows"]
workflowTool: "Make.com"
featured: false
---

Manual client onboarding is one of the biggest operational bottlenecks for growing digital agencies and service businesses. Collecting client intake data, synthesizing kickoff summaries, setting up project hubs, and notifying key team members often takes anywhere from 60 to 90 minutes per client. 

By combining **Make.com**, **OpenAI**, and **Notion**, you can reduce this entire sequence to a zero-touch, automated pipeline that executes in less than 15 seconds.

In this technical guide, we will build an enterprise-grade client onboarding pipeline. This system accepts incoming intake form payloads, uses an LLM (Language Model) to analyze project requirements and generate structured kickoff metadata, provisions a dynamic Notion workspace page, and dispatches real-time alerts to your team.

---

## Architecture Overview

The automation architecture follows an event-driven design divided into four core stages: ingestion, validation & enrichment, persistence, and notification.

```
[ Intake Form Submission ]
           │
           ▼
[ Make.com Custom Webhook ] ──▶ [ JSON Payload Validation ]
                                          │
                                          ▼
                                [ OpenAI (GPT-4o) Engine ]
                                (Intelligent Synthesis & Formatting)
                                          │
                                          ▼
                                [ Notion Database Sync ]
                                (Page & Property Provisioning)
                                          │
                                          ▼
                                [ Multi-Channel Alerts ]
                                (Slack + Email Dispatch)
```

### Flow Breakdown
1. **Input Trigger**: A custom webhook receives incoming raw form submissions (e.g., Tally, Typeform, Webflow, or custom React apps).
2. **Data Validation**: Make.com filters invalid payloads, verifies structural integrity, and checks for duplicate client entries.
3. **AI Processing**: An OpenAI module processes raw intake answers to generate a structured executive summary, risk assessment score, recommended project milestones, and a personalized welcome draft.
4. **Data Storage & Sync**: The pipeline creates a new record in the primary Notion "Clients Database," setting properties (status, contacts, MRR, tags) and building out dynamic page body content (milestones, scopes, AI summary).
5. **Notification & Dispatch**: Synchronous notifications fire to Slack for internal team alerting, along with an automated welcome message sent to the client.

---

## Step 1: Setting Up the Trigger & Payload

We start by setting up a **Custom Webhook** module in Make.com. This acts as the secure endpoint for accepting intake data.

### 1. Webhook Setup
1. Log into your Make.com workspace and create a new Scenario.
2. Add a **Webhooks -> Custom Webhook** module as the trigger.
3. Click **Add**, name your webhook (e.g., `Client-Onboarding-Production-Webhook`), and copy the generated target URL.

### 2. Payload Schema
Ensure your incoming form sends a structured JSON payload. Below is the reference JSON schema expected by our pipeline:

```json
{
  "client_id": "cli_98472910",
  "company_name": "Apex Digital Labs",
  "primary_contact": {
    "full_name": "Sarah Connor",
    "email": "sarah@apexdigital.io",
    "role": "VP of Growth"
  },
  "package_tier": "Enterprise Retainer",
  "contract_value": 8500,
  "project_goals": "Scale paid acquisition channels and rebuild conversion funnel to achieve a 3.5x ROAS within Q1 2027.",
  "tech_stack": ["HubSpot", "Google Ads", "Shopify Plus"],
  "target_launch_date": "2027-01-15"
}
```

### 3. Basic Validation Filter
Directly following the Webhook module, add a **Router** or a **Filter** rule in Make.com to drop bad or malformed requests.

Set the Filter conditions:
* `primary_contact.email` **Exists**
* `primary_contact.email` **Contains** `@`
* `company_name` **Exists**

```
Condition Setup:
[1. primary_contact: email]  [ Text operators: Contains ]  @
AND
[1. company_name]            [ Basic operators: Exists ]
```

---

## Step 2: Processing Data with AI

Raw intake responses are rarely formatted cleanly for project management tracking. We run the payload through an OpenAI module using **Structured Outputs (JSON Schema)** to extract clear actionable intelligence before pushing data to Notion.

### 1. Module Configuration
Add the **OpenAI (ChatGPT) -> Create a Completion** module.

* **Model**: `gpt-4o` (or `gpt-4o-mini` for high-volume cost reduction)
* **Response Format**: `json_object`

### 2. System & User Prompting Strategy

Set the **System Prompt** to strictly define the expected structured format:

```text
You are an expert agency operations architect. Your task is to analyze client intake payloads and return a structured JSON response containing project analysis, risk scores, and initial kickoff milestones.

Return ONLY a valid JSON object matching this structural contract:
{
  "executive_summary": "string (max 3 sentences)",
  "risk_assessment_score": "Low | Medium | High",
  "risk_reasoning": "string",
  "recommended_milestones": [
    {
      "phase": "string",
      "days_to_complete": 7,
      "deliverable": "string"
    }
  ],
  "personalized_welcome_draft": "string"
}
```

Set the **User Prompt** dynamically referencing variables from Step 1:

```text
Analyze the following onboarding submission:

Company: {{1.company_name}}
Tier: {{1.package_tier}}
Contract Value: ${{1.contract_value}}
Primary Contact: {{1.primary_contact.full_name}} ({{1.primary_contact.role}})
Goals: {{1.project_goals}}
Tech Stack: {{join(1.tech_stack; ", ")}}
Target Launch: {{1.target_launch_date}}
```

---

## Step 3: Dispatch & CRM Sync

Once the incoming payload is parsed and enriched by AI, we update our CRM and workspace.

### 1. Notion Database Mapping
Add the **Notion -> Create a Database Item** module. Select your target Notion **Clients Database**.

Map your properties as follows:

| Notion Database Property | Input Field / Data Source |
| :--- | :--- |
| **Client Name** (Title) | `1.company_name` |
| **Status** (Select) | `Onboarding Pending` |
| **Contract Value** (Number) | `1.contract_value` |
| **Contact Email** (Email) | `1.primary_contact.email` |
| **Contact Name** (Text) | `1.primary_contact.full_name` |
| **Risk Level** (Select) | `2.risk_assessment_score` |
| **Intake Date** (Date) | `{{now}}` |

### 2. Generating Notion Page Content Blocks
To populate the body of the newly created Notion page, map the structured fields generated by OpenAI (`2.executive_summary`, `2.recommended_milestones`) inside the **Content** section of the Notion module.

Use Notion's block syntax or markdown-supported payload in Make:

```markdown
## Executive Summary
{{2.executive_summary}}

---

## Risk Assessment: {{2.risk_assessment_score}}
**Reasoning:** {{2.risk_reasoning}}

---

## Initial Project Milestones
{{#each 2.recommended_milestones}}
- [ ] **{{this.phase}}** (Target: {{this.days_to_complete}} days)  
  *Deliverable:* {{this.deliverable}}
{{/each}}
```

### 3. Slack Team Alert (Rich Block Format)
Add a **Slack -> Create a Message** module to notify your operations team.

```json
{
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "🚀 New Client Onboarded: {{1.company_name}}"
      }
    },
    {
      "type": "section",
      "fields": [
        {
          "type": "mrkdwn",
          "text": "*Tier:*\n{{1.package_tier}}"
        },
        {
          "type": "mrkdwn",
          "text": "*ARR/MRR Value:*\n${{1.contract_value}}"
        }
      ]
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*AI Summary:*\n{{2.executive_summary}}"
      }
    },
    {
      "type": "actions",
      "elements": [
        {
          "type": "button",
          "text": {
            "type": "plain_text",
            "text": "View in Notion"
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

Below is a complete Make.com Scenario JSON blueprint representation. You can import this definition into Make's scenario builder to auto-build the network layout.

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
      "module": "openai-gpt3:createCompletion",
      "version": 1,
      "parameters": {
        "model": "gpt-4o",
        "temperature": 0.2,
        "max_tokens": 1000
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
      "module": "notion:createDatabaseItem",
      "version": 2,
      "parameters": {
        "databaseId": "db_notion_client_database_id"
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
      "module": "slack:createPostMessage",
      "version": 1,
      "parameters": {
        "channelId": "C0123456789",
        "asUser": true
      },
      "metadata": {
        "designer": {
          "x": 900,
          "y": 0
        }
      }
    }
  ],
  "connections": [
    {
      "from": 1,
      "to": 2
    },
    {
      "from": 2,
      "to": 3
    },
    {
      "from": 3,
      "to": 4
    }
  ]
}
```

---

## Error Handling & Production Guidelines

Deploying automations for mission-critical client workflows requires resilient error handling patterns.

```
                  ┌────────────────────────┐
                  │    Webhook Input       │
                  └───────────┬────────────┘
                              │
                              ▼
                  ┌────────────────────────┐
                  │  Validate Input Payload│
                  └───────────┬────────────┘
                              │
                    ┌─────────┴─────────┐
             Valid  │                   │ Invalid
                    ▼                   ▼
          ┌───────────────────┐    ┌────────────────────┐
          │ Processing Engine │    │ Send Alert to Admin│
          └─────────┬─────────┘    └────────────────────┘
                    │
         ┌──────────┴──────────┐
   Success│                     │ Error / Rate Limit (429)
          ▼                     ▼
┌───────────────────┐  ┌───────────────────┐
│ Sync Notion & CRM │  │  Make.com Break   │
└───────────────────┘  │    Directive      │
                       │ (Retries 3x w/    │
                       │  Backoff Delay)   │
                       └───────────────────┘
```

### 1. Managing OpenAI Rate Limits (`429` & `5xx` Errors)
Place an **Error Handler -> Break** directive directly on the OpenAI module. 
* Set **Number of Retries** to `3`
* Set **Interval between attempts** to `1` minute
* This guarantees that if OpenAI experiences transient downtime or hits API rate limits, Make will buffer the execution in the Data Store and auto-retry without failing the pipeline.

### 2. Handling Duplicate Submissions
Prevent duplicate client records in Notion by adding a search module before record creation:
1. Insert **Notion -> Search Objects** before creating a new database item.
2. Filter search query: `Email EQUALS {{1.primary_contact.email}}`.
3. Set a filter route: **Only proceed with Creation if Search Result Count = 0**.
4. If a match exists, route to a **Notion -> Update Database Item** module instead.

### 3. Data Sanitization Rules
* **String Truncation**: Notion titles fail if strings exceed 2000 characters. Wrap long text inputs with the native function `{{substring(1.project_goals; 0; 1500)}}`.
* **Array Normalization**: If form users supply variable-length tags, use `{{join(1.tech_stack; ", ")}}` to prevent array mapping type errors.

### 4. Logging & Monitoring
Store failed webhooks in a persistent Make.com **Data Store** or stream execution logs to monitoring solutions like Datadog or Logtail via HTTP POST endpoints attached to an Error Directive path. This provides an audit trail for troubleshooting production incidents.