
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy import select, func

from app.models import Case, CaseDocument, CaseActivity
from app.services.document_extraction_service import (
    extract_document_text
)


STORAGE_DIR = Path("storage/case_documents").resolve()

MAX_DOCUMENT_CHARS = 12000
MAX_TOTAL_DOCUMENT_CHARS = 40000


def get_case_context(case_id: int, db: Session) -> str | None:
    """
    Fetches case details, document metadata, extracted document
    contents and activities from PostgreSQL and file storage.
    """

    case = db.get(Case, case_id)

    if not case:
        return None

    documents = db.scalars(
        select(CaseDocument)
        .where(
            CaseDocument.case_id == case_id,
            CaseDocument.is_deleted.is_(False)
        )
        .order_by(CaseDocument.uploaded_at.desc())
    ).all()

    activities = db.scalars(
        select(CaseActivity)
        .where(
            CaseActivity.case_id == case_id,
            CaseActivity.is_deleted.is_(False)
        )
        .order_by(CaseActivity.activity_date.desc())
    ).all()

    context = f"""
CASE INFORMATION

Case Number: {case.case_number}
Case Title: {case.case_title}
Case Type: {case.case_type}
Case Category: {case.case_category or "Not provided"}
Court / Authority: {case.court_name or "Not provided"}

Petitioner: {case.petitioner}
Respondent: {case.respondent}

Filing Date: {case.filing_date or "Not provided"}
Current Status: {case.status}

Case Description:
{case.description or "No description available."}


UPLOADED DOCUMENTS AND CONTENT
"""

    total_extracted_chars = 0

    if documents:
        for document in documents:

            context += f"""
Document Title: {document.document_title}
Document Type: {document.document_type}
Original Filename: {document.original_filename}
Description: {document.description or "No description available."}
Uploaded At: {document.uploaded_at}
"""

            if total_extracted_chars >= MAX_TOTAL_DOCUMENT_CHARS:
                context += "\nDocument content limit reached.\n"
                break

            try:
                file_path = Path(document.storage_path).resolve()

                if not file_path.is_relative_to(STORAGE_DIR):
                    context += "\nDocument skipped: Invalid storage path.\n"
                    continue

                extracted_text = extract_document_text(
                    str(file_path)
                )

                remaining_chars = (
                    MAX_TOTAL_DOCUMENT_CHARS - total_extracted_chars
                )

                allowed_chars = min(
                    MAX_DOCUMENT_CHARS,
                    remaining_chars
                )

                extracted_text = extracted_text[:allowed_chars]

                context += f"""
EXTRACTED DOCUMENT CONTENT:
--- START OF DOCUMENT DATA ---
{extracted_text}
--- END OF DOCUMENT DATA ---
"""

                total_extracted_chars += len(extracted_text)

            except Exception as error:
                print(
                    f"Document extraction failed for "
                    f"document ID {document.id}: {error}"
                )

                context += (
                    "\nDocument content could not be extracted.\n"
                )

    else:
        context += "\nNo active documents are uploaded.\n"

    context += "\nCASE ACTIVITIES AND HEARING INFORMATION\n"

    if activities:
        for activity in activities:
            context += f"""
Activity Type: {activity.activity_type}
Title: {activity.title}
Description: {activity.description or "No description available."}
Activity Date: {activity.activity_date}
Next Hearing Date: {activity.next_hearing_date or "Not scheduled"}
"""
    else:
        context += "\nNo active activities are recorded.\n"

    return context.strip()


def get_general_case_context(db: Session) -> str:
    """
    Provides an overview of all cases for General AI Chat.
    """

    # Total number of cases
    total_cases = db.scalar(
        select(func.count()).select_from(Case)
    ) or 0

    # Status-wise case count
    status_counts = db.execute(
        select(Case.status, func.count(Case.id))
        .group_by(Case.status)
    ).all()

    # Fetch the latest 30 cases for general reference
    recent_cases = db.scalars(
        select(Case)
        .order_by(Case.updated_at.desc())
        .limit(30)
    ).all()

    context = f"""
NYAYADESK DATABASE OVERVIEW

Total Registered Cases: {total_cases}

CASE STATUS SUMMARY
"""

    if status_counts:
        for status, count in status_counts:
            context += f"{status}: {count}\n"
    else:
        context += "No case status information available.\n"

    context += "\nRECENT CASE RECORDS (Maximum 30)\n"

    if recent_cases:
        for case in recent_cases:
            context += f"""
Case ID: {case.id}
Case Number: {case.case_number}
Case Title: {case.case_title}
Case Type: {case.case_type}
Category: {case.case_category or "Not provided"}
Court / Authority: {case.court_name or "Not provided"}
Petitioner: {case.petitioner}
Respondent: {case.respondent}
Filing Date: {case.filing_date or "Not provided"}
Status: {case.status}
Description: {case.description or "Not provided"}
Last Updated: {case.updated_at}

---
"""
    else:
        context += "No cases are currently registered.\n"

    if total_cases > len(recent_cases):
        context += (
            f"\nNote: Only the latest {len(recent_cases)} cases "
            f"are included here out of {total_cases} total cases. "
            "Other case records have not been included in this context.\n"
        )

    return context.strip()
from pathlib import Path

from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.models import Case, CaseDocument, CaseActivity
from app.services.document_extraction_service import extract_document_text


