import os
import sys
from dotenv import load_dotenv
load_dotenv()

import sys
sys.path.insert(0, ".")
from app.main import send_welcome_email

from app.database import engine
from sqlmodel import Session

email = "reeti9206@gmail.com"
name = "Reeti"
print(f"Testing welcome email trigger to {email}...")

with Session(engine) as session:
    result = send_welcome_email({"email": email, "name": name}, session=session)
print("Result:")
print("Status:", result.get("status"))
print("File Path:", result.get("file_path"))
print("Sent via SMTP:", result.get("sent_via_smtp"))
print("SMTP Error:", result.get("smtp_error"))
