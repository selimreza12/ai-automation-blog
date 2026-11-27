---
title: "How to automate client onboarding using Make.com and Notio"
excerpt: "A complete step-by-step technical guide to automating workflows with AI and modern APIs."
publishedAt: "2026-11-27"
category: "Agency Automation"
author: "Md. Selim Reza"
tags: ["Automation", "Make.com", "AI Workflows"]
workflowTool: "Make.com"
featured: false
---

## Architecture Overview

Manual client onboarding causes bottlenecks, slow response times, and inconsistent client experiences. By pairing **Make.com** as an orchestration engine, **AI (OpenAI API)** for intelligence, and **Notion** as a dynamic CRM, you can build a zero-touch onboarding pipeline.

The architecture follows an event-driven model:

```
[ Ingestion Layer ]        [ Data Validation & AI ]       [ Persistence Layer ]       [ Notification Layer ]
+-------------------+      +----------------------+      +--------------------+      +--------------------+
| Typeform /        | ---> | Make Router          | ---> | Notion API         | ---> | Slack / Email      |
| Custom Webhook    |      | Data Sanitization    |      | (Client & Project  |      | Dispatch           |
+-------------------+      | OpenAI (GPT-4o)      |      | Database Sync)     |      +--------------------+
                           +----------------------+      +--------------------+
```

### Flow Breakdown:
1. **Input Trigger**: A client completes an intake form (Typeform, Tally, or Custom Webhook).
2. **Validation & Router**: Make.com captures the raw payload, validates required fields, sanitizes inputs, and checks for existing client records.
3. **AI Enhancement**: OpenAI's API parses unformatted project scopes, generates milestone tasks, categorizes risk levels, and drafts personalized welcome communications.
4. **Data Storage**: Notion API creates relational database records (Client Workspace, Project Dashboard, and Actionable Tasks).
5. **Notification Engine**: Slack triggers an internal alert while Gmail/SendGrid dispatches a personalized onboarding package to the client.

---

## Step 1: Setting Up the Trigger & Payload

The onboarding flow begins when a prospective client submits an intake form. We will capture this via a Make **Custom Webhook** module to handle structured payloads.

### 1. Payload Definition
Configure your front-end intake tool to send a POST request with the following JSON structure:

```json
{
  "client_name": "Sarah Jenkins",
  "company_name": "Apex Digital Corp",
  "email": "sarah@apexdigital.com",
  "budget": 15000,
  "project_type": "Custom Enterprise Software",
  "project_description": "We need an internal dashboard to monitor logistics across 4 fulfillment centers. Key requirements: real-time inventory tracking, Shopify sync, and automated SMS alerts.",
  "start_date": "2026-12-01"
}
```

### 2. Make.com Webhook Setup
1. Add a **Custom Webhook** module as the trigger.
2. Click **Add**, name it `Client Intake Webhook`, and copy the generated URL.
3. Send a test `POST` payload using Postman or `curl` to determine the data structure automatically:

```bash
curl -X POST https://hook.eu1.make.com/your-unique-webhook-id \
  -H "Content-Type: application/json" \
  -d '{
    "client_name": "Sarah Jenkins",
    "company_name": "Apex Digital Corp",
    "email": "sarah@apexdigital.com",
    "budget": 15000,
    "project_type": "Custom Enterprise Software",
    "project_description": "We need an internal dashboard to monitor logistics across 4 fulfillment centers.",
    "start_date": "2026-12-01"
  }'
```

### 3. Input Validation Engine
Place a **Filter** immediately after the webhook trigger to drop invalid submissions before running upstream workflows.

* **Filter Name**: `Validate Payload`
* **Condition 1**: `1.email` **Contains** `@`
* **Condition 2**: `1.company_name` **Exists**
* **Condition 3**: `1.budget` **Greater than or equal to** `5000`

---

## Step 2: Processing Data with AI

Raw intake text is often unstructured. We use the **OpenAI (Create a Response / Chat Completion)** module in Make.com using JSON Mode to produce deterministic, structured outputs.

### 1. Model Configuration
* **Module**: OpenAI - Create a Completion
* **Model**: `gpt-4o`
* **Response Format**: `{ "type": "json_object" }`

### 2. Prompt Architecture

