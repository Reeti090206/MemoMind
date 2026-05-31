import os
import sys
from dotenv import load_dotenv
load_dotenv()

import sys
sys.path.insert(0, ".")
from app.main import send_welcome_email

email = "reetikhandelwal09@gmail.com"
name = "Reeti Khandelwal"
print(f"Testing welcome email trigger to {email}...")

result = send_welcome_email({"email": email, "name": name})
print("Result:")
print("Status:", result.get("status"))
print("File Path:", result.get("file_path"))
print("Sent via SMTP:", result.get("sent_via_smtp"))
print("SMTP Error:", result.get("smtp_error"))
