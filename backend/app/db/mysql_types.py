"""MySQL-specific column types shared across models."""

from sqlalchemy import Text
from sqlalchemy.dialects.mysql import LONGTEXT

LongText = Text().with_variant(LONGTEXT(), "mysql")
