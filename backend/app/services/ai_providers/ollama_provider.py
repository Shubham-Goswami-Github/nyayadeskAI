
import json
import urllib.request
import urllib.error

from app.core.config import settings


def generate_ollama_response(prompt: str) -> str:
    """
    Generates an AI response using the local Ollama model.
    """

    payload = {
        "model": settings.OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.2,
            "num_predict": 1000
        }
    }

    request_data = json.dumps(payload).encode("utf-8")

    request = urllib.request.Request(
        settings.OLLAMA_URL,
        data=request_data,
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    try:
        with urllib.request.urlopen(request, timeout=120) as response:
            result = json.loads(
                response.read().decode("utf-8")
            )

        generated_text = result.get("response", "").strip()

        if not generated_text:
            raise RuntimeError("Ollama returned an empty response.")

        return generated_text

    except (urllib.error.URLError, TimeoutError,
            json.JSONDecodeError) as error:
        raise RuntimeError(
            f"Ollama API error: {error}"
        ) from error
