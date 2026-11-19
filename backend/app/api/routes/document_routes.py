
import uuid
import io
import zipfile
from pathlib import Path
from fastapi.responses import FileResponse

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Case, CaseDocument


router = APIRouter(
    prefix="/documents",
    tags=["Document Management"]
)

STORAGE_DIR = Path("storage/case_documents").resolve()

ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx"}

MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB


def validate_document_content(extension: str, content: bytes) -> bool:

    if extension == ".pdf":
        return content.startswith(b"%PDF-")

    elif extension == ".doc":
        # Microsoft Office Compound File signature
        return content.startswith(
            bytes.fromhex("D0CF11E0A1B11AE1")
        )

    elif extension == ".docx":
        try:
            with zipfile.ZipFile(io.BytesIO(content)) as archive:
                files = set(archive.namelist())

                return (
                    "[Content_Types].xml" in files
                    and "word/document.xml" in files
                )

        except (zipfile.BadZipFile, OSError):
            return False

    return False


@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_document(
    case_id: int = Form(...),
    document_title: str = Form(...),
    document_type: str = Form(...),
    description: str | None = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    case = db.get(Case, case_id)

    if not case:
        raise HTTPException(
            status_code=404,
            detail="Case not found."
        )

    original_filename = Path(file.filename or "").name

    if not original_filename:
        raise HTTPException(
            status_code=400,
            detail="Invalid filename."
        )

    extension = Path(original_filename).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Only PDF, DOC and DOCX files are allowed."
        )

    content = await file.read(MAX_FILE_SIZE + 1)

    if not content:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty."
        )

    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="File size cannot exceed 20 MB."
        )

    if not validate_document_content(extension, content):
        raise HTTPException(
            status_code=400,
            detail="The uploaded file content does not match its file type."
        )
    stored_filename = f"{uuid.uuid4().hex}{extension}"

    STORAGE_DIR.mkdir(parents=True, exist_ok=True)

    file_path = STORAGE_DIR / stored_filename

    try:
        with file_path.open("xb") as destination:
            destination.write(content)

        document = CaseDocument(
            case_id=case_id,
            document_title=document_title.strip(),
            document_type=document_type.strip(),
            original_filename=original_filename,
            stored_filename=stored_filename,
            storage_path=str(file_path),
            mime_type=file.content_type or "application/octet-stream",
            file_size=len(content),
            description=description
        )

        db.add(document)
        db.commit()
        db.refresh(document)

        return {
            "message": "Document uploaded successfully.",
            "document_id": document.id,
            "case_id": document.case_id,
            "filename": document.original_filename,
            "file_size": document.file_size
        }

    except Exception:
        db.rollback()

        if file_path.exists():
            file_path.unlink()

        raise

    finally:
        await file.close()

@router.get("/case/{case_id}")
def get_case_documents(
    case_id: int,
    db: Session = Depends(get_db)
):
    case = db.get(Case, case_id)

    if not case:
        raise HTTPException(
            status_code=404,
            detail="Case not found."
        )

    documents = db.scalars(
        select(CaseDocument)
        .where(
            CaseDocument.case_id == case_id,
            CaseDocument.is_deleted == False
        )
        .order_by(CaseDocument.uploaded_at.desc())
    ).all()

    return [
        {
            "id": document.id,
            "case_id": document.case_id,
            "document_title": document.document_title,
            "document_type": document.document_type,
            "original_filename": document.original_filename,
            "mime_type": document.mime_type,
            "file_size": document.file_size,
            "description": document.description,
            "uploaded_at": document.uploaded_at
        }
        for document in documents
    ]

@router.get("/{document_id}/download")
def download_document(
    document_id: int,
    db: Session = Depends(get_db)
):
    document = db.get(CaseDocument, document_id)

    if not document or document.is_deleted:
        raise HTTPException(
            status_code=404,
            detail="Document not found."
        )

    file_path = Path(document.storage_path).resolve()

    # Ensure the file is inside the document storage directory.
    if not file_path.is_relative_to(STORAGE_DIR):
        raise HTTPException(
            status_code=400,
            detail="Invalid document storage path."
        )

    if not file_path.is_file():
        raise HTTPException(
            status_code=404,
            detail="Document file not found in storage."
        )

    return FileResponse(
        path=file_path,
        media_type=document.mime_type,
        filename=document.original_filename
    )

@router.delete("/{document_id}")
def soft_delete_document(
    document_id: int,
    db: Session = Depends(get_db)
):
    document = db.get(CaseDocument, document_id)

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Document not found."
        )

    if document.is_deleted:
        raise HTTPException(
            status_code=400,
            detail="Document is already deleted."
        )

    document.is_deleted = True

    db.commit()

    return {
        "message": "Document moved to deleted status successfully.",
        "document_id": document.id,
        "is_deleted": document.is_deleted
    }

@router.post("/{document_id}/restore")
def restore_document(
    document_id: int,
    db: Session = Depends(get_db)
):
    document = db.get(CaseDocument, document_id)

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Document not found."
        )

    if not document.is_deleted:
        raise HTTPException(
            status_code=400,
            detail="Document is already active."
        )

    document.is_deleted = False

    db.commit()
    db.refresh(document)

    return {
        "message": "Document restored successfully.",
        "document_id": document.id,
        "is_deleted": document.is_deleted
    }
