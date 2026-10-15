---
title: "How to automate client onboarding using Make.com and Notio"
excerpt: "A complete step-by-step technical guide to automating workflows with AI and modern APIs."
publishedAt: "2026-10-15"
category: "Agency Automation"
author: "Md. Selim Reza"
tags: ["Automation", "Make.com", "AI Workflows"]
workflowTool: "Make.com"
featured: false
---

## Architecture Overview

A seamless client onboarding flow is the cornerstone of any high-performing agency or freelance business. Manual data entry, delayed welcome emails, and disjointed CRM setups lead to friction right when your new client is most excited to work with you. 

This production-grade guide details how to build an end-to-end automated client onboarding pipeline using **Make.com** as the orchestration engine, **Notion** as the relational database/CRM, and an **AI model (OpenAI/Anthropic)** to parse unstructured intake data, draft tailored project briefs, and orchestrate communications.

```
[ Webhook Trigger ] 
       │
       ▼
[ Data Validation & Sanitization ]
       │
       ▼
[ AI Processing (OpenAI/Claude API) ]
       │
       ▼
[ Notion CRM Sync (Create Client & Project Database) ]
       │
       ▼
[ Automated Delivery (Slack Notification & Welcome Email) ]
```

### Key Components of the Architecture:
1. **Input Trigger:** A webhook payload captured from an onboarding form (e.g., Typeform, Tally, or Webflow).
2. **Validation & Sanitization:** Ensuring incoming payloads are clean, verifying email formats, and checking for duplicate client records.
3. **AI Processing Node:** Utilizing an LLM via Make.com to summarize intake notes, extract actionable deliverables, and structure a custom project scope.
4. **Data Storage & CRM Sync:** Creating a master client entry and associated project pages within Notion's relational databases.
5. **Automated Notifications & Dispatch:** Firing internal Slack alerts to your account management team and sending an automated, personalized welcome email to the client.

---

## Step 1: Setting Up the Trigger & Payload

To kick off the automation, you need a reliable entry point. For this tutorial, we will use a **Custom Webhook** module in Make.com connected to your frontend form builder.

### 1.1 Configure the Make.com Webhook
1. Log into your Make.com dashboard and create a new scenario.
2. Add a **Webhooks > Custom Webhook** module as your trigger.
3. Click **Add** to create a new webhook name (e.g., `Agency Client Onboarding`) and copy the generated unique URL.
4. Paste this URL into your form builder’s webhook settings (or trigger it manually via Postman for testing).

### 1.2 Expected JSON Payload Structure
Ensure your form sends a clean JSON payload structured similar to this:

```json
{
  "clientName": "Jane Doe",
  "companyName": "Acme Corp",
  "email": "jane@acmecorp.com",
  "phone": "+1555019823",
  "projectScope": "We need a complete brand redesign and a high-converting landing page built in Webflow within 4 weeks.",
  "budget": "$5,000 - $10,000",
  "startDate": "2026-11-01"
}
```

### 1.3 Data Sanitization Step
Immediately following your webhook module, add a **Data tools** or native Make.com Set/Compose variable module to normalize strings:
* Convert `email` to lowercase using `lower()`.
* Trim whitespace from `clientName` and `companyName`.

---

## Step 2: Processing Data with AI

Raw onboarding forms often contain messy, unstructured text. We will use an AI module (OpenAI's `Create a Completion` or Make's native OpenAI integration) to analyze the `projectScope` and output a structured JSON object ready for Notion.

### 2.1 Structuring the System Prompt
Add an OpenAI module configured with the following parameters:
* **Model:** `gpt-4o` or `claude-3-5-sonnet`
* **Response Format:** `json_object`

**System Prompt:**
```text
You are an expert agency operations manager and technical project coordinator. 
Analyze the client's onboarding intake data and extract the following:
1. A concise, professional executive summary of the project.
2. A prioritized list of 3-5 core deliverables based on their scope.
3. An estimated risk factor (Low, Medium, High) based on budget vs. scope expectations.

Output valid JSON matching this schema:
{
  "executiveSummary": "string",
  "deliverables": ["string"],
  "riskFactor": "string"
}
```

