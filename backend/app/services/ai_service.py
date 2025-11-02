from sqlalchemy.orm import Session
from uuid import UUID
from app.core.config import settings
from app.models.entry import Entry
from app.schemas.entry import SummaryStatus
import httpx
from loguru import logger


async def generate_summary(entry_id: UUID, db: Session):
    """Generate AI summary for an entry"""
    entry = db.query(Entry).filter(Entry.id == entry_id).first()
    if not entry:
        return

    # Update status to processing
    entry.summary_status = SummaryStatus.PROCESSING.value
    db.commit()

    try:
        # Prepare content based on type
        if entry.content_type == "link":
            content = (
                entry.content or entry.entry_metadata.get("description", "")
                if entry.entry_metadata
                else ""
            )
            prompt = f"Summarize this article in 3-5 bullet points focusing on key technical insights: {content}"
        elif entry.content_type == "repo":
            repo_desc = (
                entry.entry_metadata.get("description", "")
                if entry.entry_metadata
                else ""
            )
            prompt = f"Summarize the key features and technologies used in this GitHub repository: {repo_desc}"
        else:  # note
            content = entry.content or ""
            prompt = f"Extract key takeaways from these notes: {content}"

        # Call AI service
        if settings.AI_PROVIDER == "openrouter" and settings.OPENROUTER_API_KEY:
            summary = await call_openrouter(prompt)
        elif settings.GEMINI_API_KEY:
            summary = await call_gemini(prompt)
        else:
            raise ValueError("No AI provider configured")

        # Update entry
        entry.ai_summary = summary
        entry.summary_status = SummaryStatus.COMPLETED.value
        db.commit()

    except Exception as e:
        logger.error(f"Error generating summary for entry {entry_id}: {e}")
        entry.summary_status = SummaryStatus.FAILED.value
        db.commit()


async def call_openrouter(prompt: str) -> str:
    """Call OpenRouter API"""
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
    }
    data = {
        "model": settings.AI_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 500,
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(url, headers=headers, json=data, timeout=30)
        response.raise_for_status()
        result = response.json()
        return result["choices"][0]["message"]["content"]


async def call_gemini(prompt: str) -> str:
    """Call Google Gemini API"""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={settings.GEMINI_API_KEY}"
    data = {"contents": [{"parts": [{"text": prompt}]}]}

    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=data, timeout=30)
        response.raise_for_status()
        result = response.json()
        return result["candidates"][0]["content"]["parts"][0]["text"]
