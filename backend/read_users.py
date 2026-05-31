from sqlmodel import Session, select
from app.database import engine
from app.models import User

with Session(engine) as session:
    users = session.exec(select(User)).all()
    print(f"Total users: {len(users)}")
    for u in users:
        print(f"Name: {u.name}, Email: {u.email}, Phone: {u.phone}")
