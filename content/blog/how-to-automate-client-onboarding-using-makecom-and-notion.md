---
title: "How to automate client onboarding using Make.com and Notio"
excerpt: "A complete step-by-step technical guide to automating workflows with AI and modern APIs."
publishedAt: "2026-11-08"
category: "Agency Automation"
author: "Md. Selim Reza"
tags: ["Automation", "Make.com", "AI Workflows"]
workflowTool: "Make.com"
featured: false
---

Manual client onboarding is one of the biggest friction points for growing agencies and software consultancies. Gathering raw intake form data, summarizing client requirements, setting up CRM records, and pinging internal team members often takes 30 to 60 minutes per client. 

By combining **Make.com**, **OpenAI**, and **Notion**, you can create a zero-touch onboarding pipeline that ingests client requests, uses AI to parse scope and generate actionable tasks, creates structured database records in Notion, and notifies your team in real time.

---

## Architecture Overview

The automation architecture follows a linear pipeline designed for low latency, fault tolerance, and deterministic outputs.

```
[ Form / Webhook ] 
       │
       ▼
[ Make.com Custom Webhook ] ──▶ [ Payload Validation & Parsing ]
                                             │
                                             ▼
                                 [ OpenAI GPT-4o Module ]
                                 (Summarization & Schema Parsing)
                                             │
                                             ▼
                                 [ Notion API Integration ]
                                 (Create Workspace & Tasks)
                                             │
                                             ▼
                                 [ Slack / Email Notification ]
```

1. **Input Trigger**: A custom HTTP Webhook (triggered via Tally, Typeform, Webflow, or an app backend) accepts raw onboarding submissions.
2. **Data Validation**: Make filters out incomplete or malformed requests before calling downstream paid APIs.
3. **AI Processing**: An OpenAI module (`gpt-4o`) evaluates unstructured text fields, outputs structured JSON containing an executive summary, risk score, and key milestones.
4. **CRM & Portal Sync**: Make writes directly to a centralized Notion database using the Notion REST API, creating a master page along with structured task blocks.
5. **Team Dispatch**: The pipeline fires a formatted notification to a designated Slack channel containing direct links to the new Notion dashboard.

---

## Step 1: Setting Up the Trigger & Payload

We start by establishing a **Custom Webhook** module inside Make.com to serve as our API endpoint.

### 1. Payload Definition
Ensure your client intake form sends a predictable JSON payload. Below is the reference JSON structure for incoming client data:

```json
{
  "submission_id": "sub_987654321",
  "submitted_at": "2026-11-08T10:15:30Z",
  "client_info": {
    "company_name": "Acme Dynamics",
    "primary_contact": "Sarah Jenkins",
    "contact_email": "s.jenkins@acmedynamics.io",
    "tier": "Enterprise"
  },
  "project_scope": {
    "raw_brief": "We need an enterprise automated support pipeline connecting Zendesk, Slack, and our custom Postgres database. Target launch is within 6 weeks.",
    "estimated_budget": 25000,
    "tech_stack": ["PostgreSQL", "Slack API", "Zendesk"]
  }
}
```

### 2. Setting Up the Webhook in Make.com
1. Add a **Webhooks > Custom Webhook** module to your Make scenario.
2. Click **Add** to create a new webhook instance named `Client Onboarding Intake`.
3. Copy the generated webhook URL.
4. Send a test `POST` request (using Postman or `curl`) containing the sample payload above to establish the data schema inside Make:

```bash
curl -X POST https://hook.eu1.make.com/your-unique-webhook-id \
  -H "Content-Type: application/json" \
  -d '{
    "submission_id": "sub_987654321",
    "submitted_at": "2026-11-08T10:15:30Z",
    "client_info": {
      "company_name": "Acme Dynamics",
      "primary_contact": "Sarah Jenkins",
      "contact_email": "s.jenkins@acmedynamics.io",
      "tier": "Enterprise"
    },
    "project_scope": {
      "raw_brief": "We need an enterprise automated support pipeline connecting Zendesk, Slack, and our custom Postgres database. Target launch is within 6 weeks.",
      "estimated_budget": 25000,
      "tech_stack": ["PostgreSQL", "Slack API", "Zendesk"]
    }
  }'
```

