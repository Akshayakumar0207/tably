"""
Fetches real, free-to-use restaurant photos from the Pexels API
(https://www.pexels.com/api/) for seed/demo data.

Entirely optional: if PEXELS_API_KEY isn't set in .env, callers should fall
back to the generated placeholder graphics in image_gen.py - the app works
fully either way, this just upgrades demo data from graphics to real photos.

Efficient by design: fetches one pool of photos per search query (not one
request per restaurant), so seeding 200 restaurants costs ~10 API calls
total, well within Pexels' free tier (200 requests/hour, 20,000/month).
"""
import random

try:
    import requests
except ImportError:
    requests = None

PEXELS_SEARCH_URL = "https://api.pexels.com/v1/search"

CUISINE_QUERIES = {
    "North Indian": "indian restaurant food",
    "South Indian": "south indian food restaurant",
    "Chinese": "chinese restaurant food",
    "Italian": "italian restaurant pizza pasta",
    "Continental": "fine dining restaurant food",
    "Multi-Cuisine": "restaurant food plate",
    "Fast Food": "burger fast food restaurant",
}
INTERIOR_QUERY = "restaurant interior dining"


def _fetch_pool(query: str, api_key: str, count: int = 20) -> list[str]:
    """Returns a list of photo URLs for a search query, or [] on any failure."""
    if not requests or not api_key:
        return []
    try:
        resp = requests.get(
            PEXELS_SEARCH_URL,
            headers={"Authorization": api_key},
            params={"query": query, "per_page": min(count, 80), "orientation": "landscape"},
            timeout=10,
        )
        if resp.status_code != 200:
            print(f"  [pexels] '{query}' failed with status {resp.status_code}, using placeholders instead")
            return []
        data = resp.json()
        photos = data.get("photos", [])
        return [p["src"]["large"] for p in photos if p.get("src", {}).get("large")]
    except Exception as e:
        print(f"  [pexels] '{query}' request failed ({e}), using placeholders instead")
        return []


def build_photo_pools(api_key: str) -> dict:
    """
    Fetches a pool of real photo URLs per cuisine plus a general interior
    pool. Returns a dict: {cuisine: [urls...], "interior": [urls...]}.
    Any cuisine that fails to fetch simply gets an empty list - callers
    should fall back to generated graphics for those.
    """
    if not api_key:
        print("No PEXELS_API_KEY set - using generated placeholder graphics instead of real photos.")
        return {}

    print("Fetching real restaurant photos from Pexels...")
    pools = {}
    for cuisine, query in CUISINE_QUERIES.items():
        pools[cuisine] = _fetch_pool(query, api_key, count=20)
    pools["interior"] = _fetch_pool(INTERIOR_QUERY, api_key, count=40)
    total = sum(len(v) for v in pools.values())
    print(f"Fetched {total} real photos across {len(pools)} categories.")
    return pools


def pick_banner(pools: dict, cuisine: str) -> str | None:
    pool = pools.get(cuisine) or []
    return random.choice(pool) if pool else None


def pick_interiors(pools: dict, count: int) -> list[str]:
    pool = pools.get("interior") or []
    if not pool:
        return []
    return random.sample(pool, min(count, len(pool)))
