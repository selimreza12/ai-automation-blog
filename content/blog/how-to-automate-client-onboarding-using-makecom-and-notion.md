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

Welcome to the ultimate blueprint for modern agency automation. If your team is still manually copying client intake form data into Notion, setting up project folders by hand, and drafting welcome emails one by one, you are leaking billable hours. 

In this production-grade tutorial, we will build a bulletproof, asynchronous client onboarding engine using **Make.com**, **Notion**, **OpenAI**, and **Slack/Email APIs**. By the end of this guide, your workflow will handle data sanitization, AI-driven project scoping, CRM synchronization, and team notification instantly upon form submission.

---

## Architecture Overview

To ensure high availability and zero dropped payloads, our production architecture follows a linear, decoupled pipeline:

```
[ Webhook Trigger ] 
       │
       ▼
[ Data Sanitization & Validation ] 
       │
       ▼
[ OpenAI (Prompt Chain & Scoping Engine) ] 
       │
       ▼
[ Notion Database (Client Hub & CRM Sync) ] 
       │
       ├─────────────────────────┐
       ▼                         ▼
[ Slack Notification ]    [ Client Welcome Email ]
```

1. **Input Trigger:** A secure webhook listens for payload drops from your intake frontend (Typeform, Tally, or Webflow).
2. **Validation Steps:** Make.com parses the JSON schema, rejecting malformed emails or missing company names.
3. **Data Storage & AI Processing:** OpenAI structures the raw unstructured feedback into actionable project milestones while Notion provisions a dedicated Client Portal database.
4. **Automated Notifications:** Internal stakeholders receive a rich-formatted Slack alert, and the client receives a personalized welcome packet.

---

## Step 1: Setting Up the Trigger & Payload

The foundation of a reliable automation is a clean webhook payload. We will use Make.com's **Webhooks > Custom Webhook** module.

### 1. Create the Scenario & Webhook
1. Log into your Make.com account and create a new scenario.
2. Add a **Webhooks** module and select **Custom Webhook**.
3. Click **Add**, name your webhook (e.g., *Agency Intake Production*), and copy the generated URL.

### 2. Standardize Your Intake Schema
Ensure your frontend form sends a structured JSON payload matching this schema:

```json
{
  "clientName": "Jane Doe",
  "companyName": "Acme Corp",
  "clientEmail": "jane@acmecorp.com",
  "projectScope": "We need a complete brand redesign and a scalable Next.js web application.",
  "budget": "$10k - $25k",
  "urgency": "High"
}
```

Trigger the webhook by submitting a test form. Make.com will automatically determine the data structure based on the incoming JSON packet.

---

## Step 2: Processing Data with AI

Raw client descriptions are often messy, overly verbose, or vague. We will route the `projectScope` string through OpenAI to extract actionable metadata.

### 1. Add the OpenAI Module
Add an **OpenAI > Create a Completion** (or Chat Completions) module to your scenario.

### 2. Configure the System & User Prompts
Use a rigorous system prompt to force the model into outputting strictly parseable JSON.

* **Model:** `gpt-4o` or `gpt-4-turbo`
* **Response Format:** `JSON object`

**System Prompt:**
```text
You are an expert technical project manager for a digital agency. Analyze the incoming client project scope and return a strict JSON object with the following keys:
- "summary": A concise 2-sentence summary of the core objective.
- "estimatedWeeks": An integer representing estimated delivery time based on scope complexity.
- "keyMilestones": An array of 3 distinct high-level project milestones.
```

**User Prompt:**
```text
Client Project Scope: {{1.projectScope}}
Budget Tier: {{1.budget}}
```

This guarantees that downstream modules receive clean arrays and integers rather than unstructured paragraphs.

---

## Step 3: Dispatch & CRM Sync

Now that we have sanitized data and AI-generated project parameters, it's time to provision your workspace and alert your team.

### 1. Create the Notion Record
1. Add a **Notion > Create a Database Item** module.
2. Connect your Notion workspace and select your **Clients & Projects Master Database**.
3. Map the fields accordingly:
   - **Name (Title):** `{{1.companyName}} - {{1.clientName}}`
   - **Email (Email):** `{{1.clientEmail}}`
   - **Budget (Select):** `{{1.budget}}`
   - **AI Summary (Rich text):** `{{2.choices[].message.content.summary}}`
   - **Estimated Timeline:** `{{2.choices[].message.content.estimatedWeeks}} Weeks`
   - **Status (Status):** `Onboarding`

### 2. Fan-Out Notifications (Slack & Email)
Using Make.com's multi-path routing, split the execution flow:
* **Path A (Slack):** Send a Block Kit message to your `#leads` channel containing the company name, budget tier, and a direct link to the newly created Notion page.
* **Path B (Email):** Trigger an SMTP or Gmail module to send an automated, warm welcome email containing next steps to `{{1.clientEmail}}`.

---

## JSON Blueprint Configuration

You can import the schema below directly into Make.com by creating a new scenario, clicking the three dots in the bottom menu, and selecting **Import Blueprint**.

```json
{
  "name": "Client Onboarding Engine",
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
      "module": "openai:CreateACompletion",
      "version": 1,
      "parameters": {
        "model": "gpt-4o"
      },
      "mapper": {
        "messages": [
          {
            "role": "system",
            "content": "Return strict JSON with summary, estimatedWeeks, and keyMilestones."
          },
          {
            "role": "user",
            "content": "{{1.projectScope}}"
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
      "version": 2,
      "parameters": {
        "databaseId": "your-notion-database-id-here"
      },
      "mapper": {
        "title": "{{1.companyName}}",
        "email": "{{1.clientEmail}}"
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

When deploying this workflow to production, minor API glitches or malformed data inputs can break your automation pipeline. Apply these engineering best practices:

* **Rate Limiting & Concurrency:** OpenAI and Notion APIs have strict rate limits (RPM). If your agency scales to dozens of simultaneous onboardings, add a **Sleep** module or implement Make.com's built-in queue management.
* **Error Handlers (Data Store Fallbacks):** Attach an **Error Handler** route to your OpenAI module. If the API times out or returns invalid JSON, route the payload to a fallback path that flags the record as "Manual Review Needed" in Notion instead of failing silently.
* **Data Validation Filters:** Add a filter after your webhook trigger checking if `{{1.clientEmail}}` contains an `@` symbol and valid domain extension. This prevents spam bots from cluttering your CRM database.
* **Idempotency:** Pass a unique submission ID or timestamp check to ensure double-submissions from impatient users don't create duplicate Notion workspaces.