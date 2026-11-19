
from app.core.config import settings
from app.services.ai_providers.gemini_provider import generate_gemini_response
from app.services.ai_providers.groq_provider import generate_groq_response


def generate_ai_response(prompt: str) -> str:
    provider = settings.AI_PROVIDER.lower().strip()

    if provider == "groq":
        return generate_groq_response(prompt)

    elif provider == "gemini":
        return generate_gemini_response(prompt)

    else:
        raise ValueError(
            f"Unsupported AI provider: {provider}. "
            "Supported providers: groq, gemini."
        )
