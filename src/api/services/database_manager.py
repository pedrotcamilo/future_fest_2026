import json
import logging
import re
import threading
import time
from contextlib import contextmanager
from datetime import datetime, date
from os import getenv

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv(verbose=True)

logger = logging.getLogger(__name__)

# ── Engine primário (PostgreSQL local) ──────────────────────────────────

_primary_engine = create_engine(
    f"postgresql://{getenv('DB_USUARIO')}:{getenv('DB_SENHA')}"
    f"@{getenv('DB_HOST')}:{getenv('DB_PORT')}/{getenv('DB_SCHEM')}",
    connect_args={"connect_timeout": 3},
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    pool_recycle=300,
)

# ── Supabase REST client ───────────────────────────────────────────────

_supabase: Client = create_client(
    getenv("SUPABASE_URL"),
    getenv("SUPABASE_SECRET_KEY"),
)

# ── SupabaseSession: wrapper que imita Session do SQLAlchemy ───────────

class _AttrDict(dict):
    def __getattr__(self, name):
        try:
            return self[name]
        except KeyError:
            raise AttributeError(name)


class _SupabaseResult:
    def __init__(self, rows):
        self._rows = [_AttrDict(r) if isinstance(r, dict) else r for r in (rows or [])]
        self._idx = 0

    def __iter__(self):
        return iter(self._rows)

    def __next__(self):
        if self._idx >= len(self._rows):
            raise StopNext
        row = self._rows[self._idx]
        self._idx += 1
        return row

    def scalars(self):
        return _ScalarResult(self._rows)

    def scalar(self):
        if not self._rows:
            return None
        row = self._rows[0]
        if isinstance(row, dict):
            vals = list(row.values())
            return vals[0] if vals else None
        return row

    def first(self):
        return self._rows[0] if self._rows else None

    def fetchall(self):
        return list(self._rows)

    def fetchone(self):
        return self._rows[0] if self._rows else None


class _ScalarResult:
    def __init__(self, rows):
        self._rows = rows

    def all(self):
        return list(self._rows)

    def first(self):
        return self._rows[0] if self._rows else None


class StopNext(Exception):
    pass


def _parse_value(v):
    if isinstance(v, (datetime, date)):
        return v.isoformat()
    return v


def _cast_value(val: str):
    if val.upper() == "TRUE":
        return True
    if val.upper() == "FALSE":
        return False
    if val.upper() == "NULL":
        return None
    val = val.strip("'")
    try:
        if "." in val:
            return float(val)
        return int(val)
    except ValueError:
        return val


