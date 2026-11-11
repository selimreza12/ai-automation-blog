---
title: "How to automate client onboarding using Make.com and Notio"
excerpt: "A complete step-by-step technical guide to automating workflows with AI and modern APIs."
publishedAt: "2026-11-11"
category: "Agency Automation"
author: "Md. Selim Reza"
tags: ["Automation", "Make.com", "AI Workflows"]
workflowTool: "Make.com"
featured: false
---

## Architecture Overview

Manual client onboarding creates operational bottlenecks, delays project kickoff times, and increases human error. By building an automated pipeline using **Make.com**, **OpenAI**, and **Notion**, agency teams can process intake forms, synthesize client requirements via AI, construct centralized workspace dashboards, and notify stakeholders in real time.

```
 [ Intake Form ] ---> [ Webhook Trigger ] ---> [ Data Validation Router ]
                                                     |
                                                     v
 [ Slack Alert ] <--- [ Notion DB Sync ] <--- [ OpenAI Analysis ]
```

### Key Workflow Components
1. **Input Trigger**: Custom Webhook receiving structured JSON payloads from form builders (e.g., Tally, Typeform, or custom web apps).
2. **Validation Engine**: Make.com filters verifying email formats, payload completeness, and security tokens.
3. **AI Processing Layer**: OpenAI API (GPT-4o) converting raw user submissions into structured project scopes, dynamic checklists, and executive summaries using JSON schema controls.
4. **Data Storage & Orchestration**: Notion API instantiating new Client CRM records, linking automated task databases, and rendering onboarding roadmaps.
5. **Notification Dispatch**: Webhook execution triggering instant Slack team updates and formatted client welcome emails.

---

## Step 1: Setting Up the Trigger & Payload

The onboarding pipeline starts with a raw JSON payload generated upon form submission. 

### Webhook Configuration
In Make.com, instantiate a custom **Webhooks -> Custom Webhook** module. Configure the webhook to enforce strict structure validation:

```json
{
  "client_name": "Acme Corp",
  "contact_person": "Jane Doe",
  "contact_email": "jane@acmecorp.com",
  "project_type": "Brand Redesign & Web Development",
  "budget": 15000,
  "raw_brief": "We need a complete overhaul of our visual identity and a migration to Next.js. Target launch is Q3. Current stack is WordPress."
}
```

### Validation & Schema Verification
Immediately following the Webhook module, insert a **Data Parser / Filter** step to sanitize input data before calling downstream APIs.

1. **Email Syntax Filter**: Validate standard email pattern `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`.
2. **Required Field Check**: Ensure `client_name` and `raw_brief` are non-empty strings.
3. **Budget Normalization**: Parse strings to numeric values using Make's built-in `parseNumber()` function to prevent typing mismatch errors in Notion.

---

## Step 2: Processing Data with AI

Raw onboarding briefs often lack structure. We use the **OpenAI API** module (`/v1/chat/completions`) with standard JSON output enforcement to parse unstructured intake descriptions into discrete deliverables.

### OpenAI Module Setup
* **Model**: `gpt-4o`
* **Response Format**: `{ "type": "json_object" }`
* **System Prompt**:

```text
You are an expert agency operations manager. Analyze incoming client intake briefs and output a structured JSON response containing:
1. Executive Summary (2-3 sentences)
2. Primary Project Goal
3. Inferred Deliverables List (array of strings)
4. Recommended Initial Onboarding Tasks (array of objects with title and priority)
```

### User Prompt Mapping
Map variables directly from your Webhook payload into the user message:

```text
Client Name: {{1.client_name}}
Project Type: {{1.project_type}}
Raw Brief: {{1.raw_brief}}
Budget: {{1.budget}}
```

### Structured Output Schema
The resulting JSON returned by OpenAI will follow a reliable structure:

```json
{
  "executive_summary": "Acme Corp is executing a modern visual identity overhaul and migrating their content site to Next.js before Q3.",
  "primary_goal": "Migrate from WordPress to Next.js with unified brand assets.",
  "deliverables": [
    "Brand Style Guide",
    "Figma UI Component Library",
    "Next.js Frontend Architecture",
    "Headless CMS Configuration"
  ],
  "initial_tasks": [
    { "task": "Schedule Architecture Discovery Call", "priority": "High" },
    { "task": "Set up shared Figma workspace", "priority": "Medium" },
    { "task": "Request access to legacy WordPress repository", "priority": "High" }
  ]
}
```

