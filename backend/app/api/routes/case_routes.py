
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Case
from app.schemas.case_schema import CaseCreate, CaseUpdate, CaseResponse

router = APIRouter(
    prefix="/cases",
    tags=["Case Management"]
)


# Create a new case
@router.post(
    "/",
    response_model=CaseResponse,
    status_code=status.HTTP_201_CREATED
)
def create_case(
    case_data: CaseCreate,
    db: Session = Depends(get_db)
):
    existing_case = db.scalar(
        select(Case).where(
            Case.case_number == case_data.case_number
        )
    )

    if existing_case:
        raise HTTPException(
            status_code=409,
            detail="A case with this case number already exists."
        )

    new_case = Case(**case_data.model_dump())

    db.add(new_case)
    db.commit()
    db.refresh(new_case)

    return new_case


# Get all cases
@router.get("/", response_model=list[CaseResponse])
def get_all_cases(
    db: Session = Depends(get_db)
):
    cases = db.scalars(
        select(Case).order_by(Case.id.desc())
    ).all()

    return cases


# Get a particular case
@router.get("/{case_id}", response_model=CaseResponse)
def get_case(
    case_id: int,
    db: Session = Depends(get_db)
):
    case = db.get(Case, case_id)

    if not case:
        raise HTTPException(
            status_code=404,
            detail="Case not found."
        )

    return case


# Update an existing case
@router.put("/{case_id}", response_model=CaseResponse)
def update_case(
    case_id: int,
    case_data: CaseUpdate,
    db: Session = Depends(get_db)
):
    case = db.get(Case, case_id)

    if not case:
        raise HTTPException(
            status_code=404,
            detail="Case not found."
        )

    update_data = case_data.model_dump(exclude_unset=True)

    if "case_number" in update_data:
        raise HTTPException(
            status_code=400,
            detail="Case number cannot be changed through this endpoint."
        )

    for field, value in update_data.items():
        setattr(case, field, value)

    db.commit()
    db.refresh(case)

    return case


# Delete a case
@router.delete("/{case_id}")
def delete_case(
    case_id: int,
    db: Session = Depends(get_db)
):
    case = db.get(Case, case_id)

    if not case:
        raise HTTPException(
            status_code=404,
            detail="Case not found."
        )

    db.delete(case)
    db.commit()

    return {
        "message": "Case deleted successfully."
    }