#### System Prompt
```text
You are an expert agency operations architect. Your task is to extract structured project metadata, break down raw intake details into actionable milestones, assess risk, and generate structured client communications. 
You MUST respond strictly with a valid JSON object matching the requested schema.
```

#### User Prompt (Injected with Webhook variables)
```text
Process the following client intake submission:

Client: {{1.client_name}}
Company: {{1.company_name}}
Project Type: {{1.project_type}}
Budget: ${{1.budget}}
Scope Description: {{1.project_description}}

Generate a JSON object with this exact key structure:
{
  "summary": "Concise executive summary (2 sentences)",
  "risk_assessment": "Low" | "Medium" | "High",
  "key_deliverables": ["Deliverable 1", "Deliverable 2", "Deliverable 3"],
  "milestones": [
    {"task": "Task name", "phase": "Discovery" | "Development" | "Deployment", "estimated_days": 3}
  ],
  "personalized_email_body": "Professional email body welcoming the client and explaining next steps."
}
```

### 3. Parsing JSON Output
Follow the OpenAI module with a **Parse JSON** module (or leverage native mapping if using OpenAI Structured Outputs) to convert the AI response string into queryable Make.com variables:

```json
{
  "summary": "Apex Digital Corp requires a custom logistics internal dashboard integrating real-time inventory and Shopify sync across 4 fulfillment centers.",
  "risk_assessment": "Low",
  "key_deliverables": [
    "Shopify Integration Layer",
    "Multi-Fulfillment Center Dashboard UI",
    "Automated SMS Alert System"
  ],
  "milestones": [
    {
      "task": "Architecture Discovery & API Audits",
      "phase": "Discovery",
      "estimated_days": 5
    },
    {
      "task": "Shopify API & Database Schema Setup",
      "phase": "Development",
      "estimated_days": 10
    }
  ],
  "personalized_email_body": "Hi Sarah,\n\nWelcome aboard! We are thrilled to partner with Apex Digital Corp..."
}
```

---

## Step 3: Dispatch & CRM Sync

Once data is processed by the AI module, we sync records into Notion and trigger targeted alerts.

### 1. Notion Relational Schema Setup
Ensure your Notion workspace contains two linked databases:
* **Clients Database**: Key fields (`Company Name`, `Client Name`, `Email`, `Budget`, `Status`, `Risk Level`, `Summary`).
* **Tasks Database**: Key fields (`Task Name`, `Phase`, `Status`, `Client Relation`).

```
+------------------------------------+       +------------------------------------+
|         CLIENTS DATABASE           |       |           TASKS DATABASE           |
+------------------------------------+       +------------------------------------+
| Company Name (Title)               | 1   N | Task Name (Title)                  |
| Email (Email)                      |------>| Phase (Select)                     |
| Risk Level (Select)                |       | Status (Status)                    |
| Summary (Text)                     |       | Client (Relation -> Clients DB)    |
+------------------------------------+       +------------------------------------+
```

### 2. Module Setup: Notion - Create a Database Item (Client Master)
* **Database ID**: Select your `Clients Database`
* **Fields Mapping**:
  * **Company Name**: `{{1.company_name}}`
  * **Client Name**: `{{1.client_name}}`
  * **Email**: `{{1.email}}`
  * **Budget**: `{{1.budget}}`
  * **Status**: `Onboarding`
  * **Risk Level**: `{{2.risk_assessment}}`
  * **Summary**: `{{2.summary}}`

### 3. Module Setup: Iterator & Notion Task Sync
To populate tasks inside Notion dynamically:
1. Insert an **Iterator** module.
2. **Array**: `{{2.milestones}}`
3. Connect the Iterator to a **Notion - Create a Database Item** module (Target: `Tasks Database`).
4. **Fields Mapping**:
   * **Task Name**: `{{3.value.task}}`
   * **Phase**: `{{3.value.phase}}`
   * **Status**: `Not Started`
   * **Client Relation**: `[{{4.id}}]` *(ID returned by the Client Master Notion module)*

### 4. Client Notification Dispatch (Gmail/SendGrid)
Add a **Gmail - Send an Email** module to deliver the generated response directly to the client:
* **To**: `{{1.email}}`
* **Subject**: `Welcome to the Onboarding Phase | {{1.company_name}}`
* **Body**: `{{2.personalized_email_body}}`

### 5. Team Alert (Slack Module)
Send a structured block payload to your internal ops channel:

