
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator


class ActivityCreate(BaseModel):
    activity_type: str = Field(min_length=1, max_length=100)
    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    activity_date: date
    next_hearing_date: date | None = None

    @model_validator(mode="after")
    def validate_hearing_date(self):
        if (
            self.next_hearing_date is not None
            and self.next_hearing_date < self.activity_date
        ):
            raise ValueError(
                "Next hearing date cannot be before activity date."
            )
        return self


class ActivityResponse(BaseModel):
    id: int
    case_id: int
    activity_type: str
    title: str
    description: str | None
    activity_date: date
    next_hearing_date: date | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ActivityUpdate(BaseModel):
    activity_type: str | None = Field(
        default=None, min_length=1, max_length=100
    )
    title: str | None = Field(
        default=None, min_length=1, max_length=255
    )
    description: str | None = None
    activity_date: date | None = None
    next_hearing_date: date | None = None

    @model_validator(mode="after")
    def validate_hearing_date(self):
        if (
            self.activity_date is not None
            and self.next_hearing_date is not None
            and self.next_hearing_date < self.activity_date
        ):
            raise ValueError(
                "Next hearing date cannot be before activity date."
            )
        return self
