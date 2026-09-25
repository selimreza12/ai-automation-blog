from typing import Optional
from core_llm import ContentEngine
from schemas import VideoIdea, VideoScript, VideoMetadata, ThumbnailConcept
from rich.console import Console
from rich.panel import Panel

console = Console()

METADATA_SYSTEM_PROMPT = """
You are a YouTube SEO Architect and High-Converting Copywriter for tech and automation channels.

Metadata Optimization Rules:
1. DESCRIPTIONS:
   - First 2 lines must hook searchers and summarize core value before the fold.
   - Include clear Chapter Timestamps matching the script flow.
   - Always append the standard promotional footer featuring the creator's web apps, Make.com affiliate link, and agency service packages.
2. TAGS: 15-20 specific, long-tail keywords.
3. THUMBNAIL CONCEPTS: 3 high-contrast concepts with 2-4 words max bold text overlay.
"""

PROMOTIONAL_FOOTER = """
---
🛠️ EXPLORE OUR FREE DEVELOPER & WEB UTILITIES:
• ToolVerse (50+ Free Tools): https://toolsverse-kappa.vercel.app/
• AI Automation Blog: https://ai-automation-blog-eight.vercel.app/
• Free Image Utilities: https://myimagetools.netlify.app/
• Creator Portfolio: https://selimreza-ai.netlify.app/

⚙️ RECOMMENDED TOOLS MENTIONED IN THIS VIDEO:
• Make.com (Visual Automation Platform): https://www.make.com/en/register?pc=selimreza

💼 WANT TO HIRE US FOR YOUR BUSINESS? (Custom AI & Automation Services):
• Package 1: Custom AI Lead Scout & CRM Bot ($500 - $900) -> DM to order: https://t.me/selimreza123
• Package 2: Custom AI Telegram/WhatsApp Support Bots ($300 - $600) -> DM to order: https://t.me/selimreza123
• Package 3: Rapid MVP / Micro-SaaS Dev (Next.js + Supabase) ($800+) -> DM to order: https://t.me/selimreza123
"""

class MetadataAgent:
    def __init__(self, engine: Optional[ContentEngine] = None):
        self.engine = engine or ContentEngine()

    def generate_metadata(self, idea: VideoIdea, script: VideoScript) -> VideoMetadata:
        sections_summary = "\n".join([f"- {s.section_name} (~{s.word_count} words)" for s in script.sections])

        prompt = f"""
        Generate complete YouTube SEO packaging and metadata for:
        TITLE: {idea.title}
        AUDIENCE: {idea.target_audience}
        TOOLS: {', '.join(idea.tools_featured)}

        SCRIPT SECTIONS:
        {sections_summary}

        Ensure the description includes clean estimated timestamps for every section starting from 00:00.
        """

        result: VideoMetadata = self.engine.generate_structured(
            system_instruction=METADATA_SYSTEM_PROMPT,
            prompt=prompt,
            schema_class=VideoMetadata
        )
        
        # Automatically inject your permanent promotional ecosystem footer into every description
        result.youtube_description = result.youtube_description.strip() + "\n" + PROMOTIONAL_FOOTER
        return result

    def display_metadata(self, meta: VideoMetadata):
        console.print(Panel(
            f"[bold green]SEO Title:[/bold green] {meta.seo_title}\n\n"
            f"[bold cyan]Tags ({len(meta.tags)}):[/bold cyan]\n{', '.join(meta.tags)}",
            title="🏷️ YouTube SEO Packaging",
            expand=False
        ))
        console.print("\n[bold yellow]📝 Generated Description Preview (with your promotional links injected):[/bold yellow]")
        console.print(meta.youtube_description[:600] + "\n... [dim](description footer appended successfully)[/dim]\n")

if __name__ == "__main__":
    from schemas import ScriptSection
    sample_idea = VideoIdea(
        title="Build an AI Lead Scraper in 10 Mins (No-Code)",
        hook_angle="Automate client outreach completely.",
        target_audience="Freelancers & Agency Owners",
        tools_featured=["Make.com", "ChatGPT API", "Airtable"],
        ctr_score_estimate=92
    )
    sample_script = VideoScript(
        title=sample_idea.title,
        total_estimated_minutes=10.0,
        sections=[ScriptSection(section_name="Hook", narration_text="...", screen_action="...", word_count=90)]
    )
    agent = MetadataAgent()
    meta = agent.generate_metadata(sample_idea, sample_script)
    agent.display_metadata(meta)
