
from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Case, CaseDocument, CaseActivity


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get("/statistics")
def get_dashboard_statistics(
    db: Session = Depends(get_db)
):
    today = date.today()

    total_cases = db.scalar(
        select(func.count(Case.id))
    ) or 0

    pending_cases = db.scalar(
        select(func.count(Case.id))
        .where(Case.status == "Pending")
    ) or 0

    under_review_cases = db.scalar(
        select(func.count(Case.id))
        .where(Case.status == "Under Review")
    ) or 0

    disposed_cases = db.scalar(
        select(func.count(Case.id))
        .where(Case.status == "Disposed")
    ) or 0

    total_documents = db.scalar(
        select(func.count(CaseDocument.id))
        .where(CaseDocument.is_deleted == False)
    ) or 0

    upcoming_hearings = db.scalar(
        select(func.count(CaseActivity.id))
        .where(
            CaseActivity.is_deleted == False,
            CaseActivity.next_hearing_date >= today
        )
    ) or 0

    todays_hearings = db.scalar(
        select(func.count(CaseActivity.id))
        .where(
            CaseActivity.is_deleted == False,
            CaseActivity.next_hearing_date == today
        )
    ) or 0

    return {
        "total_cases": total_cases,
        "pending_cases": pending_cases,
        "under_review_cases": under_review_cases,
        "disposed_cases": disposed_cases,
        "total_documents": total_documents,
        "upcoming_hearings": upcoming_hearings,
        "todays_hearings": todays_hearings
    }