Parse this response using Make's native **JSON -> Parse JSON** module to enable dynamic data binding for subsequent steps.

---

## Step 3: Dispatch & CRM Sync

With structured data ready, the final phase provisions client environments and alerts the internal execution team.

```
       +---------------------------------------------+
       |           Make.com Workflow Sync             |
       +---------------------------------------------+
                              |
       +----------------------+----------------------+
       |                                             |
       v                                             v
[ Notion API ]                                [ Slack API ]
 - Create Page in Client Database              - Dispatch Channel Notification
 - Instantiate Sub-tasks                       - Direct Message Account Executive
 - Set Status to "Onboarding"
```

### 1. Notion Workspace Creation
Using the **Notion -> Create a Database Item** module, map the output properties to your primary **Clients** Database:

| Notion Field | Type | Mapped Value |
| :--- | :--- | :--- |
| **Client Name** | Title | `{{1.client_name}}` |
| **Primary Contact** | Text | `{{1.contact_person}} ({{1.contact_email}})` |
| **Project Status** | Select | `Onboarding Active` |
| **Budget** | Number | `{{1.budget}}` |
| **AI Brief Summary** | Rich Text | `{{3.executive_summary}}` |

### 2. Auto-Populating Sub-Tasks
Use Make’s **Iterator** module over the `initial_tasks` array generated by OpenAI. 

For each task element, execute a **Notion -> Create Page** module linked to the master **Tasks Database**, referencing the newly created Client Database ID as a relation.

### 3. Team Notification Setup
Integrate the **Slack -> Create a Message** module targeted at your `#client-onboarding` channel using standard Block Kit formatting:

```json
{
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*New Client Onboarded: {{1.client_name}}*\n*Contact:* {{1.contact_person}}\n*Scope Summary:* {{3.executive_summary}}"
      }
    },
    {
      "type": "actions",
      "elements": [
        {
          "type": "button",
          "text": { "type": "plain_text", "text": "Open Notion CRM Workspace" },
          "url": "{{4.url}}"
        }
      ]
    }
  ]
}
```

---

## JSON Blueprint Configuration

Below is a reference Make.com Scenario Blueprint snippet capturing the structural relationships between modules:

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
      "module": "json:ParseJSON",
      "version": 1,
      "parameters": {
        "type": "strict"
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
      "version": 2,
      "parameters": {
        "database_id": "db_notion_client_crm_production"
      }
    },
    {
      "id": 5,
      "module": "slack:postMessage",
      "version": 1,
      "parameters": {
        "channelType": "public",
        "channelId": "C0123456789"
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

Deploying webhooks and AI automations into live agency environments requires operational resilience.

### Rate Limiting & API Thresholds
* **Notion API Limits**: Notion enforces a baseline rate limit of 3 requests per second. When inserting multiple sub-tasks via an Iterator, insert a **Tools -> Sleep** delay (e.g., 400ms) within the loop to prevent `429 Too Many Requests` responses.
* **OpenAI Rate Limits**: Ensure your API key is tier-configured for adequate Requests Per Minute (RPM). Wrap the OpenAI module in a dedicated error-handling route.

### Robust Error Handlers
Attach an explicit **Break** error handler directive to the Notion and OpenAI modules:

```
[ Primary Module ] ---> (Error Trigger) ---> [ Error Handler Router ]
                                                     |
                                         +-----------+-----------+
                                         |                       |
                                         v                       v
                                  [ Retry / Break ]      [ Post to Slack #dev-alerts ]
```

1. **Break Directive**: Automatically attempts exponential backoff retries over set intervals (e.g., 1 min, 5 min, 15 min).
2. **Fallback Logging**: If the final retry attempt fails, route execution data into a fallback **Data Store** or log to a dedicated Slack `#dev-alerts` channel for manual human intervention.
3. **Data Integrity**: Utilize idempotent IDs (e.g., the original Webhook submission ID) across your database records to prevent duplicate client profile generation during retries.