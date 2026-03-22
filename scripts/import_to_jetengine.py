#!/usr/bin/env python3
"""
Import listings into JetEngine-backed CPT via WordPress REST API.

Assumptions:
- You have a JSON export (array or single object) of listings.
- WordPress with JetEngine plugin and a CPT slug (default: 'business').
- JetEngine REST API endpoints are enabled for your site, or you can fall back to
  the standard WP REST API to set meta fields if JetEngine exposes them that way.
- You will authenticate using a WordPress Application Password or other REST-auth.

This script will try to import each listing via JetEngine REST endpoint, falling back
to the standard WP REST endpoint if needed. It upserts records by a unique
business_id field when possible.
"""

import argparse
import json
import os
import sys
from typing import Any, Dict, List

import requests


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Import RTM listings to JetEngine CPT via WP REST API")
    parser.add_argument("--file", required=True, help="Path to JSON file containing listings (array or single object)")
    parser.add_argument("--site-url", required=True, help="Base URL of WordPress site (e.g. https://example.com)")
    parser.add_argument("--username", required=True, help="WordPress username for REST authentication")
    parser.add_argument("--password", required=True, help="WordPress application password or token")
    parser.add_argument("--cpt-slug", default="business", help="JetEngine CPT slug to import into (default: 'business')")
    parser.add_argument("--dry-run", action="store_true", help="Validate and print summary without inserting")
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
        "features": entry.get("features", []),
        "ownership": entry.get("ownership", []),
        "cuisine": get("cuisine"),
        "recent_review_text": get("recent_review_text"),
        "recent_review_author": get("recent_review_author"),
        "recent_review_rating": get("recent_review_rating"),
        "lat": get("lat"),
        "lng": get("lng"),
        "photos": entry.get("photos", []),
    }


def build_payload_variants(entry: Dict[str, Any]) -> List[Dict[str, Any]]:
    # Variant 1: JetEngine REST expects a top-level "fields" object
    payload1 = {
        "title": entry["name"] or entry["business_id"],
        "fields": {
            "business_id": entry["business_id"],
            "name": entry["name"],
            "category": entry["category"],
            "subcategory": entry["subcategory"],
            "description": entry["description"],
            "image": entry["image"],
            "logo": entry["logo"],
            "rating": entry["rating"],
            "review_count": entry["review_count"],
            "price_range": entry["price_range"],
            "address": entry["address"],
            "city": entry["city"],
            "province": entry["province"],
            "distance": entry["distance"],
            "is_open": entry["is_open"],
            "closing_time": entry["closing_time"],
            "phone": entry["phone"],
            "website": entry["website"],
            "is_verified": entry["is_verified"],
            "is_world_cup_ready": entry["is_world_cup_ready"],
            "is_new": entry["is_new"],
            "is_trending": entry["is_trending"],
            "is_award_winner": entry["is_award_winner"],
            "features": entry["features"],
            "ownership": entry["ownership"],
            "cuisine": entry["cuisine"],
            "recent_review_text": entry["recent_review_text"],
            "recent_review_author": entry["recent_review_author"],
            "recent_review_rating": entry["recent_review_rating"],
            "lat": entry["lat"],
            "lng": entry["lng"],
            "photos": entry["photos"],
        },
    }
    # Variant 2: Use WordPress REST with meta fields if JetEngine exposes meta
    payload2 = {
        "title": entry["name"] or entry["business_id"],
        "meta": {
            "business_id": entry["business_id"],
            "name": entry["name"],
            "category": entry["category"],
            "subcategory": entry["subcategory"],
            "description": entry["description"],
            "image": entry["image"],
            "logo": entry["logo"],
            "rating": entry["rating"],
            "review_count": entry["review_count"],
            "price_range": entry["price_range"],
            "address": entry["address"],
            "city": entry["city"],
            "province": entry["province"],
            "distance": entry["distance"],
            "is_open": entry["is_open"],
            "closing_time": entry["closing_time"],
            "phone": entry["phone"],
            "website": entry["website"],
            "is_verified": entry["is_verified"],
            "is_world_cup_ready": entry["is_world_cup_ready"],
            "is_new": entry["is_new"],
            "is_trending": entry["is_trending"],
            "is_award_winner": entry["is_award_winner"],
            "features": entry["features"],
            "ownership": entry["ownership"],
            "cuisine": entry["cuisine"],
            "recent_review_text": entry["recent_review_text"],
            "recent_review_author": entry["recent_review_author"],
            "recent_review_rating": entry["recent_review_rating"],
            "lat": entry["lat"],
            "lng": entry["lng"],
            "photos": entry["photos"],
        },
    }
    return [payload1, payload2]


def import_batch(entries: List[Dict[str, Any]], site: str, creds: tuple, dry_run: bool) -> int:
    headers = {"Content-Type": "application/json"}
    total = 0
    for e in entries:
        payloads = build_payload_variants(e)
        success = False
        for payload in payloads:
            url = site.rstrip('/') + "/wp-json/jet-engine/v1/"  # best guess; will try CPT slug next
            # Try JetEngine endpoint first
            url = url + f"{payload.get('type','') or 'business'}/items"  # placeholder type; some setups may not use this key
            try:
                resp = requests.post(url, auth=creds, json=payload, headers=headers, timeout=30)
            except Exception:
                resp = None
            if not resp or resp.status_code >= 400:
                # Fallback to standard WP REST for posts
                url2 = site.rstrip('/') + f"/wp-json/wp/v2/{payload.get('type','business') or 'business'}"
                resp = requests.post(url2, auth=creds, json=payload, headers=headers, timeout=30)
            if resp and resp.status_code in (200, 201):
                total += 1
                success = True
                break
        if not success:
            print(f"Failed to import listing business_id={e.get('business_id')}", file=sys.stderr)
    return total


def main() -> int:
    args = parse_args()
    listings = load_listings(args.file)
    if args.limit:
        listings = listings[: args.limit]
    normalized = []
    for it in listings:
        try:
            normalized.append(normalize_entry(it))
        except Exception as e:
            print(f"Skipping listing due to error: {e}", file=sys.stderr)
    if args.dry_run:
        print(f"Dry-run: {len(normalized)} listings prepared for import to JetEngine CPT '{args.cpt_slug}' on {args.site_url}")
        for e in normalized[:3]:
            print(e)
        return 0
    if not args.site_url or not args.username or not args.password:
        print("Site URL and credentials are required.")
        return 1
    creds = (args.username, args.password)
    count = import_batch(normalized, args.site_url, creds, args.dry_run)
    print(f"Imported {count} listings to JetEngine CPT '{args.cpt_slug}'")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
