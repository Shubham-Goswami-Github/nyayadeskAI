
from datetime import date, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Case, CaseActivity


router = APIRouter(
    prefix="/hearings",
    tags=["Hearing Calendar"]
)


@router.get("/upcoming")
def get_upcoming_hearings(
    days: int = Query(default=30, ge=1, le=365),
    db: Session = Depends(get_db)
):
    today = date.today()
    end_date = today + timedelta(days=days)

    results = db.execute(
        select(CaseActivity, Case)
        .join(Case, Case.id == CaseActivity.case_id)
        .where(
            CaseActivity.next_hearing_date >= today,
            CaseActivity.next_hearing_date <= end_date,
            CaseActivity.is_deleted == False
        )
        .order_by(CaseActivity.next_hearing_date.asc())
    ).all()

    return [
        {
            "activity_id": activity.id,
            "case_id": case.id,
            "case_number": case.case_number,
            "case_title": case.case_title,
            "case_status": case.status,
            "activity_title": activity.title,
            "next_hearing_date": activity.next_hearing_date,
            "description": activity.description
        }
        for activity, case in results
    ]
