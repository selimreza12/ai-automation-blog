---
title: "How to automate client onboarding using Make.com and Notion"
excerpt: "A complete step-by-step technical guide to automating workflows with AI and modern APIs."
publishedAt: "2026-10-14"
category: "Agency Automation"
author: "Md. Selim Reza"
tags: ["Automation", "Make.com", "AI Workflows"]
workflowTool: "Make.com"
featured: false
---

## Architecture Overview

Scaling an agency means eliminating repetitive administrative overhead. Client onboarding is notorious for manual data entry, fragmented communication, and disorganized project tracking. 

This production-grade tutorial walks you through building an end-to-end, resilient client onboarding engine using **Make.com**, **Notion**, **OpenAI**, and **Slack**.

```
[ Webhook / Typeform ] 
       │
       ▼
[ Data Validation & Sanitization ]
       │
       ▼
[ AI Sentiment & Scope Analysis (OpenAI) ]
       │
       ▼
[ Notion Database (Create Master Client Record) ]
       │
       ├────────────────────────┐
       ▼                        ▼
[ Slack Notification ]   [ Automated Welcome Email ]
```

* **Input Trigger:** Webhook payload captured from an intake form (e.g., Typeform, Tally, or direct API call).
* **Validation & Data Sanitization:** Make.com native filters and data formatters to clean string inputs, normalize phone numbers, and verify corporate email domains.
* **AI Processing:** OpenAI module processing the project scope to generate structured task lists, risk assessments, and executive summaries.
* **Data Storage:** Notion database storing the master client dossier, dynamic project milestones, and contract parameters.
* **Notifications:** Real-time internal dispatching via Slack and external welcome delivery via email.

---

## Step 1: Setting Up the Trigger & Payload

The foundation of any robust automation is clean ingestion. We will use a Make.com **Custom Webhook** module as our entry point.

### 1.1 Webhook Configuration
1. Create a new scenario in Make.com and add a **Webhooks > Custom Webhook** module.
2. Click **Add**, name your webhook (e.g., `Client-Onboarding-Production`), and copy the generated URL.
3. Send a test payload representing your onboarding form. Your JSON payload should look like this:

```json
{
  "client_name": "Acme Corp",
  "contact_person": "Jane Doe",
  "email": "jane@acmecorp.com",
  "tier": "Enterprise",
  "project_scope": "We need a complete AI automation overhaul for our customer support and billing departments.",
  "budget": 15000
}
```

### 1.2 Data Validation & Filtering
Immediately following the webhook, add a **Flow Control > Router** or a native **Filter** to ensure data integrity. 
* **Rule:** `email` must contain `@`.
* **Rule:** `budget` must be a numeric value greater than `0`.
* Add a fallback route for invalid payloads to log errors into an emergency error-handling database.

---

## Step 2: Processing Data with AI

To remove manual scoping work, we pass the client's raw project description to OpenAI. We will use the **OpenAI > Create a Completion** (or Chat Completions) module to parse unstructured input into actionable project parameters.

### 2.1 Configuring the OpenAI Module
* **Model:** `gpt-4o` (recommended for low latency and high structured-output reliability).
* **System Prompt:**

```text
You are an expert technical project manager for an elite AI automation agency. 
Analyze the client's project scope and return a JSON object with EXACTLY the following keys:
- "executive_summary": A 2-sentence summary of the engagement.
- "complexity_score": An integer from 1 to 10.
- "recommended_milestones": An array of 3 strings representing core development phases.
- "risk_assessment": A brief note on potential integration hurdles.
```

* **User Message:** Map the `project_scope` variable from Step 1 directly into the prompt body.
* **Response Format:** Ensure you configure the API call to expect `json_object` to guarantee parsable downstream data.

---

## Step 3: Dispatch & CRM Sync

Now that we have sanitized inputs and AI-enriched metadata, we write the data to Notion and dispatch notifications.

### 3.1 Notion Database Entry
Add a **Notion > Create a Database Item** module.
1. Connect your Notion workspace and select your **Clients Master Database**.
2. Map the incoming fields:
   * **Name (Title):** `client_name`
   * **Contact Email (Email):** `email`
   * **Tier (Select):** `tier`
   * **Executive Summary (Text):** Output from OpenAI (`executive_summary`)
   * **Complexity Score (Number):** Output from OpenAI (`complexity_score`)
   * **Status (Status):** Set default to `Onboarding Initiated`

### 3.2 Slack Internal Notification
Add a **Slack > Create a Message** module to alert your internal engineering channel.
* **Channel:** `#agency-ops`
* **Message Content:**
```markdown
🚀 *New Enterprise Client Onboarded!*
*Client:* {{1.client_name}}
*Tier:* {{1.tier}}
*AI Complexity Score:* {{2.complexity_score}}/10
*Summary:* {{2.executive_summary}}
👉 <https://notion.so/{{3.id}}|View Notion Dossier>
```

---

## JSON Blueprint Configuration

You can import the following conceptual JSON blueprint skeleton into Make.com to kickstart your scenario construction. 

```json
{
  "name": "Client Onboarding Automation Blueprint",
  "flow": [
    {
      "id": 1,
      "module": "webhooks:CustomWebHook",
      "version": 1,
      "parameters": {
        "name": "Intake Webhook"
      },
      "mapper": {},
      "metadata": {
        "designer": { "x": 0, "y": 0 }
      }
    },
    {
      "id": 2,
      "module": "openai:createChatCompletion",
      "version": 1,
      "parameters": {},
      "mapper": {
        "model": "gpt-4o",
        "messages": [
          {
            "role": "system",
            "content": "Analyze scope and return JSON."
          },
          {
            "role": "user",
            "content": "{{1.project_scope}}"
          }
        ],
        "response_format": { "type": "json_object" }
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
        "databaseId": "YOUR_NOTION_DB_ID"
      },
      "mapper": {
        "title": "{{1.client_name}}",
        "email": "{{1.email}}"
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

When moving your automation from staging to production, resilience is paramount. Implement these architectural best practices:

1. **Rate Limiting & Backoff:** OpenAI and Notion APIs enforce strict rate limits. In Make.com, attach a **Sleep** module or configure **Error Handlers** with a *Resume* or *Break* directive to handle HTTP 429 (Too Many Requests) errors gracefully.
2. **Data Fallbacks:** If the OpenAI module fails to return valid JSON, use a Make.com directive to catch the error, assign a default static object (e.g., complexity score `5`), and flag the Notion entry for manual review.
3. **Idempotency:** Pass a unique `submission_id` from your intake form through all modules. Check your Notion database via an initial search module before creating a record to prevent duplicate entries if a user double-submits the form.