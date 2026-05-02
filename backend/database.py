"""
Supabase database layer with MongoDB-compatible async API.

Drop-in replacement for the previous Motor/MongoDB setup.
Collections are mapped to Supabase table names; all operations
are run in a thread pool so FastAPI's event loop is never blocked.
"""

import asyncio
import os
from datetime import datetime
from typing import Any, Optional
from pathlib import Path


class SupabaseResult:
    """
    Wraps a Supabase APIResponse to expose MongoDB-compatible result attributes
    (deleted_count, modified_count, matched_count, inserted_id).
    """

    def __init__(self, response, operation: str = ""):
        self._response = response
        self._data: list = response.data or [] if response else []
        self._operation = operation

    @property
    def deleted_count(self) -> int:
        return len(self._data)

    @property
    def modified_count(self) -> int:
        return len(self._data)

    @property
    def matched_count(self) -> int:
        return len(self._data)

    @property
    def inserted_id(self) -> Optional[str]:
        if self._data:
            return self._data[0].get("id")
        return None

    @property
    def data(self) -> list:
        return self._data

from dotenv import load_dotenv
from supabase import create_client, Client

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", os.environ.get("SUPABASE_KEY", ""))

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL else None

# MongoDB collection name → Supabase table name
_TABLE_MAP: dict[str, str] = {
    "bookings": "rental_bookings",
    "rentals": "rental_bookings",
    "zones": "geo_zones",
    "store_follows": "store_followers",
    "orders_pro": "order_pro",
    "offers_pro": "offer_pro",
}


def _table_name(collection: str) -> str:
    return _TABLE_MAP.get(collection, collection)


