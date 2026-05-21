import uvicorn
import sys
import os
from dotenv import load_dotenv

if __name__ == "__main__":
    # Load environment variables from .env
    load_dotenv()
    # Ensure correct working directory is added to sys.path
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
