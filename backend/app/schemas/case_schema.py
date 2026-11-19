
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class CaseCreate(BaseModel):
    case_number: str = Field(min_length=1, max_length=100)
    case_title: str = Field(min_length=1, max_length=255)
    case_type: str = Field(min_length=1, max_length=100)

    case_category: str | None = None
    court_name: str | None = None

    petitioner: str = Field(min_length=1, max_length=255)
    respondent: str = Field(min_length=1, max_length=255)

    filing_date: date | None = None
    status: str = "Pending"
    description: str | None = None


class CaseUpdate(BaseModel):
    case_title: str | None = Field(default=None, max_length=255)
    case_type: str | None = Field(default=None, max_length=100)
    case_category: str | None = None
    court_name: str | None = None
    petitioner: str | None = Field(default=None, max_length=255)
    respondent: str | None = Field(default=None, max_length=255)
    filing_date: date | None = None
    status: str | None = None
    description: str | None = None


class CaseResponse(BaseModel):
    id: int
    case_number: str
    case_title: str
    case_type: str
    case_category: str | None
    court_name: str | None
    petitioner: str
    respondent: str
    filing_date: date | None
    status: str
    description: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
