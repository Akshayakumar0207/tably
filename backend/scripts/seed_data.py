"""
Seed script — populates the database with ~200 realistic dummy restaurants
for demo/testing purposes.

Run from the backend/ folder (with venv activated):
    python -m scripts.seed_data

Safe to re-run: it checks for existing seed data and skips re-seeding if
already present. To start over, delete tablereserve.db (local SQLite) and
run again, or set RESEED=1 to force-add another batch.
"""
import os
import random
import sys
from datetime import time, datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal, Base, engine
from app.core.security import hash_password
from app.models import models as m
from scripts.image_gen import generate_banner, generate_interior

random.seed(42)

CITIES = ["Chennai", "Bangalore", "Salem", "Coimbatore"]
CUISINES = ["North Indian", "South Indian", "Chinese", "Italian", "Continental", "Multi-Cuisine", "Fast Food"]

NAME_PREFIXES = [
    "Spice", "Royal", "Golden", "Green", "Urban", "The", "Copper", "Silver", "Coastal", "Heritage",
    "Saffron", "Bombay", "Chennai", "Malabar", "Namma", "Curry", "Tandoor", "Banana Leaf", "Roots",
    "Anna", "Amma's", "Grand", "Blue", "Red", "Sunset", "Garden", "Old Town", "Village", "Vintage", "Pearl",
]
NAME_CORE = [
    "Garden", "Kitchen", "House", "Palace", "Diner", "Bistro", "Grill", "Corner", "Cafe", "Hut",
    "Terrace", "Courtyard", "Villa", "Table", "Pavilion", "Junction", "Bites", "Kadai", "Mess",
    "Restaurant", "Eatery", "Feast", "Platter", "Adda", "Spot", "Lounge", "Deck", "Barbecue", "Tiffin",
]
NAME_SUFFIXES = ["", "", "", " & Co", " Express", " Family Restaurant", " Multicuisine", " Fine Dine"]

AREAS = [
    "MG Road", "Anna Nagar", "T Nagar", "Indiranagar", "Koramangala", "RS Puram", "Race Course Road",
    "Whitefield", "Adyar", "Velachery", "Fort", "Gandhipuram", "Peelamedu", "Yeshwanthpur", "Sarjapur Road",
    "OMR", "ECR", "Nungambakkam", "Mylapore", "Jayanagar", "HSR Layout", "Cross Cut Road", "Five Roads",
]

REVIEW_COMMENTS = [
    "Great food and quick service.", "Loved the ambience, will visit again.", "Good value for money.",
    "Staff were very courteous.", "Food was a bit slow but tasted great.", "Perfect spot for family dinners.",
    "Best biryani in the area.", "Cozy place, ideal for a quiet evening.", "Portions were generous.",
    "Highly recommend the window seats.", "Clean and well-maintained restaurant.", "A bit noisy but food made up for it.",
]

FIRST_NAMES = ["Arun", "Priya", "Karthik", "Divya", "Suresh", "Meena", "Rahul", "Anitha", "Vijay", "Lakshmi",
               "Naveen", "Deepa", "Sanjay", "Kavya", "Ramesh", "Swathi", "Ajay", "Pooja", "Manoj", "Revathi"]
LAST_NAMES = ["Kumar", "Raj", "Iyer", "Nair", "Pillai", "Sharma", "Reddy", "Menon", "Gupta", "Rao"]


def random_name():
    return f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"


def random_restaurant_name(used: set) -> str:
    for _ in range(50):
        name = f"{random.choice(NAME_PREFIXES)} {random.choice(NAME_CORE)}{random.choice(NAME_SUFFIXES)}".strip()
        if name not in used:
            used.add(name)
            return name
    return f"{random.choice(NAME_PREFIXES)} {random.choice(NAME_CORE)} {random.randint(1, 999)}"


def build_tables(restaurant_id: str, db):
    count = random.randint(5, 9)
    shapes = [m.TableShape.circle, m.TableShape.rectangle]
    positions = [(x, y) for x in (100, 250, 400, 550) for y in (90, 220, 340)]
    random.shuffle(positions)
    for i in range(count):
        shape = random.choice(shapes)
        capacity = random.choice([2, 2, 4, 4, 4, 6, 8])
        status_roll = random.random()
        status = m.TableStatus.available if status_roll < 0.75 else (
            m.TableStatus.occupied if status_roll < 0.9 else m.TableStatus.disabled
        )
        pos_x, pos_y = positions[i % len(positions)]
        table = m.RestaurantTable(
            restaurant_id=restaurant_id,
            table_number=f"T{i + 1}",
            shape=shape,
            capacity=capacity,
            pos_x=pos_x, pos_y=pos_y,
            width=60 if shape == m.TableShape.circle else 90,
            height=60 if shape == m.TableShape.circle else 55,
            is_window=random.random() < 0.3,
            is_ac=random.random() < 0.8,
            status=status,
        )
        db.add(table)


