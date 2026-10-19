---
title: "How to automate client onboarding using Make.com and Notion"
excerpt: "A complete step-by-step technical guide to automating workflows with AI and modern APIs."
publishedAt: "2026-10-19"
category: "Agency Automation"
author: "Md. Selim Reza"
tags: ["Automation", "Make.com", "AI Workflows"]
workflowTool: "Make.com"
featured: false
---

## Architecture Overview

Building a resilient, production-grade client onboarding pipeline requires decoupling your entry points from your internal data management systems. This architecture connects your frontend lead capture mechanism directly to your operational workspace without manual intervention.

```
[ Typeform / Webhook ] 
       │ (JSON Payload)
       ▼
[ Make.com Router ] ──(Data Validation)──> [ OpenAI (AI Parsing) ]
       │                                            │
       ├───────────────<────────────────────────────┘
       ▼
[ Notion Database ] (Create Client Record)
       │
       ├────────────────────────────────────────────┐
       ▼                                            ▼
[ Slack API ] (Internal Team Alert)      [ Gmail API ] (Welcome Email)
```

1. **Input Trigger:** A webhook captures raw JSON payloads from form submissions (e.g., Typeform, Tally, or custom web forms).
2. **Validation & Normalization:** Make.com validates incoming parameters (email formats, required fields) and normalizes naming conventions.
3. **AI Enhancement:** OpenAI processes free-text input fields (such as project goals or scope descriptions) to extract categorized tags, priority scores, and a concise executive summary.
4. **Data Storage:** The Notion API creates a structured master record within your Agency CRM database.
5. **Automated Dispatch:** Parallel execution routes output data to trigger a personalized welcome email via Gmail/Resend and sends a rich-format operational alert to your internal Slack channel.

---

## Step 1: Setting Up the Trigger & Payload

To begin, you need a reliable endpoint to receive form submissions. In Make.com, create a new scenario and add a **Custom Webhook** module as your first step.

### Webhook Configuration
1. Copy the generated Webhook URL from Make.com.
2. Paste the URL into your form builder's webhook or integration settings.
3. Send a test submission containing rich, real-world data. 

An ideal incoming JSON payload looks like this:

```json
{
  "submission_id": "sub_99a8bc76d",
  "client_name": "Sarah Jenkins",
  "company_name": "Apex Digital",
  "client_email": "s.jenkins@apexdigital.io",
  "budget_range": "$5k - $10k",
  "raw_project_scope": "We need an end-to-end automation revamp for our client intake and CRM syncing. Current stack uses HubSpot and Slack, but things keep falling through the cracks."
}
```

In Make.com, execute **"Determine data structure"** using this JSON sample so downstream modules can map parameters dynamically without manual parsing.

---

## Step 2: Processing Data with AI

Raw client inputs are often unstructured and messy. We will use the **OpenAI module** (using `gpt-4o` or `gpt-4o-mini`) to parse the `raw_project_scope` into structured metadata that your team can immediately action.

### OpenAI Module Setup
* **Action:** Create a Completion (or Chat Completions API)
* **Model:** `gpt-4o-mini` (cost-efficient and optimal for text transformation)
* **Response Format:** `JSON Object`

#### System Prompt
```text
You are an expert AI Operations Engineer for a digital agency. Your job is to analyze incoming client onboarding text, extract critical business requirements, and output a strict JSON object. Do not include markdown formatting tags like ```json in your response, just output the raw JSON string.
```

#### User Prompt
```text
Analyze the following client submission and extract:
1. "project_summary": A 1-2 sentence executive summary of what they need.
2. "urgency_level": Choose from ["Low", "Medium", "High"] based on tone.
3. "tech_stack_mentioned": An array of software tools explicitly mentioned.

Client Input:
{{1.raw_project_scope}}
```

#### Expected AI JSON Output
```json
{
  "project_summary": "Apex Digital requires an end-to-end automation rebuild for client intake and CRM syncing to prevent operational drop-offs.",
  "urgency_level": "High",
  "tech_stack_mentioned": ["HubSpot", "Slack"]
}
```

---

## Step 3: Dispatch & CRM Sync

Once the AI structures the payload, it’s time to commit the data to your source of truth (Notion) and notify your team and the client.

### 1. Notion API Module: Create a Database Item
Add the **Notion -> Create a Database Item** module. Map your Notion database properties to the incoming variables:
* **Name (Title):** `{{1.client_name}}` - `{{1.company_name}}`
* **Email (Email):** `{{1.client_email}}`
* **Budget (Select):** `{{1.budget_range}}`
* **AI Summary (Text):** `{{OpenAI.project_summary}}`
* **Status (Status):** Set default to `Onboarding Queued`

### 2. Slack API Module: Send Channel Notification
Add a **Slack -> Create a Message** module pointing to your `#client-alerts` channel:
```text
🚨 *New Client Onboarded!*
*Client:* {{1.client_name}} ({{1.company_name}})
*Budget:* {{1.budget_range}}
*Urgency:* {{OpenAI.urgency_level}}
*Summary:* {{OpenAI.project_summary}}
👉 <https://notion.so/{{Notion.id}}|View in Notion CRM>
```

### 3. Gmail API Module: Send Client Welcome Email
Add a **Gmail -> Send an Email** module to dispatch an automated onboarding confirmation directly to `{{1.client_email}}` with next steps and scheduling links.

---

## JSON Blueprint Configuration

Below is a production-ready Make.com blueprint structure outlining the sequential connection of the Webhook, OpenAI, Notion, and Slack modules. 

```json
{
  "name": "Client Onboarding Automation - Make & Notion",
  "version": 1,
  "modules": [
    {
      "id": 1,
      "name": "Webhook Trigger",
      "type": "gateway:CustomWebHook",
      "parameters": {}
    },
    {
      "id": 2,
      "name": "OpenAI Parse Scope",
      "type": "openai:CreateChatCompletion",
      "parameters": {
        "model": "gpt-4o-mini",
        "response_format": { "type": "json_object" }
      }
    },
    {
      "id": 3,
      "name": "Create Notion Record",
      "type": "notion:createDatabaseItem",
      "parameters": {
        "databaseId": "YOUR_NOTION_DATABASE_ID"
      }
    },
    {
      "id": 4,
      "name": "Send Slack Alert",
      "type": "slack:createMessage",
      "parameters": {
        "channel": "C01234567"
      }
    }
  ],
  "metadata": {
    "instant": true,
    "version": 1
  }
}
```

---

## Error Handling & Production Guidelines

When deploying this workflow to a live production environment, plan for third-party API failures and edge cases:

* **Rate Limiting (HTTP 429):** OpenAI and Notion APIs enforce strict rate limits. In Make.com, configure **Error Handlers** (Break directive) on your API modules with exponential backoff retry settings (e.g., 3 retries spaced 1 minute apart).
* **AI Hallucinations / Malformed JSON:** Even with `response_format: {"type": "json_object"}` enabled, always add a fallback text parser or a conditional filter after the OpenAI module to check if the output matches valid JSON schema keys.
* **Duplicate Submissions:** Pass a unique `submission_id` or deduplicate based on `client_email` inside Notion using a search module before creating a brand new database record.
* **Credential Security:** Never hardcode API keys or internal database tokens. Utilize Make.com’s connection manager with environment-scoped OAuth tokens or secure API secrets.