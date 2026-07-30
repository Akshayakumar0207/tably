"""
Adds/upgrades restaurant images.

- Restaurants with NO image get one.
- Restaurants whose image is one of our generated placeholder graphics
  (data:image/svg+xml...) get upgraded to a real photo, IF a PEXELS_API_KEY
  is configured in .env - otherwise they're left as-is.
- Restaurants with a real photo already (uploaded by an owner, or a
  previously-fetched real photo) are never touched.

Works on both local SQLite and your live Supabase database (whatever
DATABASE_URL in .env currently points to).

Run from the backend/ folder (with venv activated):
    python -m scripts.backfill_images
"""
import os
import random
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.core.config import settings
from app.models import models as m
from scripts.image_gen import generate_banner, generate_interior
from scripts.pexels_fetch import build_photo_pools, pick_banner, pick_interiors

PLACEHOLDER_PREFIX = "data:image/svg+xml"


def _is_placeholder_or_empty(url: str | None) -> bool:
    return not url or url.startswith(PLACEHOLDER_PREFIX)


def backfill():
    db = SessionLocal()
    photo_pools = build_photo_pools(settings.PEXELS_API_KEY)
    has_real_photos = bool(photo_pools)

    all_restaurants = db.query(m.Restaurant).all()
    targets = [r for r in all_restaurants if _is_placeholder_or_empty(r.cover_image_url)]

    if not targets:
        print("Every restaurant already has a real (non-placeholder) image. Nothing to do.")
        db.close()
        return

    if not has_real_photos:
        already_placeholder = sum(1 for r in all_restaurants if r.cover_image_url and r.cover_image_url.startswith(PLACEHOLDER_PREFIX))
        if already_placeholder and not any(r.cover_image_url is None or r.cover_image_url == "" for r in all_restaurants):
            print(f"{already_placeholder} restaurant(s) currently have generated placeholder graphics.")
            print("Set PEXELS_API_KEY in .env to upgrade them to real photos - see RUN_INSTRUCTIONS.md.")
            print("Running without it will just keep/regenerate placeholder graphics for anything missing an image.")

    print(f"Updating {len(targets)} restaurant(s)...")

    for i, restaurant in enumerate(targets):
        real_banner = pick_banner(photo_pools, restaurant.cuisine)
        restaurant.cover_image_url = real_banner or generate_banner(restaurant.name, restaurant.cuisine)

        existing_images = db.query(m.RestaurantImage).filter(
            m.RestaurantImage.restaurant_id == restaurant.id
        ).all()
        existing_are_upgradeable = all(_is_placeholder_or_empty(img.url) for img in existing_images)

        if existing_are_upgradeable:
            for img in existing_images:
                db.delete(img)
            interior_count = max(len(existing_images), random.randint(2, 4))
            real_interiors = pick_interiors(photo_pools, interior_count)
            urls = real_interiors + [
                generate_interior(restaurant.name, v) for v in range(interior_count - len(real_interiors))
            ]
            for url in urls:
                db.add(m.RestaurantImage(restaurant_id=restaurant.id, url=url))

        if (i + 1) % 25 == 0:
            db.commit()
            print(f"  ...{i + 1}/{len(targets)} done")

    db.commit()
    db.close()
    kind = "real photos" if has_real_photos else "placeholder graphics"
    print(f"Done. Updated {len(targets)} restaurant(s) with {kind}.")


if __name__ == "__main__":
    backfill()