### 3. Payload Validation (Filter Step)
Directly after the Webhook module, add a **Make Filter** named `Validate Payload` to prevent empty runs or bad data from consuming API tokens downstream:

- **Condition 1**: `client_info.contact_email` **Contains** `@`
- **Condition 2**: `client_info.company_name` **Exists**
- **Condition 3**: `project_scope.raw_brief` **Length >** `20`

---

## Step 2: Processing Data with AI

To translate messy, unstructured user input into a standardized project outline, we route the validated payload into an **OpenAI (ChatGPT)** module.

### Module Configuration
* **Module**: OpenAI -> Create a Completion (v1/chat/completions)
* **Model**: `gpt-4o`
* **Response Format**: `JSON Object`

### System Prompt
```text
You are an expert technical project manager automating client onboarding.
Your task is to take raw project brief data and transform it into a structured execution plan.

OUTPUT FORMAT REQUIREMENTS:
You MUST respond with valid JSON adhering strictly to this structure:
{
  "executive_summary": "string (max 3 sentences)",
  "complexity_score": "Low | Medium | High",
  "risk_factors": ["array of strings"],
  "milestones": [
    {
      "title": "string",
      "estimated_days": number,
      "owner_role": "Solutions Architect | Automation Engineer | Account Manager"
    }
  ]
}
```

### User Prompt Mapping
Pass the variables captured by your Make Webhook module into the user prompt:

```text
Process the following incoming client request:

- Company Name: {{1.client_info.company_name}}
- Tier: {{1.client_info.tier}}
- Raw Brief: {{1.project_scope.raw_brief}}
- Tech Stack: {{join(1.project_scope.tech_stack; ", ")}}
```

### Parsing the Output
Using OpenAI's `response_format: { "type": "json_object" }`, the output dynamically parses into downstream Make variables. 

Example parsed AI payload:

```json
{
  "executive_summary": "Acme Dynamics requires a multi-platform support integration across Zendesk, Slack, and PostgreSQL. Target timeline is aggressive at 6 weeks for an enterprise deployment.",
  "complexity_score": "High",
  "risk_factors": [
    "Tight 6-week timeline for enterprise security clearance.",
    "Custom PostgreSQL integration may require complex error handling."
  ],
  "milestones": [
    {
      "title": "Database Schema Audit & API Auth setup",
      "estimated_days": 5,
      "owner_role": "Solutions Architect"
    },
    {
      "title": "Zendesk-Slack Webhook Pipeline Development",
      "estimated_days": 10,
      "owner_role": "Automation Engineer"
    }
  ]
}
```

---

## Step 3: Dispatch & CRM Sync

Once the data is enriched, Make sends the structured record to **Notion** and alerts the team via **Slack**.

```
[ OpenAI JSON Output ] ──▶ [ Notion: Create Page ] ──▶ [ Slack: Post Message ]
```

### 1. Notion API Setup & Mapping
Add the **Notion > Create a Database Item** module.

* **Database**: Select your master `Clients` Database.
* **Fields Mapping**:

| Notion Property | Data Type | Value Source (Make Variables) |
| :--- | :--- | :--- |
| **Client Name** | Title | `{{1.client_info.company_name}}` |
| **Contact Email** | Email | `{{1.client_info.contact_email}}` |
| **Status** | Select | `Onboarding` |
| **Tier** | Select | `{{1.client_info.tier}}` |
| **Complexity** | Select | `{{2.json.complexity_score}}` |
| **Budget** | Number | `{{1.project_scope.estimated_budget}}` |

#### Adding Child Page Content (Notion Blocks)
Under **Content**, append the executive summary and risk assessment directly to the body of the newly created Notion page:

```markdown
## Executive Summary
{{2.json.executive_summary}}

## Risk Analysis
{{join(2.json.risk_factors; "\n- ")}}

## Action Items
* [ ] Kickoff call scheduled with {{1.client_info.primary_contact}}
* [ ] Technical specification document reviewed
```

