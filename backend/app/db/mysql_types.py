"""MySQL-specific column types shared across models."""

from sqlalchemy import LargeBinary, Text
from sqlalchemy.dialects.mysql import LONGBLOB, LONGTEXT

LongText = Text().with_variant(LONGTEXT(), "mysql")
LongBlob = LargeBinary().with_variant(LONGBLOB(), "mysql")
