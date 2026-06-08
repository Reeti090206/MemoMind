import os
import smtplib
import logging
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Tuple, Optional, Dict, Any
from sqlmodel import Session, select
from app.models import User, EmailQueue

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("MemoMindEmailService")

def send_email_via_smtp(email: str, name: str, subject: str, html_content: str) -> Tuple[bool, Optional[str]]:
    """
    Sends an email via SMTP. Returns (success, error_message).
    """
    sender_email = os.getenv("SENDER_EMAIL", "reetikhandelwal09@gmail.com")
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = os.getenv("SMTP_PORT")
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")
    
    # Strip quotes if present
    if smtp_host: smtp_host = smtp_host.strip('"').strip("'")
    if smtp_port: smtp_port = smtp_port.strip('"').strip("'")
    if smtp_user: smtp_user = smtp_user.strip('"').strip("'")
    if smtp_password: smtp_password = smtp_password.strip('"').strip("'")
    
    if not smtp_host or not smtp_port or not smtp_user or not smtp_password:
        err = "SMTP configuration is incomplete. Please check SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD in .env."
        logger.error(f"[SMTP Config Error] {err}")
        return False, err
        
    app_url = os.getenv("FRONTEND_URL", "https://memo-mind-seven.vercel.app")
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"MemoMind AI <{sender_email}>"
        msg["To"] = email
        
        # Plaintext fallback
        text = f"{subject}\n\nWelcome to MemoMind AI, {name}! Go to {app_url} to access your workspace."
        msg.attach(MIMEText(text, "plain"))
        msg.attach(MIMEText(html_content, "html"))
        
        # Connect to server
        logger.info(f"Connecting to SMTP server {smtp_host}:{smtp_port}...")
        if smtp_port == "465":
            server = smtplib.SMTP_SSL(smtp_host, int(smtp_port), timeout=10)
        else:
            server = smtplib.SMTP(smtp_host, int(smtp_port), timeout=10)
            server.ehlo()
            server.starttls()
            server.ehlo()
            
        logger.info("Logging into SMTP server...")
        server.login(smtp_user, smtp_password)
        logger.info(f"Sending email to {email}...")
        server.sendmail(sender_email, email, msg.as_string())
        server.quit()
        logger.info(f"[SMTP Success] Email successfully sent to {email}")
        return True, None
    except Exception as e:
        err_msg = str(e)
        logger.error(f"[SMTP Error] Failed to send email to {email}: {err_msg}")
        return False, err_msg