STORAGE_DIR = Path("storage/case_documents").resolve()

MAX_DOCUMENT_CHARS = 12000
MAX_TOTAL_DOCUMENT_CHARS = 40000
MAX_RECENT_CASES = 30


def get_case_context(case_id: int, db: Session) -> str | None:
    """
    Fetch complete information for a selected case,
    including case details, uploaded documents and activities.
    """

    case = db.get(Case, case_id)

    if not case:
        return None

    documents = db.scalars(
        select(CaseDocument)
        .where(
            CaseDocument.case_id == case_id,
            CaseDocument.is_deleted.is_(False)
        )
        .order_by(CaseDocument.uploaded_at.desc())
    ).all()

    activities = db.scalars(
        select(CaseActivity)
        .where(
            CaseActivity.case_id == case_id,
            CaseActivity.is_deleted.is_(False)
        )
        .order_by(CaseActivity.activity_date.desc())
    ).all()

    context = f"""
CASE INFORMATION

Case ID: {case.id}
Case Number: {case.case_number}
Case Title: {case.case_title}
Case Type: {case.case_type}
Case Category: {case.case_category or "Not provided"}
Court / Authority: {case.court_name or "Not provided"}
Petitioner: {case.petitioner}
Respondent: {case.respondent}
Filing Date: {case.filing_date or "Not provided"}
Current Status: {case.status}
Case Description: {case.description or "No description available."}


UPLOADED DOCUMENTS AND CONTENT
"""

    total_extracted_chars = 0

    if documents:
        for document in documents:

            context += f"""

Document Title: {document.document_title}
Document Type: {document.document_type}
Original Filename: {document.original_filename}
Description: {document.description or "No description available."}
Uploaded At: {document.uploaded_at}
"""

            if total_extracted_chars >= MAX_TOTAL_DOCUMENT_CHARS:
                context += "\nDocument content limit reached.\n"
                break

            try:
                file_path = Path(document.storage_path).resolve()

                if not file_path.is_relative_to(STORAGE_DIR):
                    context += "\nDocument skipped due to invalid storage path.\n"
                    continue

                if not file_path.is_file():
                    context += "\nDocument file is missing from storage.\n"
                    continue

                extracted_text = extract_document_text(str(file_path))

                remaining_chars = (
                    MAX_TOTAL_DOCUMENT_CHARS - total_extracted_chars
                )

                allowed_chars = min(
                    MAX_DOCUMENT_CHARS,
                    remaining_chars
                )

                extracted_text = extracted_text[:allowed_chars]

                if extracted_text.strip():
                    context += f"""

Extracted Document Content:
--- START OF DOCUMENT DATA ---
{extracted_text}
--- END OF DOCUMENT DATA ---
"""
                    total_extracted_chars += len(extracted_text)
                else:
                    context += "\nNo readable text was extracted from this document.\n"

            except Exception as error:
                print(
                    f"Document extraction failed for "
                    f"document ID {document.id}: {error}"
                )

                context += "\nDocument content could not be extracted.\n"

    else:
        context += "\nNo active documents are uploaded.\n"

    context += "\nCASE ACTIVITIES AND HEARING INFORMATION\n"

    if activities:
        for activity in activities:
            context += f"""

Activity Type: {activity.activity_type}
Title: {activity.title}
Description: {activity.description or "No description available."}
Activity Date: {activity.activity_date}
Next Hearing Date: {activity.next_hearing_date or "Not scheduled"}
"""
    else:
        context += "\nNo active activities are recorded.\n"

    return context.strip()


def get_general_case_context(db: Session) -> str:
    """
    Fetch database-wide case statistics and recent case records
    for General AI Chat.
    """

    # Total registered cases
    total_cases = db.scalar(
        select(func.count()).select_from(Case)
    ) or 0

    # Case counts grouped by status
    status_counts = db.execute(
        select(
            Case.status,
            func.count(Case.id)
        )
        .group_by(Case.status)
        .order_by(Case.status)
    ).all()

    # Latest updated case records
    recent_cases = db.scalars(
        select(Case)
        .order_by(Case.updated_at.desc())
        .limit(MAX_RECENT_CASES)
    ).all()

    context = f"""
NYAYADESK DATABASE OVERVIEW

Total Registered Cases: {total_cases}

CASE STATUS SUMMARY
"""

    if status_counts:
        for status, count in status_counts:
            context += f"{status}: {count}\n"
    else:
        context += "No case records are currently available.\n"

    context += "\nRECENT CASE RECORDS\n"

    if recent_cases:
        for case in recent_cases:
            context += f"""

Case ID: {case.id}
Case Number: {case.case_number}
Case Title: {case.case_title}
Case Type: {case.case_type}
Category: {case.case_category or "Not provided"}
Court / Authority: {case.court_name or "Not provided"}
Petitioner: {case.petitioner}
Respondent: {case.respondent}
Filing Date: {case.filing_date or "Not provided"}
Status: {case.status}
Description: {case.description or "Not provided"}
Last Updated: {case.updated_at}

"""
    else:
        context += "No cases are currently registered.\n"

    if total_cases > len(recent_cases):
        context += (
            f"\nOnly the latest {len(recent_cases)} case records "
            f"are included out of {total_cases} registered cases. "
            "Do not assume that these are all the registered cases.\n"
        )

    return context.strip()
