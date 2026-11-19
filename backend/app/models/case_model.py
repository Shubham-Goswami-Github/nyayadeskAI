
from datetime import date, datetime, timezone

from sqlalchemy import Date, DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class Case(Base):
    __tablename__ = "cases"

    # Primary key
    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    # Basic case information
    case_number: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        index=True,
        nullable=False
    )

    case_title: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    case_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    case_category: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True
    )

    # Court / authority information
    court_name: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )

    # Parties involved
    petitioner: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    respondent: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    # Case dates
    filing_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True
    )

    # Current case status
    status: Mapped[str] = mapped_column(
        String(50),
        default="Pending",
        nullable=False,
        index=True
    )

    # Additional information
    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    # Record timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    documents = relationship(
        "CaseDocument",
        back_populates="case",
        cascade="all, delete-orphan"
    )

 
    activities = relationship(
        "CaseActivity",
        back_populates="case",
        cascade="all, delete-orphan"
    )
