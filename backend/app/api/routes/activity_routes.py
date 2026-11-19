
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Case, CaseActivity
from app.schemas.activity_schema import (
    ActivityCreate,
    ActivityUpdate,
    ActivityResponse
)


router = APIRouter(
    prefix="/activities",
    tags=["Case Activity Management"]
)


@router.post(
    "/case/{case_id}",
    response_model=ActivityResponse,
    status_code=status.HTTP_201_CREATED
)
def create_activity(
    case_id: int,
    activity_data: ActivityCreate,
    db: Session = Depends(get_db)
):
    case = db.get(Case, case_id)

    if not case:
        raise HTTPException(
            status_code=404,
            detail="Case not found."
        )

    activity = CaseActivity(
        case_id=case_id,
        **activity_data.model_dump()
    )

    db.add(activity)
    db.commit()
    db.refresh(activity)

    return activity


@router.get(
    "/case/{case_id}",
    response_model=list[ActivityResponse]
)
def get_case_activities(
    case_id: int,
    db: Session = Depends(get_db)
):
    case = db.get(Case, case_id)

    if not case:
        raise HTTPException(
            status_code=404,
            detail="Case not found."
        )

    activities = db.scalars(
        select(CaseActivity)
        .where(
            CaseActivity.case_id == case_id,
            CaseActivity.is_deleted == False
        )
        .order_by(CaseActivity.activity_date.desc())
    ).all()

    return activities

@router.put("/{activity_id}", response_model=ActivityResponse)
def update_activity(
    activity_id: int,
    activity_data: ActivityUpdate,
    db: Session = Depends(get_db)
):
    activity = db.get(CaseActivity, activity_id)

    if not activity or activity.is_deleted:
        raise HTTPException(
            status_code=404,
            detail="Activity not found."
        )

    update_data = activity_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(activity, field, value)

    # Validate the combined dates, including unchanged values.
    activity_date = (
        activity.activity_date
        if "activity_date" not in update_data
        else update_data["activity_date"]
    )
    next_hearing_date = (
        activity.next_hearing_date
        if "next_hearing_date" not in update_data
        else update_data["next_hearing_date"]
    )

    if (
        next_hearing_date is not None
        and next_hearing_date < activity_date
    ):
        raise HTTPException(
            status_code=422,
            detail="Next hearing date cannot be before activity date."
        )

    db.commit()
    db.refresh(activity)

    return activity


@router.delete("/{activity_id}")
def soft_delete_activity(
    activity_id: int,
    db: Session = Depends(get_db)
):
    activity = db.get(CaseActivity, activity_id)

    if not activity:
        raise HTTPException(
            status_code=404,
            detail="Activity not found."
        )

    if activity.is_deleted:
        raise HTTPException(
            status_code=400,
            detail="Activity is already deleted."
        )

    activity.is_deleted = True

    db.commit()

    return {
        "message": "Activity deleted successfully.",
        "activity_id": activity.id,
        "is_deleted": True
    }