def enqueue_welcome_email(email: str, name: str, session: Session) -> Tuple[EmailQueue, bool, str]:
    """
    Enqueues a welcome email in the database if it hasn't been sent or queued already.
    Returns (email_queue_record, was_created, backup_file_path).
    """
    email_lower = email.lower().strip()
    
    # Duplicate prevention: Check if already sent or pending in the queue
    existing = session.exec(
        select(EmailQueue)
        .where(EmailQueue.email == email_lower)
        .where(EmailQueue.status.in_(["pending", "sent", "sending"]))
    ).first()
    
    if existing:
        logger.info(f"[Duplicate Prevention] Email to {email_lower} is already in state: {existing.status}")
        # Find if a backup file already exists
        import glob
        pattern = f"sent_emails/welcome_{email_lower.replace('@', '_at_')}_*.html"
        existing_files = glob.glob(pattern)
        filename = existing_files[0] if existing_files else "sent_emails/fallback.html"
        return existing, False, os.path.abspath(filename)

    app_url = os.getenv("FRONTEND_URL", "https://memo-mind-seven.vercel.app")
    # Generate premium responsive HTML welcome email
    html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to MemoMind AI</title>
  <style>
    body {{
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #0b0b10;
      color: #e4e4e7;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }}
    .wrapper {{
      width: 100%;
      background-color: #0b0b10;
      padding: 40px 20px;
      box-sizing: border-box;
    }}
    .container {{
      max-width: 600px;
      margin: 0 auto;
      background: linear-gradient(145deg, #13131a, #0c0c12);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 24px;
      padding: 40px;
      box-sizing: border-box;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
    }}
    .logo-container {{
      margin-bottom: 30px;
      text-align: left;
    }}
    .logo {{
      font-size: 24px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.5px;
    }}
    .logo-span {{
      background: linear-gradient(to right, #06b6d4, #a855f7, #f43f5e);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }}
    .welcome-header {{
      font-size: 28px;
      font-weight: 800;
      color: #ffffff;
      line-height: 1.2;
      margin-bottom: 20px;
      letter-spacing: -0.5px;
    }}
    .greeting {{
      font-size: 16px;
      color: #a1a1aa;
      line-height: 1.6;
      margin-bottom: 30px;
    }}
    .accent-text {{
      color: #a855f7;
      font-weight: 600;
    }}
    .features-container {{
      margin-bottom: 40px;
    }}
    .feature-card {{
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.03);
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 16px;
    }}
    .feature-title {{
      font-size: 15px;
      font-weight: 700;
      color: #ffffff;
      margin: 0 0 8px 0;
      display: flex;
      align-items: center;
    }}
    .feature-icon {{
      margin-right: 8px;
      font-size: 18px;
    }}
    .feature-desc {{
      font-size: 13px;
      color: #71717a;
      line-height: 1.5;
      margin: 0;
    }}
    .cta-container {{
      text-align: center;
      margin-bottom: 40px;
    }}
    .cta-button {{
      display: inline-block;
      background: linear-gradient(135deg, #a855f7, #06b6d4);
      color: #ffffff !important;
      text-decoration: none;
      font-size: 14px;
      font-weight: 700;
      padding: 14px 30px;
      border-radius: 12px;
      transition: all 0.3s ease;
      box-shadow: 0 10px 20px rgba(168, 85, 247, 0.2);
    }}
    .footer {{
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      padding-top: 24px;
      text-align: center;
      font-size: 11px;
      color: #52525b;
      line-height: 1.5;
    }}
    .footer-links {{
      margin-bottom: 16px;
    }}
    .footer-link {{
      color: #71717a;
      text-decoration: none;
      margin: 0 10px;
    }}
    .footer-link:hover {{
      color: #a855f7;
    }}
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="logo-container">
        <div class="logo">Memo<span class="logo-span">Mind</span> AI</div>
      </div>
      <div class="welcome-header">Welcome to MemoMind AI, {name}!</div>
      <div class="greeting">
        We're thrilled to welcome you to the platform. MemoMind AI acts as your team's autonomous memory intelligence engine, mapping decisions, tasks, and conversations from your syncs automatically.
      </div>
      
      <div class="features-container">
        <div class="feature-card">
          <div class="feature-title"><span class="feature-icon">🧠</span> Autonomous Meeting Intelligence</div>
          <p class="feature-desc">Upload or stream audio from your syncs. We automatically transcribe speaker contributions and construct deep summary briefs.</p>
        </div>
        <div class="feature-card">
          <div class="feature-title"><span class="feature-icon">🌐</span> Interactive Memory Mapping</div>
          <p class="feature-desc">Visualize your decisions, pending tasks, and follow-ups in an interactive semantic relationship network.</p>
        </div>
        <div class="feature-card">
          <div class="feature-title"><span class="feature-icon">⚠️</span> Plan Contradiction Warning</div>
          <p class="feature-desc">Our AI checks decisions against previous agreements in real-time, alerting you to conflicting directions immediately.</p>
        </div>
      </div>

      <div class="cta-container">
        <a href="{app_url}" class="cta-button">Go to Dashboard</a>
      </div>

      <div class="footer">
        <div class="footer-links">
          <a href="{app_url}" class="footer-link">Dashboard</a>
          <a href="{app_url}/settings" class="footer-link">Settings</a>
          <a href="{app_url}" class="footer-link">Support</a>
        </div>
        &copy; 2026 MemoMind AI. All rights reserved. Sent to {email_lower}.<br>
        TLS 1.3 Encryption Secured • v1.2.6-stable
      </div>
    </div>
  </div>
</body>
</html>
"""

    queue_item = EmailQueue(
        email=email_lower,
        name=name,
        subject=f"Welcome to MemoMind AI, {name}!",
        body_html=html_content,
        status="pending",
        attempts=0,
        max_attempts=3
    )
    session.add(queue_item)
    session.commit()
    session.refresh(queue_item)
    
    # Save a local HTML file for backup
    try:
        os.makedirs("sent_emails", exist_ok=True)
        filename = f"sent_emails/welcome_{email_lower.replace('@', '_at_')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
        with open(filename, "w", encoding="utf-8") as f:
            f.write(html_content)
        logger.info(f"[Email Saved Locally] Backup saved to {filename}")
    except Exception as e:
        logger.error(f"[Local Save Error] Failed to write local email file: {e}")
        
    logger.info(f"[Email Queued] Welcome email for {email_lower} successfully queued (id={queue_item.id}).")
    return queue_item, True, os.path.abspath(filename)

def process_email_queue_sync(session: Session):
    """
    Scans the email queue and processes pending/failed items.
    """
    statement = select(EmailQueue).where(
        EmailQueue.status.in_(["pending", "failed"])
    ).where(
        EmailQueue.attempts < EmailQueue.max_attempts
    )
    items = session.exec(statement).all()
    
    if not items:
        return
        
    logger.info(f"[Scheduler] Processing {len(items)} items in email queue...")
    
    for item in items:
        item.status = "sending"
        session.add(item)
        session.commit()
        session.refresh(item)
        
        logger.info(f"[Email Triggered] Triggering email delivery for {item.email} (attempt {item.attempts + 1})...")
        
        email_lower = item.email.lower().strip()
        is_mock_email = (
            email_lower.endswith("@memomind.ai")
            or email_lower.endswith("@meetgraph.ai")
            or "speaker" in email_lower
            or "david" in email_lower
            or "@" not in email_lower
        )
        
        if is_mock_email:
            logger.info(f"[Email Queue] Skipping SMTP for mock email: {item.email}")
            success, error_msg = True, None
        else:
            success, error_msg = send_email_via_smtp(
                email=item.email,
                name=item.name,
                subject=item.subject,
                html_content=item.body_html
            )
        
        item.attempts += 1
        item.processed_at = datetime.utcnow()
        
        if success:
            item.status = "sent"
            item.error_message = None
            logger.info(f"[Email Delivered] Delivered welcome email to {item.email}")
            
            # Update User profile flags
            user = session.exec(select(User).where(User.email == item.email)).first()
            if user:
                user.welcome_email_sent = True
                user.onboarding_email_sent = True
                session.add(user)
                logger.info(f"[User Sync] Updated onboardingEmailSent and welcome_email_sent to True for user: {item.email}")
        else:
            item.error_message = error_msg
            if item.attempts >= item.max_attempts:
                item.status = "failed"
                logger.error(f"[Email Failure] Email to {item.email} failed permanently after {item.attempts} attempts: {error_msg}")
            else:
                item.status = "failed" # will be retried on next loop
                logger.warning(f"[Email Queued Retry] Email to {item.email} failed (attempt {item.attempts}). Will retry: {error_msg}")
                
        session.add(item)
        session.commit()
