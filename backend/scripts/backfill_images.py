"""
Adds banner + interior images to restaurants that don't have any yet.
Safe to run anytime - only touches restaurants missing a cover image, so it
won't duplicate images or affect restaurants you've already photographed
for real. Works on both local SQLite and your live Supabase database
(whatever DATABASE_URL in .env currently points to).

Run from the backend/ folder (with venv activated):
    python -m scripts.backfill_images
"""
import os
import random
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.models import models as m
from scripts.image_gen import generate_banner, generate_interior


def backfill():
    db = SessionLocal()
    restaurants = db.query(m.Restaurant).filter(
        (m.Restaurant.cover_image_url.is_(None)) | (m.Restaurant.cover_image_url == "")
    ).all()

    if not restaurants:
        print("Every restaurant already has a banner image. Nothing to do.")
        db.close()
        return

    print(f"Found {len(restaurants)} restaurant(s) without images. Generating...")

    for i, restaurant in enumerate(restaurants):
        restaurant.cover_image_url = generate_banner(restaurant.name, restaurant.cuisine)

        existing_images = db.query(m.RestaurantImage).filter(
            m.RestaurantImage.restaurant_id == restaurant.id
        ).count()
        if existing_images == 0:
            for variant in range(random.randint(2, 4)):
                db.add(m.RestaurantImage(
                    restaurant_id=restaurant.id,
                    url=generate_interior(restaurant.name, variant),
                ))

        if (i + 1) % 25 == 0:
            db.commit()
            print(f"  ...{i + 1}/{len(restaurants)} done")

    db.commit()
    db.close()
    print(f"Done. Added images to {len(restaurants)} restaurant(s).")


if __name__ == "__main__":
    backfill()
