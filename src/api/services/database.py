from sqlalchemy.orm import DeclarativeBase

from api.services.database_manager import (
    get_primary_engine as _get_primary_engine,
    get_session,
    get_active_db,
    get_stats,
)

engine = _get_primary_engine()


class Base(DeclarativeBase):
    pass
