import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import logging

# Configure logging
logger = logging.getLogger(__name__)

def send_email(to_email: str, subject: str, html_content: str):
    """
    Sends an email using the SMTP configuration from environment variables.
    """
    smtp_host = os.environ.get('SMTP_HOST')
    smtp_port = int(os.environ.get('SMTP_PORT', 587))
    smtp_user = os.environ.get('SMTP_USER')
    smtp_password = os.environ.get('SMTP_PASSWORD')

    if not all([smtp_host, smtp_user, smtp_password]):
        logger.warning("Email configuration missing. Email not sent.")
        return False

    try:
        msg = MIMEMultipart()
        msg['From'] = smtp_user
        msg['To'] = to_email
        msg['Subject'] = subject

        msg.attach(MIMEText(html_content, 'html'))

        # Create secure connection with server and send email
        # Adapting for Infomaniak (usually SSL 465 or STARTTLS 587)
        if smtp_port == 465:
            with smtplib.SMTP_SSL(smtp_host, smtp_port) as server:
                server.login(smtp_user, smtp_password)
                server.send_message(msg)
        else:
            with smtplib.SMTP(smtp_host, smtp_port) as server:
                server.starttls()
                server.login(smtp_user, smtp_password)
                server.send_message(msg)
        
        logger.info(f"Email sent successfully to {to_email}")
        return True

    except Exception as e:
        logger.error(f"Failed to send email: {e}")
        return False

def send_contact_notification(contact_data: dict):
    """
    Sends a notification to the admin when a new contact message is received.
    """
    admin_email = os.environ.get('SMTP_USER') # Send to self/admin
    if not admin_email:
        return

    subject = f"Nouveau message de {contact_data.get('name')} - Yondly"
    
    html_content = f"""
    <html>
        <body>
            <h2>Nouveau message reçu via le site Yondly</h2>
            <ul>
                <li><strong>Nom :</strong> {contact_data.get('name')}</li>
                <li><strong>Email :</strong> {contact_data.get('email')}</li>
                <li><strong>Sujet :</strong> {contact_data.get('subject')}</li>
            </ul>
            <hr>
            <h3>Message :</h3>
            <p style="white-space: pre-wrap;">{contact_data.get('message')}</p>
        </body>
    </html>
    """
    
    send_email(admin_email, subject, html_content)

def send_auto_reply(contact_data: dict):
    """
    Sends an auto-reply to the user who contacted us.
    """
    user_email = contact_data.get('email')
    user_name = contact_data.get('name')
    
    subject = "Nous avons bien reçu votre message - Yondly"
    
    html_content = f"""
    <html>
        <body>
            <p>Bonjour {user_name},</p>
            <p>Nous avons bien reçu votre message et nous vous remercions de l'intérêt que vous portez à Yondly.</p>
            <p>Notre équipe va prendre connaissance de votre demande et reviendra vers vous dans les plus brefs délais (généralement sous 48h).</p>
            <p>En attendant, n'hésitez pas à nous suivre sur les réseaux sociaux !</p>
            <br>
            <p>Cordialement,</p>
            <p><strong>L'équipe Yondly</strong><br>
            <a href="https://yondly.fr">www.yondly.fr</a></p>
        </body>
    </html>
    """
    
    send_email(user_email, subject, html_content)