### 2. Team Notification Dispatch
Add a **Slack > Create a Message** module to alert your delivery team.

* **Channel**: `#client-onboarding`
* **Message Payload (Markdown/Mrkdwn)**:

```markdown
🚨 *New Client Onboarded: {{1.client_info.company_name}}*

• *Tier:* {{1.client_info.tier}}
• *Budget:* ${{1.project_scope.estimated_budget}}
• *Complexity:* {{2.json.complexity_score}}
• *Primary Contact:* {{1.client_info.primary_contact}} ({{1.client_info.contact_email}})

📝 *Executive Summary:*
>{{2.json.executive_summary}}

🔗 <{{3.url}}|Open Client Page in Notion>
```

---

## JSON Blueprint Configuration

Below is a representative JSON export of the scenario logic. You can import this structural overview into Make or use it to programmatically build scenario configurations via the Make API.

```json
{
  "name": "Production Onboarding Pipeline - Make to Notion",
  "modules": [
    {
      "id": 1,
      "module": "gateway:CustomWebhook",
      "version": 1,
      "parameters": {
        "hook": 123456,
        "maxResults": 1
      },
      "name": "Client Intake Form Webhook"
    },
    {
      "id": 2,
      "module": "openai-gpt3:createChatCompletion",
      "version": 1,
      "parameters": {
        "model": "gpt-4o",
        "response_format": { "type": "json_object" },
        "temperature": 0.2
      },
      "filter": {
        "name": "Ensure valid email and scope",
        "formula": "{{contains(1.client_info.contact_email; \"@\") && length(1.project_scope.raw_brief) > 20}}"
      },
      "name": "Parse Scope with GPT-4o"
    },
    {
      "id": 3,
      "module": "notion:createDatabaseItem",
      "version": 2,
      "parameters": {
        "databaseId": "db_notion_client_crm_id"
      },
      "name": "Create Notion Record"
    },
    {
      "id": 4,
      "module": "slack:postMessage",
      "version": 1,
      "parameters": {
        "channel": "C012345678",
        "as_user": true
      },
      "name": "Notify Internal Slack Channel"
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
    }
  ]
}
```

---

## Error Handling & Production Guidelines

Production workflows must be resilient against API downtime, invalid user submissions, and rate limits.

```
                  ┌─── [Success] ──▶ [ Notion ] ──▶ [ Slack ]
                  │
[ OpenAI Module ] ┤
                  │                  ┌─── [Retry Success] ──▶ Continue
                  └─── [Error 429] ──┤
                                     └─── [Exhausted] ──▶ [ Fallback Alert ]
```

### 1. Handling API Rate Limits
* **Notion API Rate Limits**: The Notion API enforces a strict rate limit of **3 requests per second**. If you process batch onboarding events, add a **Tools > Sleep** module set to `1000ms` between iterations inside a repeater array.
* **OpenAI Rate Limits**: Configure exponential backoff on your OpenAI module by enabling **Auto-commit on error = No** and attaching an **Error Handler Directive**.

### 2. Strategic Error Handler Directives in Make
Attach an **Error Handler Route** to critical API steps (OpenAI and Notion):

1. **Break Module (Retry Directive)**:
   * **Number of attempts**: `3`
   * **Interval between attempts**: `1 minute`
   * Attach this to the **OpenAI** and **Notion** modules to handle transient 502/503 HTTP server errors automatically.
2. **Fallback / Commit Route**:
   * If OpenAI fails after 3 retries, route execution to a **Fallback Notion Page Creation** step that writes the raw payload text into Notion without AI metadata, preserving client data without breaking the execution pipeline.

### 3. Data Sanitization & Security
* **Input Injection Defense**: Never trust raw text fields inside LLM prompts. Always enclose incoming user content in explicit XML or markdown boundary quotes (e.g., `<user_input>{{1.project_scope.raw_brief}}</user_input>`).
* **PII Governance**: Avoid logging sensitive access credentials or payment details directly into Make execution histories. Set sensitive data variables to **Do not store log values** within the Webhook module parameters.