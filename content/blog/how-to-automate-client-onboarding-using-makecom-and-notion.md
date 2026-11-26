---
title: "How to automate client onboarding using Make.com and Notion"
excerpt: "A complete step-by-step technical guide to automating workflows with AI and modern APIs."
publishedAt: "2026-11-26"
category: "Agency Automation"
author: "Md. Selim Reza"
tags: ["Automation", "Make.com", "AI Workflows"]
workflowTool: "Make.com"
featured: false
---

Manual client onboarding is a growth bottleneck for modern digital agencies. Processing intake forms, manually provisioning client records in CRM systems, drafting customized welcome emails, and setting up project management dashboards consume valuable human hours that should be spent on execution.

In this tutorial, you will build an end-to-end, enterprise-ready client onboarding engine using **Make.com**, **OpenAI (GPT-4o)**, **Notion**, and **Slack**. 

---

## Architecture Overview

The system processes raw intake data, synthesizes it using an LLM, provisions structured relational pages in Notion, and notifies key stakeholders.

```
 [Client Form Submission] 
            │
            ▼
┌─────────────────────────┐
│  Make.com Webhook Node  │ ──► Data Validation & Sanitization
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   OpenAI API Module     │ ──► Structured Output Generation 
└───────────┬─────────────┘     (Task Breakdown & Email Draft)
            │
            ▼
┌─────────────────────────┐
│ Notion API Integration  │ ──► Create Client Hub & Sync Tasks
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Slack & Email Dispatch │ ──► Send Internal Alert & Client Email
└─────────────────────────┘
```

### Component Breakdown
1. **Input Trigger**: Custom Make.com Webhook receiving JSON payload from an intake form (e.g., Tally, Typeform, or custom app).
2. **Validation Layer**: Built-in Make.com data filters verifying email formats, non-empty fields, and payload integrity.
3. **AI Processing Engine**: OpenAI `gpt-4o` API using **Structured Outputs** (JSON Schema) to parse raw goals into actionable project milestones and welcome drafts.
4. **Data Storage & CRM**: Notion API creating a master database item in the "Clients" database along with populated metadata.
5. **Notification System**: Slack Webhook delivering rich-text Block Kit notifications to the account management team, plus automated email dispatch via Gmail/Resend.

---

## Step 1: Setting Up the Trigger & Payload

We start by capturing incoming data via a Make.com **Custom Webhook** module.

### 1. Webhook Setup
1. Create a new scenario in Make.com and add a **Webhooks -> Custom Webhook** node.
2. Name the webhook `Client Onboarding Intake Intake`.
3. Copy the generated URL and configure your form provider (or cURL script) to send a `POST` request to this endpoint.

### 2. Expected Input Payload Schema
Configure your form to send the following JSON payload structure:

```json
{
  "client_name": "Sarah Connor",
  "company_name": "Cyberdyne Systems",
  "email": "sconnor@cyberdyne.io",
  "tier": "Enterprise",
  "project_goals": "We need to rebrand our enterprise web application, migrate legacy docs to Notion, and scale lead intake using AI automations.",
  "target_kickoff": "2026-12-01"
}
```

### 3. Data Validation Filter
Place a Filter directly after the Webhook module in Make.com to prevent invalid API calls downstream:

* **Condition 1**: `email` **Contains** `@`
* **Condition 2**: `company_name` **Exists**
* **Condition 3**: `project_goals` **Length: Greater than** `20`

```
[Webhook Node] ─── (Filter: Valid Email & Company Exists) ───► [OpenAI Node]
```

---

## Step 2: Processing Data with AI

To make onboarding hyper-personalized, we route the raw `project_goals` through an OpenAI Chat Completion module. We enforce **Structured Outputs** (JSON Mode) to guarantee valid JSON formatting for Make.com to parse effortlessly.

### 1. Module Configuration
* **Module**: OpenAI (ChatGPT) -> Create a Completion
* **Model**: `gpt-4o`
* **Response Format**: `json_object`

### 2. System & User Prompt Engineering

#### System Prompt
```text
You are an Executive Project Manager at a top-tier digital operations agency. 
Your job is to analyze client intake submissions and transform messy goals into structured onboarding deliverables.

You MUST respond strictly with a valid JSON object adhering to this schema:
{
  "executive_summary": "string",
  "key_risks": ["string"],
  "initial_milestones": [
    {
      "task_name": "string",
      "owner_role": "string",
      "priority": "High" | "Medium" | "Low"
    }
  ],
  "personalized_welcome_email": "string"
}
```

