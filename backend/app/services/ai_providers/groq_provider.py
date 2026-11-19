
from groq import Groq
from app.core.config import settings


def generate_groq_response(prompt: str) -> str:
    if not settings.GROQ_API_KEY:
        raise RuntimeError("Groq API key is not configured.")

    client = Groq(
        api_key=settings.GROQ_API_KEY,
        timeout=30.0,
        max_retries=0
    )

    try:
        response = client.chat.completions.create(
            model=settings.AI_MODEL,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.2,
            max_tokens=512
        )

        answer = response.choices[0].message.content

        if not answer:
            raise RuntimeError("Groq returned an empty response.")

        return answer.strip()

    except Exception as error:
        raise RuntimeError(f"Groq API error: {error}") from error

    finally:
        client.close()