def get_or_create_owner(db, index: int) -> m.OwnerProfile:
    email = f"owner{index}@tablereserve-demo.com"
    user = db.query(m.User).filter(m.User.email == email).first()
    if user:
        return user.owner_profile
    name = random_name()
    user = m.User(
        email=email,
        hashed_password=hash_password("password123"),
        full_name=name,
        phone=f"9{random.randint(100000000, 999999999)}",
        role=m.UserRole.owner,
        is_verified=True,
    )
    db.add(user)
    db.flush()
    profile = m.OwnerProfile(user_id=user.id, business_name=f"{name} Restaurants Pvt Ltd", is_verified=True)
    db.add(profile)
    db.flush()
    return profile


def get_or_create_customers(db, n: int) -> list[m.User]:
    customers = []
    for i in range(n):
        email = f"customer{i}@tablereserve-demo.com"
        user = db.query(m.User).filter(m.User.email == email).first()
        if not user:
            user = m.User(
                email=email,
                hashed_password=hash_password("password123"),
                full_name=random_name(),
                role=m.UserRole.customer,
                is_verified=True,
            )
            db.add(user)
            db.flush()
        customers.append(user)
    return customers


def seed(total_restaurants: int = 200, num_owners: int = 25, num_customers: int = 30):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    already = db.query(m.Restaurant).filter(m.Restaurant.description.like("%[demo seed]%")).count()
    if already >= total_restaurants and not os.environ.get("RESEED"):
        print(f"Already have {already} seeded restaurants. Set RESEED=1 to add another batch anyway.")
        db.close()
        return

    print("Seeding dummy data — this may take a minute...")

    # Ensure a demo admin exists for convenience
    if not db.query(m.User).filter(m.User.email == "admin@tablereserve-demo.com").first():
        db.add(m.User(
            email="admin@tablereserve-demo.com",
            hashed_password=hash_password("password123"),
            full_name="Demo Admin",
            role=m.UserRole.admin,
            is_verified=True,
        ))
        db.flush()

    customers = get_or_create_customers(db, num_customers)
    used_names: set = set()

    for i in range(total_restaurants):
        owner_profile = get_or_create_owner(db, i % num_owners)
        city = random.choice(CITIES)
        cuisine = random.choice(CUISINES)
        name = random_restaurant_name(used_names)
        open_hour = random.choice([7, 8, 9, 10, 11])
        close_hour = random.choice([21, 22, 23])
        # ~90% approved (so search works immediately), ~10% left pending to demo admin approval
        status = m.RestaurantStatus.approved if random.random() < 0.9 else m.RestaurantStatus.pending

        restaurant = m.Restaurant(
            owner_id=owner_profile.id,
            name=name,
            description=f"A popular {cuisine.lower()} spot known for great food and friendly service. [demo seed]",
            cuisine=cuisine,
            address=f"{random.randint(1, 200)}, {random.choice(AREAS)}",
            city=city,
            latitude=None,
            longitude=None,
            phone=f"9{random.randint(100000000, 999999999)}",
            opening_time=time(open_hour, 0),
            closing_time=time(close_hour, 0),
            status=status,
            cover_image_url=generate_banner(name, cuisine),
            avg_rating=0.0,
            review_count=0,
        )
        db.add(restaurant)
        db.flush()

        for variant in range(random.randint(2, 4)):
            db.add(m.RestaurantImage(restaurant_id=restaurant.id, url=generate_interior(name, variant)))

        build_tables(restaurant.id, db)

        # Add reviews only to approved restaurants, to populate ratings realistically
        if status == m.RestaurantStatus.approved and random.random() < 0.7:
            num_reviews = random.randint(1, 8)
            reviewers = random.sample(customers, min(num_reviews, len(customers)))
            ratings = []
            for reviewer in reviewers:
                rating = random.choice([3, 4, 4, 4, 5, 5, 5])
                ratings.append(rating)
                db.add(m.Review(
                    user_id=reviewer.id,
                    restaurant_id=restaurant.id,
                    rating=rating,
                    comment=random.choice(REVIEW_COMMENTS),
                    created_at=datetime.utcnow() - timedelta(days=random.randint(1, 200)),
                ))
            restaurant.avg_rating = round(sum(ratings) / len(ratings), 2)
            restaurant.review_count = len(ratings)

        if (i + 1) % 25 == 0:
            db.commit()
            print(f"  ...{i + 1}/{total_restaurants} restaurants created")

    db.commit()
    db.close()
    print(f"Done. Seeded {total_restaurants} restaurants across {num_owners} owner accounts and {num_customers} customer accounts.")
    print()
    print("Demo login credentials (all use password: password123):")
    print("  Admin:     admin@tablereserve-demo.com")
    print("  Owner:     owner0@tablereserve-demo.com  (through owner24@tablereserve-demo.com)")
    print("  Customer:  customer0@tablereserve-demo.com  (through customer29@tablereserve-demo.com)")


if __name__ == "__main__":
    seed()