```json
{
  "text": "🚀 *New Client Onboarded!*",
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Client:* {{1.company_name}} ({{1.client_name}})\n*Budget:* ${{1.budget}}\n*Risk Level:* {{2.risk_assessment}}"
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Summary:* {{2.summary}}"
      }
    }
  ]
}
```

---

## JSON Blueprint Configuration

Import this blueprint structure into Make.com to instantiate the base pipeline:

```json
{
  "name": "Automated Client Onboarding Pipeline",
  "modules": [
    {
      "id": 1,
      "module": "gateway:CustomWebhook",
      "version": 1,
      "parameters": {
        "hook": 12345,
        "maxResults": 1
      }
    },
    {
      "id": 2,
      "module": "openai-gpt3:createChatCompletion",
      "version": 1,
      "parameters": {
        "model": "gpt-4o",
        "temperature": 0.2
      },
      "mapper": {
        "messages": [
          {
            "role": "system",
            "content": "You are an AI operational assistant. Extract structured JSON onboarding metrics."
          },
          {
            "role": "user",
            "content": "Process: {{1.project_description}}"
          }
        ],
        "response_format": { "type": "json_object" }
      }
    },
    {
      "id": 3,
      "module": "notion:createADatabaseItem",
      "version": 2,
      "parameters": {
        "databaseId": "0a1b2c3d4e5f"
      },
      "mapper": {
        "properties": {
          "Company Name": { "title": [{ "text": { "content": "{{1.company_name}}" } }] },
          "Status": { "select": { "name": "Onboarding" } },
          "Risk": { "select": { "name": "{{2.risk_assessment}}" } }
        }
      }
    },
    {
      "id": 4,
      "module": "builtin:Iterator",
      "version": 1,
      "mapper": {
        "array": "{{2.milestones}}"
      }
    },
    {
      "id": 5,
      "module": "notion:createADatabaseItem",
      "version": 2,
      "parameters": {
        "databaseId": "9f8e7d6c5b4a"
      },
      "mapper": {
        "properties": {
          "Task Name": { "title": [{ "text": { "content": "{{4.value.task}}" } }] },
          "Client": { "relation": [{ "id": "{{3.id}}" }] }
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

Building reliable workflows requires handling API failures, unexpected payloads, and rate limits gracefully.

### 1. Handling API Rate Limits & Backoff
* **OpenAI API Rate Limits (429 Errors)**: Set up a **Break** error handler on the OpenAI module. Configure it with **3 Retries** at a **2-minute Interval** to handle transient token exhaustion or service degradation.
* **Notion API Limits**: The Notion API allows up to 3 requests per second. When executing the **Iterator** for multi-task creation, append a **Sleep module (350ms)** inside the loop to avoid hitting `429 Too Many Requests`.

```
[ Notion Task Create ] ---> (Error: 429) ---> [ Break Handler: Retry 3x, Step 120s ]
```

### 2. Error Routing & Rollback Strategies
Attach an **Error Handler Directive** (`Resume`, `Ignore`, or `Commit`) to key modules:

```
                          +------------------------+
                          |  Notion Master Update  |
                          +------------------------+
                                      |
                                  (On Error)
                                      v
                          +------------------------+
                          | Router (Error Handling)|
                          +------------------------+
                             /                  \
                            v                    v
            +------------------------+  +------------------------+
            | Send Dev Alert (Slack) |  | Fallback Local Store   |
            +------------------------+  +------------------------+
```

* **Data Validation Failures**: Send malformed intake submissions to a separate `#alerts-dev` channel via Slack rather than letting the scenario crash. Include raw JSON context.
* **Notion Failures**: If Notion API is unreachable, use a **Data Store module** to save the state temporarily. Once the service recovers, replay the queued items from the Data Store.

### 3. Edge Case Coverage
* **Duplicate Submissions**: Before creating a client record, run a **Notion - Search Objects** query filtered by `Email = {{1.email}}`. Wrap the creation steps in a router: only create records if the search module returns zero items (`Total number of bundles = 0`).
* **Prompt Injection**: Input text from public intake forms can contain adversarial prompts. Sanitize input strings before appending them to your system prompts by removing explicit control keywords (e.g., `Ignore previous instructions`). Set strict system instructions and use low model temperatures (`temperature <= 0.2`).