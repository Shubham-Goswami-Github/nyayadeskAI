
from google import genai
from google.genai import types

from app.core.config import settings


def generate_gemini_response(prompt: str) -> str:
    """
    Generates responses using Gemini with controlled
    timeout and retry settings.
    """

    if not settings.GEMINI_API_KEY:
        raise RuntimeError("Gemini API key is not configured.")

    client = genai.Client(
        api_key=settings.GEMINI_API_KEY,
        http_options=types.HttpOptions(
            timeout=30000,
            retry_options=types.HttpRetryOptions(
                attempts=1,
                initial_delay=0.5,
                max_delay=2.0
            )
        )
    )

    try:
        response = client.models.generate_content(
            model=settings.AI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.2,
                max_output_tokens=512
            )
        )

        if not response.text:
            raise RuntimeError("Gemini returned an empty response.")

        return response.text.strip()

    except Exception as error:
        raise RuntimeError(
            f"Gemini API error: {error}"
        ) from error

    finally:
        client.close()
