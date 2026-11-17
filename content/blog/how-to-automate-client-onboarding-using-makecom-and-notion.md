---
title: "How to automate client onboarding using Make.com and Notio"
excerpt: "A complete step-by-step technical guide to automating workflows with AI and modern APIs."
publishedAt: "2026-11-17"
category: "Agency Automation"
author: "Md. Selim Reza"
tags: ["Automation", "Make.com", "AI Workflows"]
workflowTool: "Make.com"
featured: false
---

Manual client onboarding is one of the biggest friction points for growing agencies and SaaS operations. Collecting intake details, summarizing scope, setting up CRM records, creating tasks, and sending welcome messages manually eats up billable hours and delays time-to-value for the client.

In this tutorial, you will build an **automated client onboarding pipeline** using **Make.com**, **OpenAI (GPT-4o)**, and **Notion**. This end-to-end architecture ingests raw intake form submissions, uses AI to extract key insights and generate personalized onboarding checklists, writes the structured data to a Notion CRM workspace, and alerts your team via Slack.

---

## Architecture Overview

The system uses an event-driven architecture designed for high reliability, data integrity, and low latency.

```
[ Form Submission ] 
       │
       ▼
[ Webhook Trigger ] ──► [ Input Validation & Normalization ]
                                     │
                                     ▼
                        [ OpenAI GPT-4o Processing ]
                                     │
                        ┌────────────┴────────────┐
                        ▼                         ▼
            [ Notion Workspace Sync ]    [ Slack & Email Dispatch ]
```

### Flow Breakdown:
1. **Input Trigger**: A custom webhook catches payload events from your intake form (Tally, Typeform, or a custom Web React App).
2. **Validation & Normalization**: Make.com filters parse incoming variables, validating mandatory parameters (e.g., business email, budget, tech stack).
3. **AI Enrichment Layer**: Raw intake responses are passed to OpenAI. The LLM synthesizes an executive project brief, assigns a complexity score, and generates a tailored 5-step onboarding checklist.
4. **Data Storage (Notion)**: Structured JSON output from the AI is saved as a new Client Entry in your Notion CRM database with populated properties and page body checklists.
5. **Dispatch & Notifications**: An internal alert is dispatched to Slack (`#client-onboarding`), and a welcome email is sent to the client.

---

## Step 1: Setting Up the Trigger & Payload

To initiate the workflow, set up a **Custom Webhook** module in Make.com to serve as the entry listener.

### 1. Configure the Webhook Listener
1. In Make.com, create a new scenario and add the **Webhooks > Custom Webhook** module.
2. Click **Add**, name your webhook `Client Intake Receiver`, and copy the generated HTTP URL.
3. Post a sample payload to this endpoint using curl or Postman to determine the data structure.

### 2. Sample Incoming JSON Payload
```json
{
  "client_name": "Acme Corp",
  "contact_person": "Jane Doe",
  "contact_email": "jane@acmecorp.com",
  "project_scope": "We need to migrate our legacy web app to Next.js and integrate modern payment pipelines via Stripe.",
  "budget": "$15,000 - $25,000",
  "timeline": "6 Weeks",
  "tech_stack": ["React", "Node.js", "PostgreSQL"]
}
```

### 3. Data Parsing & Filtering
Immediately following the Webhook trigger, place a **Filter** to stop invalid submissions:

* **Condition 1**: `contact_email` *Contains* `@`
* **Condition 2**: `client_name` *Exists*
* **Condition 3**: `project_scope` *Length > 20 characters*

This guarantees downstream modules (OpenAI/Notion) only consume validated data, preventing wasted API units.

---

## Step 2: Processing Data with AI

Raw client inputs are often unstructured. We will use the **OpenAI (ChatGPT) > Create a Completion (Prompt Handler)** module with structured outputs to process the intake data into operational tasks.

### 1. System & User Prompt Design

Configure the OpenAI module using the `gpt-4o` model.

**System Prompt:**
```text
You are an expert Operations Lead at a technical agency. Your job is to analyze client intake submissions and transform raw requirements into structured execution briefs. 
Output your analysis exclusively in clean, valid JSON matching the requested schema.
```

**User Prompt:**
```text
Analyze the following client intake submission and return a structured JSON response.

Input Details:
- Company Name: {{1.client_name}}
- Contact Person: {{1.contact_person}}
- Project Scope: {{1.project_scope}}
- Tech Stack: {{1.tech_stack}}
- Budget: {{1.budget}}

Requirements:
1. Create a 2-sentence executive summary.
2. Determine project complexity level (Low, Medium, High).
3. Generate a 5-step concrete onboarding checklist tailored to this project's technical scope.
```

### 2. Structured JSON Output Schema
Set the response format to `json_object` or utilize Structured Outputs:

