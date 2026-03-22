#!/usr/bin/env python3
"""
Import a listing (or listings) from rtmbusinessdirectory.com export into the
site's public.businesses table.

Assumptions:
- You have an export from rtmbusinessdirectory.com in JSON format. It can be a
  single object or an array of objects.
- Your target database is PostgreSQL and matches the schema used in
  public.businesses (as defined in our project).
- You have a DATABASE_URL (or --db-url) connection string with privileges to
  upsert into public.businesses.
"""

import argparse
import json
import os
import sys
from typing import Any, Dict, List

import psycopg2


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Import RTM Business Directory listing into DB")
    parser.add_argument("--file", required=True, help="Path to JSON file containing listings (array or single object)")
    parser.add_argument(
        "--db-url",
        default=os.environ.get("DATABASE_URL"),
        help="PostgreSQL connection string. Falls back to DATABASE_URL env var if not provided",
    )
    parser.add_argument("--dry-run", action="store_true", help="Validate data and print summary without inserting")
    parser.add_argument("--limit", type=int, default=None, help="Limit number of listings to import")
    return parser.parse_args()


def load_listings(path: str) -> List[Dict[str, Any]]:
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    if isinstance(data, dict):
        return [data]
    if isinstance(data, list):
        return data
    raise ValueError("JSON root must be an object or an array of objects")


def to_list(val: Any) -> List[str]:
    if val is None:
        return []
    if isinstance(val, list):
        return [str(v) for v in val]
    return [str(val)]


def normalize_entry(entry: Dict[str, Any]) -> Dict[str, Any]:
    def get(key: str, fallback=None):
        return entry.get(key, fallback)

    business_id = get("business_id") or get("id") or get("BusinessID")
    if not business_id:
        raise ValueError("Missing business_id for listing")

    return {
        "business_id": business_id,
        "name": get("name"),
        "category": get("category"),
        "subcategory": get("subcategory"),
        "description": get("description") or "",
        "image": get("image") or "",
        "logo": get("logo"),
        "rating": get("rating") if get("rating") is not None else 0,
        "review_count": get("review_count") if get("review_count") is not None else 0,
        "price_range": get("price_range") or "$$",
        "address": get("address") or "",
        "city": get("city"),
        "province": get("province"),
        "distance": get("distance"),
        "is_open": get("is_open") if get("is_open") is not None else True,
        "closing_time": get("closing_time"),
        "phone": get("phone"),
        "website": get("website"),
        "is_verified": get("is_verified") if get("is_verified") is not None else False,
        "is_world_cup_ready": get("is_world_cup_ready") if get("is_world_cup_ready") is not None else False,
        "is_new": get("is_new") if get("is_new") is not None else False,
        "is_trending": get("is_trending") if get("is_trending") is not None else False,
        "is_award_winner": get("is_award_winner") if get("is_award_winner") is not None else False,
        "features": to_list(get("features")),
        "ownership": to_list(get("ownership")),
        "cuisine": get("cuisine"),
        "recent_review_text": get("recent_review_text"),
        "recent_review_author": get("recent_review_author"),
        "recent_review_rating": get("recent_review_rating"),
        "lat": get("lat"),
        "lng": get("lng"),
        "photos": to_list(get("photos")),
    }


def build_insert_sql() -> str:
    # Parameter placeholders are 1-based for psycopg2
    return (
        """
INSERT INTO public.businesses (
  business_id, name, category, subcategory, description, image, logo,
  rating, review_count, price_range, address, city, province, distance,
  is_open, closing_time, phone, website, is_verified, is_world_cup_ready,
  is_new, is_trending, is_award_winner, features, ownership, cuisine,
  recent_review_text, recent_review_author, recent_review_rating, lat, lng, photos
)
VALUES (
  %s, %s, %s, %s, %s, %s, %s,
  %s, %s, %s, %s, %s, %s, %s, %s,
  %s, %s, %s, %s, %s, %s,
  %s, %s, %s, %s, %s, %s,
  %s, %s, %s, %s, %s, %s
)
ON CONFLICT (business_id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  subcategory = EXCLUDED.subcategory,
  description = EXCLUDED.description,
  image = EXCLUDED.image,
  logo = EXCLUDED.logo,
  rating = EXCLUDED.rating,
  review_count = EXCLUDED.review_count,
  price_range = EXCLUDED.price_range,
  address = EXCLUDED.address,
  city = EXCLUDED.city,
  province = EXCLUDED.province,
  distance = EXCLUDED.distance,
  is_open = EXCLUDED.is_open,
  closing_time = EXCLUDED.closing_time,
  phone = EXCLUDED.phone,
  website = EXCLUDED.website,
  is_verified = EXCLUDED.is_verified,
  is_world_cup_ready = EXCLUDED.is_world_cup_ready,
  is_new = EXCLUDED.is_new,
  is_trending = EXCLUDED.is_trending,
  is_award_winner = EXCLUDED.is_award_winner,
  features = EXCLUDED.features,
  ownership = EXCLUDED.ownership,
  cuisine = EXCLUDED.cuisine,
  recent_review_text = EXCLUDED.recent_review_text,
  recent_review_author = EXCLUDED.recent_review_author,
  recent_review_rating = EXCLUDED.recent_review_rating,
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng,
  photos = EXCLUDED.photos
"""
    )


def main() -> int:
    args = parse_args()
    listings = load_listings(args.file)
    if args.limit is not None:
        listings = listings[: args.limit]
    normalized = []
    for it in listings:
        try:
            normalized.append(normalize_entry(it))
        except Exception as e:
            print(f"Skipping listing due to error: {e}", file=sys.stderr)
    if args.dry_run:
        print(f"Dry-run: {len(normalized)} listings to import")
        for e in normalized[:3]:
            print(e)
        return 0

    if not args.db_url:
        print("DATABASE_URL not provided. Use --db-url or set DATABASE_URL environment variable.")
        return 1

    conn = psycopg2.connect(args.db_url)
    cur = conn.cursor()
    sql = build_insert_sql()
    values = [
        (
            e["business_id"], e["name"], e["category"], e["subcategory"], e["description"], e["image"], e["logo"],
            e["rating"], e["review_count"], e["price_range"], e["address"], e["city"], e["province"], e["distance"],
            e["is_open"], e["closing_time"], e["phone"], e["website"], e["is_verified"], e["is_world_cup_ready"],
            e["is_new"], e["is_trending"], e["is_award_winner"], e["features"], e["ownership"], e["cuisine"],
            e["recent_review_text"], e["recent_review_author"], e["recent_review_rating"], e["lat"], e["lng"], e["photos"],
        )
        for e in normalized
    ]
    cur.executemany(sql, values)
    conn.commit()
    cur.close()
    conn.close()
    print(f"Imported {len(normalized)} listings into public.businesses")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