#### User Prompt
```text
Analyze the following client intake submission:

- Client Name: {{1.client_name}}
- Company: {{1.company_name}}
- Tier: {{1.tier}}
- Stated Goals: {{1.project_goals}}

Generate the structured JSON response now.
```

---

## Step 3: Dispatch & CRM Sync

Once the AI node completes execution, parse the returned JSON string (if using raw API calls) or access the dynamic fields generated by Make.com’s native OpenAI module.

### 1. Notion Database Synchronization
Add the **Notion -> Create a Database Item** module.

#### Field Mapping Matrix
| Notion Property | Type | Mapping Value |
| :--- | :--- | :--- |
| **Client Name** | Title | `{{1.company_name}}` |
| **Primary Contact** | Email | `{{1.email}}` |
| **Contact Name** | Text | `{{1.client_name}}` |
| **Status** | Select | `Onboarding` |
| **Tier** | Select | `{{1.tier}}` |
| **Executive Summary** | Text | `{{2.choices[].message.content.executive_summary}}` |

#### Adding Content Blocks to Notion Page Body
Inside the Notion module's **Page Content** section, append custom Markdown blocks for the AI-generated milestones:

```markdown
## Executive Strategy Summary
{{2.choices[].message.content.executive_summary}}

## Recommended Kickoff Tasks
- [ ] {{2.choices[].message.content.initial_milestones[1].task_name}} (Priority: {{2.choices[].message.content.initial_milestones[1].priority}})
- [ ] {{2.choices[].message.content.initial_milestones[2].task_name}} (Priority: {{2.choices[].message.content.initial_milestones[2].priority}})
```

---

### 2. Team Slack Notification
Add a **Slack -> Create a Message** node to notify your account team instantly.

```json
{
  "text": "🚀 *New Client Onboarded: {{1.company_name}}*",
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*New Client Onboarded!*\n*Company:* {{1.company_name}}\n*Contact:* {{1.client_name}} ({{1.email}})\n*Tier:* {{1.tier}}"
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*AI Summary:*\n>{{2.choices[].message.content.executive_summary}}"
      }
    },
    {
      "type": "actions",
      "elements": [
        {
          "type": "button",
          "text": {
            "type": "plain_text",
            "text": "View Notion Hub"
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

Below is a production-grade Make.com scenario blueprint structure. You can save this block as a `.json` file and import it directly into your Make.com scenario workspace.

```json
{
  "name": "Production Client Onboarding Workflow",
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
      },
      "mapper": {
        "messages": [
          {
            "role": "system",
            "content": "You are a client onboarding assistant. Output strictly valid JSON."
          },
          {
            "role": "user",
            "content": "Analyze intake for {{1.company_name}}. Goals: {{1.project_goals}}"
          }
        ]
      }
    },
    {
      "id": 3,
      "module": "notion:createADatabaseItem",
      "version": 2,
      "parameters": {
        "database_id": "8a32f910-41bf-4b3e-9092-abcd1234efgh"
      },
      "mapper": {
        "properties": {
          "Name": { "title": [{ "text": { "content": "{{1.company_name}}" } }] },
          "Status": { "select": { "name": "Onboarding" } }
        }
      }
    },
    {
      "id": 4,
      "module": "slack:createAMessage",
      "version": 1,
      "parameters": {
        "channelType": "public",
        "channelId": "C0123456789"
      },
      "mapper": {
        "text": "New client onboarded: {{1.company_name}}"
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

To deploy this scenario at scale, implement robust error-handling procedures to ensure zero client data loss.

```
       [OpenAI Node]
             │
             ├── (Normal Flow) ──► [Notion Node]
             │
             └── (On Error: Rate Limit / Timeout)
                     │
                     ▼
             [Break Directive] ──► Retry 3x with Exponential Backoff
                     │
                     └── (If Failed) ──► [Fallback Slack Alert to #dev-ops]
```

### 1. Notion API Rate Limiting
Notion imposes an API rate limit of **3 requests per second**. 
* **Mitigation**: If processing bulk form inputs simultaneously, configure Make.com scenario settings to process transactions **one by one** (Set *Max number of cycles* = `1`).

### 2. Error Handler Directives
Attach a **Break** error handler to the OpenAI and Notion modules:
* **Automatically retry on error**: Enabled
* **Number of retries**: `3`
* **Interval between retries**: `5` minutes (Exponential Backoff enabled)

### 3. Data Idempotency
To avoid creating duplicate Notion entries if a user submits a form twice:
1. Insert a **Notion -> Search Objects** node before creation.
2. Query the database where `Email` equals `{{1.email}}`.
3. Add a router condition: Only proceed with item creation if the total returned records count equals `0`. Otherwise, update the existing record.