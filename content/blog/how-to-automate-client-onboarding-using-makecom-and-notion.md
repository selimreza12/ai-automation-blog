---
title: "How to automate client onboarding using Make.com and Notio"
excerpt: "A complete step-by-step technical guide to automating workflows with AI and modern APIs."
publishedAt: "2026-10-24"
category: "Agency Automation"
author: "Md. Selim Reza"
tags: ["Automation", "Make.com", "AI Workflows"]
workflowTool: "Make.com"
featured: false
---

## Architecture Overview

Scaling an agency or freelance business requires eliminating manual overhead. This production-grade tutorial details how to build a resilient, end-to-end client onboarding engine using **Make.com**, **Notion**, and an **LLM (OpenAI)**. 

When a client submits an intake form, the system immediately executes the following pipeline:
1. **Input Trigger:** Captures raw onboarding data via a Webhook (Typeform, Tally, or Webflow).
2. **Data Sanitization & Validation:** Validates required fields, checks for duplicate client profiles, and sanitizes payload formats.
3. **AI Processing:** Leverages OpenAI to analyze project scopes, extract key deliverables, and auto-generate an estimated timeline breakdown.
4. **Data Storage & CRM Sync:** Creates a dedicated client master record and dynamically provisions project tracker pages inside Notion.
5. **Automated Notification Dispatch:** Sends a personalized welcome email to the client via Gmail/SendGrid and posts an internal Slack alert to the account management channel.

---

## Step 1: Setting Up the Trigger & Payload

To begin, you need a reliable entry point that catches user submissions. We use a Make.com **Custom Webhook** module.

1. Create a new scenario in Make.com and add a **Webhooks > Custom Webhook** module.
2. Copy the generated Webhook URL and paste it into your form builder (e.g., Tally or Typeform) as the submission endpoint.
3. Submit a test form containing the following payload structure:

```json
{
  "clientName": "Acme Corporation",
  "contactEmail": "sarah@acmecorp.com",
  "serviceTier": "Enterprise Growth",
  "projectScope": "We need a complete redesign of our landing page and integration with HubSpot CRM.",
  "budget": "$10,000"
}
```

4. Run the Make.com module once to capture the data structure, establishing the data types for downstream modules.

---

## Step 2: Processing Data with AI

Raw client inputs are often unstructured and messy. We insert an **OpenAI > Create a Completion** (or Chat Completions) module to parse the raw `projectScope` and return structured JSON metadata.

### The System Prompt

Configure your OpenAI module with the following system instructions to ensure deterministic JSON outputs:

```text
You are an expert agency operations manager. Analyze the incoming client project scope and return a strict JSON object with no markdown formatting or backticks. 

Required JSON Structure:
{
  "summary": "A concise 1-sentence summary of the project goals",
  "estimatedWeeks": 4,
  "deliverables": ["Deliverable 1", "Deliverable 2"],
  "riskLevel": "Low | Medium | High"
}
```

### User Prompt
Pass the dynamic variable from Step 1:
```text
Client Scope: {{1.projectScope}}
Service Tier: {{1.serviceTier}}
```

Map the parsed output using Make's `parseJSON()` function to convert the text response into mappable variables for the next steps.

---

## Step 3: Dispatch & CRM Sync

With clean, AI-enriched data ready, we push the information to your workspace infrastructure.

### 1. Notion: Create Database Item
Add a **Notion > Create a Database Item** module linked to your Master Client CRM database. Map the fields accordingly:
* **Name (Title):** `{{1.clientName}}`
* **Email (Email):** `{{1.contactEmail}}`
* **Status (Select):** `Onboarding`
* **Project Scope (Text):** `{{2.summary}}`
* **Risk Level (Select):** `{{2.riskLevel}}`

### 2. Slack / Email: Notification Dispatch
Add a **Slack > Create a Message** module to notify your internal team:
> :rocket: **New Client Onboarded!**
> * **Client:** `{{1.clientName}}`
> * **Tier:** `{{1.serviceTier}}`
> * **AI Risk Assessment:** `{{2.riskLevel}}`
> * **Estimated Timeline:** `{{2.estimatedWeeks}} weeks`

Simultaneously, trigger your email provider (Gmail or SendGrid) to send a personalized onboarding packet to `{{1.contactEmail}}`.

---

## JSON Blueprint Configuration

Below is a truncated Make.com scenario blueprint demonstrating the structural layout of the Webhook, OpenAI, and Notion modules. You can import this directly into your Make.com account.

```json
{
  "name": "Client Onboarding Automation",
  "flow": [
    {
      "id": 1,
      "module": "gateway:CustomWebHook",
      "version": 1,
      "parameters": {},
      "mapper": {},
      "metadata": {
        "designer": { "x": 0, "y": 0 }
      }
    },
    {
      "id": 2,
      "module": "openai:CreateACompletion",
      "version": 1,
      "parameters": {
        "model": "gpt-4o"
      },
      "mapper": {
        "messages": [
          { "role": "system", "content": "Return strict JSON only." },
          { "role": "user", "content": "{{1.projectScope}}" }
        ]
      },
      "metadata": {
        "designer": { "x": 300, "y": 0 }
      }
    },
    {
      "id": 3,
      "module": "notion:createADatabaseItem",
      "version": 2,
      "parameters": {
        "databaseId": "YOUR_NOTION_DATABASE_ID"
      },
      "mapper": {
        "title": "{{1.clientName}}",
        "properties": {
          "Email": "{{1.contactEmail}}",
          "Scope": "{{2.choices[1].message.content}}"
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

When deploying production automations handling real clients and revenue, resilience is non-negotiable. Implement these best practices:

* **Rate Limiting & API Quotas:** OpenAI and Notion APIs enforce strict rate limits. Add a **Flow Control > Sleep** module or configure exponential backoff in your error handlers if you expect high concurrent submission spikes.
* **Fallback Error Routes:** Attach a fallback route to your OpenAI and Notion modules. If an API times out or returns a 5xx error, route the payload to a designated Slack error channel and create a fallback row in a "Failed Onboardings" Google Sheet.
* **Data Sanitization:** Always validate that incoming email addresses match standard regex patterns before hitting your CRM to prevent polluting your database with bad leads.
* **Idempotency:** Consider checking Notion for existing records matching the client's email before creating a new database item to prevent duplicate entries if a user double-submits the form.