def _serialize(obj: Any) -> Any:
    """Recursively convert non-JSON-serializable types."""
    if isinstance(obj, datetime):
        return obj.isoformat()
    if isinstance(obj, dict):
        return {k: _serialize(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_serialize(v) for v in obj]
    return obj


def _apply_filter(query, filter_dict: dict):
    """Translate MongoDB-style filter operators to Supabase query methods."""
    for key, value in filter_dict.items():
        if key == "$or":
            parts = []
            for cond in value:
                for field, val in cond.items():
                    if isinstance(val, dict):
                        for op, v in val.items():
                            sv = _serialize(v)
                            if op == "$gt":
                                parts.append(f"{field}.gt.{sv}")
                            elif op == "$gte":
                                parts.append(f"{field}.gte.{sv}")
                            elif op == "$lt":
                                parts.append(f"{field}.lt.{sv}")
                            elif op == "$lte":
                                parts.append(f"{field}.lte.{sv}")
                            elif op == "$ne":
                                parts.append(f"{field}.neq.{sv}")
                            elif op == "$in":
                                inner = ",".join(str(x) for x in v)
                                parts.append(f"{field}.in.({inner})")
                    else:
                        sv = _serialize(val)
                        parts.append(f"{field}.eq.{sv}")
            if parts:
                query = query.or_(",".join(parts))
        elif key == "$and":
            for cond in value:
                query = _apply_filter(query, cond)
        elif isinstance(value, dict):
            for op, v in value.items():
                sv = _serialize(v)
                if op == "$gt":
                    query = query.gt(key, sv)
                elif op == "$gte":
                    query = query.gte(key, sv)
                elif op == "$lt":
                    query = query.lt(key, sv)
                elif op == "$lte":
                    query = query.lte(key, sv)
                elif op == "$ne":
                    query = query.neq(key, sv)
                elif op == "$in":
                    query = query.in_(key, [_serialize(x) for x in v])
                elif op == "$nin":
                    query = query.not_.in_(key, [_serialize(x) for x in v])
                elif op == "$exists":
                    if v:
                        query = query.not_.is_(key, "null")
                    else:
                        query = query.is_(key, "null")
        else:
            sv = _serialize(value)
            if sv is None:
                query = query.is_(key, "null")
            else:
                query = query.eq(key, sv)
    return query


class SupabaseCursor:
    """Mimics Motor AsyncIOMotorCursor for chained .sort().limit().to_list()."""

    def __init__(self, table: str, filter_dict: dict):
        self._table = table
        self._filter = filter_dict
        self._sort_field: Optional[str] = None
        self._sort_desc: bool = False
        self._limit_val: Optional[int] = None
        self._skip_val: int = 0

    def sort(self, field, direction=1):
        # Accept Motor-style list of (field, direction) tuples
        if isinstance(field, list) and field:
            self._sort_field = field[0][0]
            self._sort_desc = field[0][1] == -1
        else:
            self._sort_field = field
            self._sort_desc = direction == -1
        return self

    def limit(self, n: int):
        self._limit_val = n
        return self

    def skip(self, n: int):
        self._skip_val = n
        return self

    async def to_list(self, length: Optional[int] = None) -> list:
        effective_limit = length
        if self._limit_val is not None:
            effective_limit = (
                min(self._limit_val, length) if length else self._limit_val
            )

        def _execute():
            q = supabase.table(self._table).select("*")
            q = _apply_filter(q, self._filter)
            if self._sort_field:
                q = q.order(self._sort_field, desc=self._sort_desc)
            if self._skip_val:
                end = (effective_limit or 1000) + self._skip_val - 1
                q = q.range(self._skip_val, end)
            elif effective_limit:
                q = q.limit(effective_limit)
            return q.execute()

        result = await asyncio.to_thread(_execute)
        return result.data or []

    def __aiter__(self):
        self._iter_data = None
        return self

    async def __anext__(self):
        if self._iter_data is None:
            self._iter_data = await self.to_list(self._limit_val or 10000)
            self._iter_index = 0
        if self._iter_index >= len(self._iter_data):
            raise StopAsyncIteration
        item = self._iter_data[self._iter_index]
        self._iter_index += 1
        return item


class SupabaseCollection:
    """MongoDB-compatible async collection backed by a Supabase table."""

    def __init__(self, table: str):
        self._table = table

    # ── reads ──────────────────────────────────────────────────────────────

    async def find_one(self, filter_dict: dict = None, projection=None) -> Optional[dict]:
        filter_dict = filter_dict or {}

        def _execute():
            q = supabase.table(self._table).select("*")
            q = _apply_filter(q, filter_dict)
            return q.limit(1).execute()

        result = await asyncio.to_thread(_execute)
        data = result.data
        return data[0] if data else None

    def find(self, filter_dict: dict = None) -> SupabaseCursor:
        return SupabaseCursor(self._table, filter_dict or {})

    async def count_documents(self, filter_dict: dict = None) -> int:
        filter_dict = filter_dict or {}

        def _execute():
            q = supabase.table(self._table).select("id", count="exact")
            q = _apply_filter(q, filter_dict)
            return q.execute()

        result = await asyncio.to_thread(_execute)
        return result.count or 0

    # ── writes ─────────────────────────────────────────────────────────────

    async def insert_one(self, doc: dict) -> SupabaseResult:
        serialized = _serialize(doc)

        def _execute():
            return supabase.table(self._table).insert(serialized).execute()

        resp = await asyncio.to_thread(_execute)
        return SupabaseResult(resp, "insert")

    async def update_one(
        self,
        filter_dict: dict,
        update_dict: dict,
        return_document: bool = False,
        upsert: bool = False,
    ):
        update_data = await self._resolve_update(filter_dict, update_dict)
        if update_data is None:
            return SupabaseResult(None, "update")

        update_data = _serialize(update_data)

        def _execute():
            q = supabase.table(self._table).update(update_data)
            q = _apply_filter(q, filter_dict)
            q = q.select("*")
            return q.execute()

        resp = await asyncio.to_thread(_execute)

        if return_document:
            return await self.find_one(filter_dict)
        return SupabaseResult(resp, "update")

    async def update_many(self, filter_dict: dict, update_dict: dict) -> SupabaseResult:
        # For $set: Supabase update already applies to all matching rows
        if "$set" in update_dict and len(update_dict) == 1:
            return await self.update_one(filter_dict, update_dict)

        # For per-doc operators ($inc, $addToSet, $pull, $push): iterate
        cursor = SupabaseCursor(self._table, filter_dict)
        rows = await cursor.to_list(10000)
        updated = 0
        for row in rows:
            row_filter = {"id": row["id"]}
            result = await self.update_one(row_filter, update_dict)
            if result and result.modified_count:
                updated += result.modified_count

        class _FakeResult:
            modified_count = updated
            matched_count = updated
            deleted_count = 0
            inserted_id = None
            data = []

        return _FakeResult()

    async def delete_one(self, filter_dict: dict) -> SupabaseResult:
        def _execute():
            q = supabase.table(self._table).delete()
            q = _apply_filter(q, filter_dict)
            q = q.select("*")
            return q.execute()

        resp = await asyncio.to_thread(_execute)
        return SupabaseResult(resp, "delete")

    async def delete_many(self, filter_dict: dict) -> SupabaseResult:
        return await self.delete_one(filter_dict)

    async def find_one_and_update(
        self, filter_dict: dict, update_dict: dict, return_document: bool = True
    ):
        return await self.update_one(
            filter_dict, update_dict, return_document=return_document
        )

    # ── helpers ────────────────────────────────────────────────────────────

    async def _resolve_update(self, filter_dict: dict, update_dict: dict) -> Optional[dict]:
        """Translate MongoDB update operators to a flat dict for Supabase."""
        if "$set" in update_dict:
            return update_dict["$set"]

        if "$inc" in update_dict:
            current = await self.find_one(filter_dict)
            if current is None:
                return None
            data = {}
            for field, delta in update_dict["$inc"].items():
                data[field] = (current.get(field) or 0) + delta
            return data

        if "$addToSet" in update_dict:
            current = await self.find_one(filter_dict)
            if current is None:
                return None
            data = {}
            for field, val in update_dict["$addToSet"].items():
                arr = list(current.get(field) or [])
                if val not in arr:
                    arr.append(val)
                data[field] = arr
            return data

        if "$pull" in update_dict:
            current = await self.find_one(filter_dict)
            if current is None:
                return None
            data = {}
            for field, val in update_dict["$pull"].items():
                arr = list(current.get(field) or [])
                data[field] = [x for x in arr if x != val]
            return data

        if "$push" in update_dict:
            current = await self.find_one(filter_dict)
            if current is None:
                return None
            data = {}
            for field, val in update_dict["$push"].items():
                if isinstance(val, dict) and "$each" in val:
                    arr = list(current.get(field) or [])
                    arr.extend(val["$each"])
                    data[field] = arr
                else:
                    arr = list(current.get(field) or [])
                    arr.append(val)
                    data[field] = arr
            return data

        # Plain dict (no operator) — use as-is
        return update_dict

    def aggregate(self, pipeline: list) -> "AggregateCursor":
        return AggregateCursor(self._table, pipeline)


class AggregateCursor:
    """Client-side aggregate execution for simple $match/$lookup/$group pipelines."""

    def __init__(self, table: str, pipeline: list):
        self._table = table
        self._pipeline = pipeline

    async def to_list(self, length: Optional[int] = None) -> list:
        match_filter: dict = {}
        remaining_stages = []
        for stage in self._pipeline:
            if "$match" in stage and not match_filter:
                match_filter = stage["$match"]
            else:
                remaining_stages.append(stage)

        def _fetch():
            q = supabase.table(self._table).select("*")
            q = _apply_filter(q, match_filter)
            if length:
                q = q.limit(length * 10)
            return q.execute()

        result = await asyncio.to_thread(_fetch)
        rows: list[dict] = result.data or []

        for stage in remaining_stages:
            if "$lookup" in stage:
                cfg = stage["$lookup"]
                foreign_table = cfg["from"]
                local_field = cfg["localField"]
                foreign_field = cfg["foreignField"]
                alias = cfg["as"]

                def _fetch_foreign(t=foreign_table):
                    return supabase.table(t).select("*").execute()

                foreign_result = await asyncio.to_thread(_fetch_foreign)
                foreign_rows = foreign_result.data or []
                index: dict[str, list] = {}
                for fr in foreign_rows:
                    key = str(fr.get(foreign_field, ""))
                    index.setdefault(key, []).append(fr)
                for row in rows:
                    row[alias] = index.get(str(row.get(local_field, "")), [])

            elif "$unwind" in stage:
                field = stage["$unwind"].lstrip("$")
                new_rows = []
                for row in rows:
                    items = row.get(field, [])
                    if isinstance(items, list):
                        for item in items:
                            new_rows.append({**row, field: item})
                    else:
                        new_rows.append(row)
                rows = new_rows

            elif "$group" in stage:
                cfg = stage["$group"]
                gid = cfg.get("_id")
                group_field = gid.lstrip("$") if isinstance(gid, str) and gid.startswith("$") else None
                accumulators = {k: v for k, v in cfg.items() if k != "_id"}
                groups: dict[Any, dict] = {}
                for row in rows:
                    gkey = row.get(group_field) if group_field else gid
                    if gkey not in groups:
                        groups[gkey] = {"_id": gkey}
                        for acc_name, acc_expr in accumulators.items():
                            groups[gkey][acc_name] = 0
                    for acc_name, acc_expr in accumulators.items():
                        if "$sum" in acc_expr:
                            val = acc_expr["$sum"]
                            if val == 1:
                                groups[gkey][acc_name] += 1
                            elif isinstance(val, str):
                                groups[gkey][acc_name] += row.get(val.lstrip("$"), 0) or 0
                rows = list(groups.values())

            elif "$sort" in stage:
                for field, direction in reversed(list(stage["$sort"].items())):
                    rows.sort(key=lambda r, f=field: r.get(f) or 0, reverse=(direction == -1))

            elif "$limit" in stage:
                rows = rows[: stage["$limit"]]

        return rows[:length] if length else rows


class SupabaseDB:
    """
    Top-level DB object. Attribute access returns a SupabaseCollection.
    Usage: db.users, db.items, db.orders, …
    """

    def __getattr__(self, name: str) -> SupabaseCollection:
        if name.startswith("_"):
            raise AttributeError(name)
        return SupabaseCollection(_table_name(name))


db = SupabaseDB()
client = supabase  # legacy import compatibility
mongo_url = ""     # legacy import compatibility
