---
title: "How to automate client onboarding using Make.com and Notion"
excerpt: "A complete step-by-step technical guide to automating workflows with AI and modern APIs."
publishedAt: "2026-10-17"
category: "Agency Automation"
author: "Md. Selim Reza"
tags: ["Automation", "Make.com", "AI Workflows"]
workflowTool: "Make.com"
featured: false
---

Client onboarding is the lifeblood of any modern agency or consultancy, yet it is traditionally riddled with manual bottlenecks. Copying data from a Typeform or Webflow submission into Notion, setting up project folders, drafting welcome emails, and assigning internal tasks consumes hours of billable time. 

In this production-grade tutorial, we will build a robust, error-tolerant automation pipeline using **Make.com**, **Notion**, **OpenAI**, and **Slack/Email** APIs. This pipeline will ingest client data, use AI to analyze project scope and categorize requirements, provision a dedicated Notion client portal, and trigger multi-channel welcome sequences automatically.

---

## Architecture Overview

To ensure enterprise-grade reliability, our Make.com scenario is structured into four distinct, sequential phases:

```
[ Webhook Trigger ] 
       │
       ▼
[ Data Validation & Sanitization ] 
       │
       ▼
[ AI Processing (OpenAI Scope Analysis) ] 
       │
       ▼
[ Data Storage & CRM Sync (Notion Database + Page Creation) ] 
       │
       ▼
[ Automated Notifications (Slack + Client Welcome Email) ]
```

1. **Input Trigger:** Captures raw JSON payloads from an intake form (e.g., Typeform, Tally, or custom API endpoints).
2. **Validation & Sanitization:** Filters out spam, validates email syntax, and normalizes phone numbers and company names.
3. **Data Storage & AI Processing:** Sends project requirements to OpenAI to extract structured deliverables and estimates, then writes a relational master entry inside a Notion workspace.
4. **Automated Notifications:** Dispatches an internal alert via Slack while simultaneously sending a personalized, highly professional HTML welcome email to the client containing their dedicated Notion portal link.

---

## Step 1: Setting Up the Trigger & Payload

The first step in building a bulletproof onboarding workflow is capturing data cleanly. We will use a **Make.com Custom Webhook** as our entry point.

### Webhook Configuration
1. Create a new scenario in Make.com and add a **Webhooks > Custom Webhook** module.
2. Click **Add**, name your webhook (e.g., `Client Onboarding Intake`), and copy the generated URL.
3. Send a test payload to this URL using your form builder or a tool like Postman. 

A production-ready JSON payload should look like this:

```json
{
  "clientName": "Jane Doe",
  "companyName": "Acme Corp",
  "email": "jane@acmecorp.com",
  "phone": "+15550198",
  "serviceTier": "Enterprise Growth",
  "projectBrief": "We need a complete redesign of our SaaS marketing site, integration with HubSpot CRM, and custom analytics dashboard setup within 6 weeks.",
  "budget": "$15,000",
  "submittedAt": "2026-10-17T08:30:00Z"
}
```

### Data Validation Router
Immediately after the webhook module, place a **Router** with a **Filter** to drop payloads missing critical fields (`email` or `companyName`). This prevents downstream errors in Notion and OpenAI modules.

---

## Step 2: Processing Data with AI

Raw client briefs can be messy, unstructured, and difficult to parse programmatically. We will leverage **OpenAI (GPT-4o)** via Make.com to extract structured milestones, summarize scope, and estimate complexity.

### OpenAI Module Setup
1. Add an **OpenAI > Create a Completion** (or **Create a Chat Completion**) module.
2. **Connection:** Select your OpenAI API key.
3. **Model:** `gpt-4o` (optimized for speed and structured JSON output).
4. **Messages / Prompt Structure:**

**System Prompt:**
> You are an expert technical project manager for a digital agency. Analyze the incoming client brief and return a strict JSON object with the following keys: `summary` (string), `keyDeliverables` (array of strings), `estimatedWeeks` (integer), and `riskLevel` ("Low", "Medium", "High"). Do not include markdown code blocks in your response, output raw JSON only.

**User Prompt:**
> Company: `{{1.companyName}}`
> Service Tier: `{{1.serviceTier}}`
> Brief: `{{1.projectBrief}}`
> Budget: `{{1.budget}}`

