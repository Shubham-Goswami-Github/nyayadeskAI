
from pathlib import Path

from pypdf import PdfReader
from docx import Document


MAX_EXTRACTED_CHARACTERS = 100_000


def extract_document_text(file_path: str) -> str:
    """
    Extracts text from PDF and DOCX documents.
    Legacy DOC files will be handled separately.
    """

    path = Path(file_path)

    if not path.is_file():
        raise FileNotFoundError("Document file not found.")

    extension = path.suffix.lower()

    try:
        if extension == ".pdf":
            reader = PdfReader(str(path))

            if reader.is_encrypted:
                raise ValueError(
                    "Encrypted PDF documents are not supported yet."
                )

            extracted_text = []

            for page_number, page in enumerate(reader.pages, start=1):
                page_text = page.extract_text() or ""

                if page_text.strip():
                    extracted_text.append(
                        f"\n[SOURCE_PAGE: {page_number}]\n{page_text}"
                    )

        elif extension == ".docx":
            document = Document(str(path))

            extracted_text = [
                paragraph.text
                for paragraph in document.paragraphs
                if paragraph.text.strip()
            ]

            # Also extract text from tables.
            for table in document.tables:
                for row in table.rows:
                    extracted_text.append(
                        " | ".join(cell.text for cell in row.cells)
                    )

        elif extension == ".doc":
            raise ValueError(
                "Legacy DOC format extraction is not configured yet."
            )

        else:
            raise ValueError("Unsupported document format.")

        text = "\n".join(extracted_text).strip()

        if not text:
            raise ValueError(
                "No readable text found. The document may be scanned."
            )

        return text[:MAX_EXTRACTED_CHARACTERS]

    except ValueError:
        raise

    except Exception as error:
        raise RuntimeError(
            f"Document extraction failed: {error}"
        ) from error