class SupabaseSession:
    def __init__(self, client: Client):
        self._client = client

    def execute(self, stmt):
        from sqlalchemy import select, insert, update, delete
        from sqlalchemy.sql.elements import TextClause
        from sqlalchemy.sql.dml import Delete, Insert, Update
        from sqlalchemy.sql.selectable import Select

        if isinstance(stmt, TextClause):
            return self._exec_text(stmt)

        compiled = stmt.compile(compile_kwargs={"literal_binds": True})
        sql_str = str(compiled)

        if isinstance(stmt, Select):
            return self._exec_select(sql_str)

        if isinstance(stmt, Insert):
            return self._exec_insert(stmt, sql_str)

        if isinstance(stmt, Update):
            return self._exec_update(stmt, sql_str)

        if isinstance(stmt, Delete):
            return self._exec_delete(sql_str)

        return _SupabaseResult([])

    def scalar(self, stmt):
        from sqlalchemy.sql.elements import TextClause

        if isinstance(stmt, TextClause):
            result = self.execute(stmt)
            rows = result.fetchall()
            return rows[0] if rows else None

        result = self.execute(stmt)
        rows = result.scalars().all()
        return rows[0] if rows else None

    def commit(self):
        pass

    def rollback(self):
        pass

    def close(self):
        pass

    def __enter__(self):
        return self

    def __exit__(self, *args):
        pass

    # ── SELECT ──────────────────────────────────────────────────────

    def _exec_select(self, sql: str) -> _SupabaseResult:
        m = re.search(r"FROM\s+(\w+)", sql, re.IGNORECASE)
        if not m:
            return _SupabaseResult([])
        table = m.group(1)

        query = self._client.table(table).select("*")

        # WHERE
        where_match = re.search(r"WHERE\s+(.+?)(?:\s+ORDER\s|\s+LIMIT\s|\s+GROUP\s|$)", sql, re.IGNORECASE)
        if where_match:
            query = self._apply_where(query, where_match.group(1))

        # ORDER BY
        order_match = re.search(r"ORDER\s+BY\s+(\w+(?:\.\w+)?)\s*(ASC|DESC)?", sql, re.IGNORECASE)
        if order_match:
            col = order_match.group(1).split(".")[-1]
            desc = order_match.group(2) and order_match.group(2).upper() == "DESC"
            query = query.order(col, desc=desc)

        # LIMIT
        limit_match = re.search(r"LIMIT\s+(\d+)", sql, re.IGNORECASE)
        if limit_match:
            query = query.limit(int(limit_match.group(1)))

        resp = query.execute()
        return _SupabaseResult(resp.data or [])

    def _apply_where(self, query, where_str: str):
        parts = re.split(r"\s+AND\s+", where_str, flags=re.IGNORECASE)
        for part in parts:
            part = part.strip()
            if not part:
                continue

            m = re.match(r"(\w+(?:\.\w+)?)\s*(=|!=|<>|>=|<=|>|<|LIKE|ILIKE|IS)\s*'?([^']*?)'?\s*$", part, re.IGNORECASE)
            if not m:
                continue

            col = m.group(1).split(".")[-1]
            op = m.group(2).upper()
            val = m.group(3).strip("'")

            if op == "=":
                query = query.eq(col, val)
            elif op in ("!=", "<>"):
                query = query.neq(col, val)
            elif op == ">":
                query = query.gt(col, val)
            elif op == ">=":
                query = query.gte(col, val)
            elif op == "<":
                query = query.lt(col, val)
            elif op == "<=":
                query = query.lte(col, val)
            elif op in ("LIKE", "ILIKE"):
                pattern = val.replace("%", "*")
                query = query.ilike(col, pattern)
            elif op == "IS":
                if val.upper() == "NULL":
                    query = query.is_(col, None)
                elif val.upper() == "NOT NULL":
                    query = query.not_.is_(col, None)

        return query

    # ── INSERT ──────────────────────────────────────────────────────

    def _exec_insert(self, stmt, sql: str) -> _SupabaseResult:
        m = re.match(
            r"INSERT INTO (\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)",
            sql, re.IGNORECASE,
        )
        if not m:
            return _SupabaseResult([])
        table = m.group(1)
        cols = [c.strip().split(".")[-1] for c in m.group(2).split(",")]
        raw_vals = [v.strip() for v in m.group(3).split(",")]
        data = {}
        for col, val in zip(cols, raw_vals):
            data[col] = _cast_value(val)

        resp = self._client.table(table).insert(data).execute()
        return _SupabaseResult(resp.data or [])

    # ── UPDATE ──────────────────────────────────────────────────────

    def _exec_update(self, stmt, sql: str) -> _SupabaseResult:
        m_table = re.search(r"UPDATE\s+(\w+)", sql, re.IGNORECASE)
        if not m_table:
            return _SupabaseResult([])
        table = m_table.group(1)

        m_set = re.search(r"SET\s+(.+?)\s+WHERE", sql, re.IGNORECASE)
        values = {}
        if m_set:
            for part in m_set.group(1).split(","):
                part = part.strip()
                km = re.match(r"(\w+)\s*=\s*(.+)", part)
                if km:
                    values[km.group(1)] = _cast_value(km.group(2).strip())

        query = self._client.table(table).update(values)

        wm = re.search(r"WHERE\s+(.+?)(?:\s+RETURNING|$)", sql, re.IGNORECASE)
        if wm:
            query = self._apply_where(query, wm.group(1))

        resp = query.execute()
        return _SupabaseResult(resp.data or [])

    # ── DELETE ──────────────────────────────────────────────────────

    def _exec_delete(self, sql: str) -> _SupabaseResult:
        m = re.search(r"DELETE\s+FROM\s+(\w+)", sql, re.IGNORECASE)
        if not m:
            return _SupabaseResult([])
        table = m.group(1)

        query = self._client.table(table).delete()

        wm = re.search(r"WHERE\s+(.+?)(?:\s+RETURNING|$)", sql, re.IGNORECASE)
        if wm:
            query = self._apply_where(query, wm.group(1))

        resp = query.execute()
        return _SupabaseResult(resp.data or [])

    # ── RAW SQL (text) ──────────────────────────────────────────────

    def _exec_text(self, stmt) -> _SupabaseResult:
        sql_str = str(stmt.compile(compile_kwargs={"literal_binds": True}))
        logger.warning("Supabase REST nao suporta SQL raw: %s", sql_str[:100])
        return _SupabaseResult([])


# ── Estado do failover ──────────────────────────────────────────────────

_active_db = "primary"
_failover_count = 0
_recovery_count = 0
_lock = threading.Lock()
_last_primary_check = 0.0
PRIMARY_CHECK_COOLDOWN = 15

HEALTH_CHECK_INTERVAL = 10


def get_active_db() -> str:
    with _lock:
        return _active_db


def get_stats() -> dict:
    with _lock:
        return {
            "banco_ativo": _active_db,
            "total_failovers": _failover_count,
            "total_recuperacoes": _recovery_count,
        }


def _set_active_db(name: str):
    global _active_db, _failover_count, _recovery_count
    with _lock:
        old = _active_db
        _active_db = name
        if old == "primary" and name == "supabase":
            _failover_count += 1
            logger.warning("FAILOVER: banco primario caiu, usando Supabase")
        elif old == "supabase" and name == "primary":
            _recovery_count += 1
            logger.info("RECUPERACAO: banco primario voltou, usando novamente")


# ── Health check do banco primario ──────────────────────────────────────

def _check_primary_alive() -> bool:
    try:
        with Session(_primary_engine) as session:
            session.execute(text("SELECT 1"))
        return True
    except Exception:
        return False


def _health_check_loop():
    while True:
        time.sleep(HEALTH_CHECK_INTERVAL)
        current = get_active_db()

        if current == "primary":
            if not _check_primary_alive():
                _set_active_db("supabase")
        else:
            if _check_primary_alive():
                _set_active_db("primary")


_health_thread = threading.Thread(target=_health_check_loop, daemon=True)
_health_thread_started = False


def _ensure_health_thread():
    global _health_thread_started
    if not _health_thread_started:
        _health_thread_started = True
        _health_thread.start()


# ── Context manager principal ───────────────────────────────────────────

@contextmanager
def get_session():
    global _last_primary_check
    _ensure_health_thread()

    now = time.time()
    should_try_primary = (
        get_active_db() == "primary"
        or (now - _last_primary_check) > PRIMARY_CHECK_COOLDOWN
    )

    if should_try_primary:
        try:
            with Session(_primary_engine) as session:
                session.execute(text("SELECT 1"))
                _last_primary_check = now
                yield session
                return
        except Exception:
            _last_primary_check = now
            _set_active_db("supabase")

    session = SupabaseSession(_supabase)
    try:
        yield session
    finally:
        session.close()


def get_primary_engine():
    return _primary_engine


def get_supabase_engine():
    return _supabase