```json
{
  "summary": "Acme Corp requires a modern web application migration from legacy architecture to Next.js with integrated Stripe payments.",
  "complexity": "High",
  "checklist": [
    "Obtain read access to the existing legacy GitHub repository.",
    "Request API keys for the Stripe Sandbox environment.",
    "Schedule a 45-minute technical discovery session with Jane Doe.",
    "Set up a dedicated Next.js development environment.",
    "Draft the initial system architecture diagram for approval."
  ]
}
```

---

## Step 3: Dispatch & CRM Sync

Once the JSON structure is parsed using Make.com's **Parse JSON** module, the downstream applications are updated simultaneously using a **Router**.

```
               ┌──► [ Module: Notion - Create Database Item ]
[ Router ] ────┼──► [ Module: Slack - Create Block Message ]
               └──► [ Module: Email - Send Welcome Email ]
```

### 1. Notion Database Mapping
Add the **Notion > Create a Database Item** module and configure the mapping:

* **Database**: `Clients Database`
* **Properties**:
  * `Client Name` (Title) ➔ `{{1.client_name}}`
  * `Primary Contact` (Text) ➔ `{{1.contact_person}}`
  * `Email` (Email) ➔ `{{1.contact_email}}`
  * `Complexity` (Select) ➔ `{{3.complexity}}`
  * `Status` (Select) ➔ `Onboarding In-Progress`
  * `Executive Summary` (Text) ➔ `{{3.summary}}`

**Page Content Body:**
Format the generated array output into Notion bullet points or checklist blocks:
```text
### Onboarding Action Items
- [ ] {{3.checklist[1]}}
- [ ] {{3.checklist[2]}}
- [ ] {{3.checklist[3]}}
- [ ] {{3.checklist[4]}}
- [ ] {{3.checklist[5]}}
```

### 2. Team Slack Notification
Add the **Slack > Create a Message** module targeted at `#client-onboarding`:

```markdown
🚨 *New Client Onboarded: {{1.client_name}}*
*Contact:* {{1.contact_person}} ({{1.contact_email}})
*Complexity:* `{{3.complexity}}`

*Executive Summary:*
>{{3.summary}}

📌 *View in Notion:* <{{4.url}}|Open Client Portal>
```

---

## JSON Blueprint Configuration

Below is a complete Make.com scenario blueprint JSON outline that reflects this pipeline. You can import this definition directly into your Make scenario editor.

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
        "messages": [
          {
            "role": "system",
            "content": "You are an AI assistant that extracts structured project scope in JSON."
          },
          {
            "role": "user",
            "content": "Analyze: {{1.project_scope}}"
          }
        ],
        "response_format": { "type": "json_object" }
      }
    },
    {
      "id": 3,
      "module": "json:ParseJSON",
      "version": 1,
      "parameters": {
        "json": "{{2.choices[].message.content}}"
      }
    },
    {
      "id": 4,
      "module": "notion:createADatabaseItem",
      "version": 2,
      "parameters": {
        "databaseId": "db_notion_client_crm",
        "properties": {
          "Name": { "title": [{ "text": { "content": "{{1.client_name}}" } }] },
          "Status": { "select": { "name": "Onboarding" } },
          "Summary": { "rich_text": [{ "text": { "content": "{{3.summary}}" } }] }
        }
      }
    },
    {
      "id": 5,
      "module": "slack:createAMessage",
      "version": 1,
      "parameters": {
        "channel": "C012345678",
        "message": "New onboarding request from {{1.client_name}} processed successfully."
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
```

---

## Error Handling & Production Guidelines

To deploy this scenario safely in a production environment, implement the following error handling patterns:

### 1. API Rate Limiting & Timeouts
* **OpenAI Limits**: GPT-4o standard tier can hit TPM (Tokens Per Minute) limits during peak traffic. Attach a **Break Error Handler** to the OpenAI module to automatically retry requests using exponential backoff (e.g., retry 3 times at 1-, 5-, and 15-minute intervals).
* **Notion API Thresholds**: The Notion API allows up to **3 requests per second**. If you process batch submissions, set the Make.com scenario execution to **Sequential** (1 item at a time) rather than concurrent processing.

### 2. Edge Case Routing
* **Non-JSON LLM Output**: OpenAI may occasionally return malformed Markdown around the JSON object. Append a regex module `replace(2.content; "/```json|```/g"; "")` before parsing to ensure robust JSON deserialization.
* **Missing Contact Info**: Connect an **Ignore Error Handler** or secondary **Fallback Direct Email Module** to trigger if mandatory form values fail validation checks.

### 3. Security Considerations
* Do not pass sensitive client credentials (API keys, SSH credentials) directly through webhook text inputs. Require clients to submit secrets via secured password management tools like 1Password or Bitwarden links.
* Restrict the Notion API Integration key to read/write access strictly within the designated **Clients Database** rather than workspace-wide permissions.