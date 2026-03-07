import os
import logging
import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException
from dotenv import load_dotenv
from pathlib import Path

# Load env vars
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

logger = logging.getLogger(__name__)

# Configuration
BREVO_API_KEY = os.getenv("BREVO_API_KEY")
SENDER_EMAIL = os.getenv("SENDER_EMAIL", "no-reply@yondly.com")
SENDER_NAME = os.getenv("SENDER_NAME", "L'équipe Yondly")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "contact@yondly.com")

def get_api_instance():
    """Get authenticated Brevo API instance"""
    if not BREVO_API_KEY:
        logger.warning("BREVO_API_KEY not set. Email sending disabled.")
        return None
        
    configuration = sib_api_v3_sdk.Configuration()
    configuration.api_key['api-key'] = BREVO_API_KEY
    return sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))

async def send_email(to_email: str, to_name: str, subject: str, html_content: str):
    """Generic function to send an email"""
    api_instance = get_api_instance()
    if not api_instance:
        return False

    sender = {"name": SENDER_NAME, "email": SENDER_EMAIL}
    to = [{"email": to_email, "name": to_name}]
    
    send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
        to=to,
        sender=sender,
        subject=subject,
        html_content=html_content
    )

    try:
        api_instance.send_transac_email(send_smtp_email)
        logger.info(f"Email sent to {to_email}")
        return True
    except ApiException as e:
        logger.error(f"Error sending email to {to_email}: {e}")
        return False

async def send_contact_confirmation(user_email: str, user_name: str, message: str):
    """Send confirmation to user who submitted contact form"""
    subject = "Nous avons bien reçu votre message ! 🚀"
    content = f"""
    <html>
    <body>
        <h2>Bonjour {user_name},</h2>
        <p>Merci de nous avoir contactés. Nous avons bien reçu votre message :</p>
        <blockquote style="background: #f9f9f9; padding: 10px; border-left: 4px solid #4C7B4B;">
            {message}
        </blockquote>
        <p>Notre équipe va vous répondre dans les plus brefs délais.</p>
        <br>
        <p>À très vite,</p>
        <p><strong>L'équipe Yondly</strong></p>
    </body>
    </html>
    """
    await send_email(user_email, user_name, subject, content)

    # Notify Admin
    admin_subject = f"[Yondly Contact] Nouveau message de {user_name}"
    admin_content = f"""
    <html>
    <body>
        <h3>Nouveau message reçu</h3>
        <p><strong>Nom:</strong> {user_name}</p>
        <p><strong>Email:</strong> {user_email}</p>
        <p><strong>Message:</strong></p>
        <pre>{message}</pre>
    </body>
    </html>
    """
    await send_email(ADMIN_EMAIL, "Admin Yondly", admin_subject, admin_content)

async def send_waitlist_confirmation(user_email: str, city: str = None):
    """Send confirmation for waitlist signup"""
    subject = "Bienvenue sur la liste d'attente Yondly ! 🌱"
    content = f"""
    <html>
    <body>
        <h2>Merci de votre inscription !</h2>
        <p>Vous faites désormais partie de la liste d'attente Yondly.</p>
        <p>Nous vous tiendrons informé dès que l'application sera disponible{" à " + city if city else ""}.</p>
        <br>
        <p>En attendant, suivez-nous sur nos réseaux sociaux !</p>
        <p><strong>L'équipe Yondly</strong></p>
    </body>
    </html>
    """
    await send_email(user_email, user_email.split('@')[0], subject, content)
