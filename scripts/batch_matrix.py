import subprocess
import time

TOPIC_MATRIX = [
    "How to automate Shopify customer refund triage with Zapier and ChatGPT",
    "How to sync Stripe failed payments to Airtable and notify Slack with Make.com",
    "How to scrape LinkedIn profile data and enrich leads with LangChain and Notion",
    "How to build an automated AI customer support ticket triage with Gmail and OpenAI",
    "How to route inbound Webflow form leads to HubSpot using Make.com and ChatGPT"
]

print(f"🚀 Starting Batch Generation for {len(TOPIC_MATRIX)} pSEO guides...")

for idx, topic in enumerate(TOPIC_MATRIX, start=1):
    print(f"\n[{idx}/{len(TOPIC_MATRIX)}] Processing: '{topic}'")
    try:
        subprocess.run(["python", "scripts/crew_writer.py", topic], check=True)
        time.sleep(2)  # Avoid rate limit spikes
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to generate: {topic}")

print("\n🎉 Batch generation complete! Check content/blog/ to see all new articles.")