**User Prompt:**
```text
Company: {{1.companyName}}
Budget: {{1.budget}}
Raw Scope: {{1.projectScope}}
```

This ensures that regardless of how verbose or brief the client's form submission is, your downstream databases receive clean, standardized data.

---

## Step 3: Dispatch & CRM Sync

With the structured data ready, we can now update Notion and notify internal teams.

### 3.1 Notion: Create Client Database Record
1. Add a **Notion > Create a Database Item** module.
2. Connect your workspace and select your **Clients Master Database**.
3. Map the fields accordingly:
   * **Name (Title):** `{{1.companyName}} - {{1.clientName}}`
   * **Email:** `{{1.email}}`
   * **Phone:** `{{1.phone}}`
   * **Status:** Set to `Onboarding Active`
   * **Budget:** Map to your Notion Select/Number property.

### 3.2 Notion: Create Project Scope Page (Relational)
1. Add a second **Notion > Create a Database Item** module targeting your **Projects Database**.
2. Link the newly created client record using the ID returned from the previous Notion module.
3. Map the AI-generated outputs:
   * **Project Title:** `{{1.companyName}} - Core Implementation`
   * **Executive Summary:** `{{2.choices[].message.content.executiveSummary}}`
   * **Deliverables:** `{{2.choices[].message.content.deliverables}}`
   * **Risk Assessment:** `{{2.choices[].message.content.riskFactor}}`

### 3.3 Internal & External Notifications
* **Slack / Discord:** Add a **Slack > Create a Message** module targeting your `#agency-ops` channel:
  > *New Client Onboarded!* :tada:
  > **Client:** `{{1.clientName}}` (`{{1.companyName}}`)
  > **Budget:** `{{1.budget}}`
  > **Risk Level:** `{{2.choices[].message.content.riskFactor}}`
  > [View in Notion](Notion_Page_URL)
* **Email:** Add an **Email (SMTP/Gmail)** module to send a personalized onboarding confirmation email to `{{1.email}}` confirming receipt of their details and outlining the next steps.

---

## JSON Blueprint Configuration

Below is a production-grade Make.com scenario blueprint representing the core structure of this workflow. You can save this as a `.json` file and import it directly into Make.com.

```json
{
  "name": "Client Onboarding Automation - Make & Notion",
  "version": 1,
  "modules": [
    {
      "id": 1,
      "name": "Custom Webhook",
      "type": "gateway:CustomWebhooks",
      "metadata": {
        "designer": { "x": 0, "y": 0 }
      }
    },
    {
      "id": 2,
      "name": "OpenAI - Parse Scope",
      "type": "open-ai:CreateACompletion",
      "metadata": {
        "designer": { "x": 300, "y": 0 }
      }
    },
    {
      "id": 3,
      "name": "Notion - Create Client",
      "type": "notion:createDatabaseItem",
      "metadata": {
        "designer": { "x": 600, "y": 0 }
      }
    },
    {
      "id": 4,
      "name": "Slack - Send Alert",
      "type": "slack:createMessage",
      "metadata": {
        "designer": { "x": 900, "y": 0 }
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

When deploying client-facing automations to production, robustness is non-negotiable. Follow these guidelines to ensure zero data loss:

1. **Implement Error Handlers (Break/Commit/Resume):**
   * Add a **Break** error handler on external API modules (OpenAI and Notion) to automatically retry failing requests up to 3 times with exponential backoff.
   * If the API remains unresponsive, route the payload to an **Error Route** that creates a fallback task in a "Failed Automations" Notion view and alerts your engineering team via Slack.

2. **Rate Limiting Management:**
   * OpenAI and Notion APIs enforce strict rate limits (RPM and TPM). If onboarding high volumes of clients concurrently, add a **Sleep** module or ensure your Make.com execution pacing handles concurrency gracefully.

3. **Data Validation & Edge Cases:**
   * Always validate that incoming email addresses are syntactically correct before hitting downstream services.
   * Handle missing optional fields in the AI prompt by instructing the model to default to `"Not specified"` rather than throwing a parsing exception.