By forcing JSON output, we ensure that subsequent Make.com steps can parse the AI's response reliably using `parseJSON()`.

---

## Step 3: Dispatch & CRM Sync

Now that we have sanitized data and structured AI insights, we must persist this information into Notion and notify our internal team.

### 1. Creating the Notion Client Page
1. Add a **Notion > Create a Database Item** module.
2. Connect your Notion account and grant access to your master **Clients & Projects** database.
3. Map the fields accordingly:
   - **Name (Title):** `{{1.companyName}} - {{1.clientName}}`
   - **Email:** `{{1.email}}`
   - **Service Tier:** `{{1.serviceTier}}`
   - **Budget:** `{{1.budget}}`
   - **AI Scope Summary:** `{{parseJSON(2.choices[].message.content).summary}}`
   - **Status:** Set default status to `Onboarding Pending`.

### 2. Provisioning Sub-Pages (Optional Advanced Step)
Using a **Notion > Create a Page** module linked as a sub-page under the newly created database item, you can automatically generate customized onboarding checklists (e.g., "Brand Assets Collection", "Technical Audit", "Access Handover").

### 3. Multi-Channel Notifications
- **Internal Slack Alert:** Add a **Slack > Create a Message** module targeting your `#agency-operations` channel. Use rich formatting:
  > *New Enterprise Client Onboarded!* 🚀
  > *Company:* `{{1.companyName}}`
  > *Tier:* `{{1.serviceTier}}`
  > *AI Risk Assessment:* `{{parseJSON(2.choices[].message.content).riskLevel}}`
  > [View in Notion]({{3.url}})
- **Client Welcome Email:** Use a **Gmail** or **SendGrid** module to send a polished onboarding email containing access instructions and links to their newly created assets.

---

## JSON Blueprint Configuration

Below is a production-grade Make.com scenario blueprint representing the core architecture of this onboarding automation. You can save this as a `.json` file and import it directly into Make.com.

```json
{
  "name": "Client Onboarding Automation - Notion & OpenAI",
  "flow": [
    {
      "id": 1,
      "module": "webhooks:CustomWebhook",
      "version": 1,
      "parameters": {
        "hook": 987654
      },
      "mapper": {},
      "metadata": {
        "designer": { "x": 0, "y": 0 }
      }
    },
    {
      "id": 2,
      "module": "openai:CreateChatCompletion",
      "version": 1,
      "parameters": {
        "model": "gpt-4o",
        "response_format": { "type": "json_object" }
      },
      "mapper": {
        "messages": [
          {
            "role": "system",
            "content": "You are a technical PM. Extract summary, keyDeliverables, estimatedWeeks, and riskLevel into a strict JSON format."
          },
          {
            "role": "user",
            "content": "Company: {{1.companyName}}\nBrief: {{1.projectBrief}}"
          }
        ]
      },
      "metadata": {
        "designer": { "x": 300, "y": 0 }
      }
    },
    {
      "id": 3,
      "module": "notion:createDatabaseItem",
      "version": 1,
      "parameters": {
        "databaseId": "your_notion_database_id_here"
      },
      "mapper": {
        "title": "{{1.companyName}}",
        "properties": {
          "Email": "{{1.email}}",
          "Status": "Onboarding Pending"
        }
      },
      "metadata": {
        "designer": { "x": 600, "y": 0 }
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

When running automation pipelines that handle real clients and financial data, failure is not an option. Implement these production-grade practices:

1. **Rate Limiting & Concurrency:** 
   OpenAI and Notion APIs have strict rate limits (RPM - Requests Per Minute). Enable **Error Handlers** (Break directive) in Make.com on your OpenAI and Notion modules to automatically retry failed requests with an exponential backoff (e.g., 10s, 30s, 60s).
2. **Fallback Notifications:**
   Attach a **Fallback Error Handler** route to the end of your scenario. If any module fails catastrophically, route the error payload to a dedicated `#engineering-alerts` Slack channel so your devops or automation lead can intervene manually.
3. **Data Sanitization:**
   Always wrap user-submitted text fields in escape functions or regex filters inside Make.com to strip malicious HTML/script injections before writing them into Notion or displaying them in internal communications.
4. **Idempotency:**
   Store a unique identifier (like the client's email address combined with a timestamp hash) in a data store or check Notion prior to creation to prevent duplicate onboarding entries if a webhook fires twice due to network retries.