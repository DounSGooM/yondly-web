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
            with smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=5) as server:
                server.login(smtp_user, smtp_password)
                server.send_message(msg)
        else:
            with smtplib.SMTP(smtp_host, smtp_port, timeout=5) as server:
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

def send_waitlist_admin_notification(entry_data: dict):
    """
    Sends a notification to the admin when a new user joins the waitlist.
    """
    admin_email = os.environ.get('SMTP_USER') # Send to self/admin
    if not admin_email:
        return

    subject = f"Nouvelle inscription Waitlist : {entry_data.get('email')}"

    html_content = f"""
    <html>
        <body>
            <h2>Nouvelle inscription à la liste d'attente Yondly ! 🎉</h2>
            <ul>
                <li><strong>Email :</strong> {entry_data.get('email')}</li>
                <li><strong>Statut :</strong> {entry_data.get('status', 'Particulier')}</li>
                <li><strong>Ville :</strong> {entry_data.get('city', 'Non renseignée')}</li>
                <li><strong>Date :</strong> {entry_data.get('created_at', '')}</li>
            </ul>
        </body>
    </html>
    """

    send_email(admin_email, subject, html_content)

def send_waitlist_confirmation(entry_data: dict):
    """
    Sends a confirmation email to the user joining the waitlist.
    """
    user_email = entry_data.get('email')
    city = entry_data.get('city', '')

    subject = "Bienvenue sur la liste d'attente Yondly ! 🌱"

    html_content = f"""
    <html>
        <body>
            <h2>Merci de votre inscription !</h2>
            <p>Vous faites désormais partie de la liste d'attente Yondly.</p>
            <p>Nous vous tiendrons informé dès que l'application sera disponible{" à " + city if city else ""}.</p>
            <br>
            <p>En attendant, n'hésitez pas à nous suivre sur les réseaux sociaux !</p>
            <br>
            <p><strong>L'équipe Yondly</strong><br>
            <a href="https://yondly.app">www.yondly.app</a></p>
        </body>
    </html>
    """

    send_email(user_email, subject, html_content)

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

def send_verification_email(to_email: str, code: str):
    """
    Sends a 6-digit verification code to the user's email.
    """
    subject = "Votre code de vérification Yondly"

    html_content = f"""
    <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; padding: 20px;">
            <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <div style="background: #4C7B4B; padding: 32px; text-align: center;">
                    <h1 style="color: #fff; margin: 0; font-size: 28px; letter-spacing: 0.5px;">Yondly</h1>
                    <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Marketplace communautaire</p>
                </div>
                <div style="padding: 32px; text-align: center;">
                    <p style="color: #333; font-size: 16px; margin: 0 0 8px;">Bienvenue ! Voici votre code de vérification :</p>
                    <div style="background: #f0f7f0; border: 2px solid #4C7B4B; border-radius: 12px; padding: 20px; margin: 24px 0;">
                        <span style="font-size: 36px; font-weight: bold; color: #4C7B4B; letter-spacing: 8px;">{code}</span>
                    </div>
                    <p style="color: #888; font-size: 13px; margin: 0;">Ce code expire dans <strong>10 minutes</strong>.</p>
                    <p style="color: #888; font-size: 13px; margin: 8px 0 0;">Si vous n'avez pas créé de compte, ignorez cet email.</p>
                </div>
                <div style="background: #f9f9f9; padding: 16px; text-align: center; border-top: 1px solid #eee;">
                    <p style="color: #aaa; font-size: 12px; margin: 0;">&copy; Yondly — yondly.app</p>
                </div>
            </div>
        </body>
    </html>
    """

    return send_email(to_email, subject, html_content)

def send_password_reset_email(to_email: str, code: str):
    """
    Sends a 6-digit password reset code to the user's email.
    """
    subject = "Réinitialisation de votre mot de passe Yondly"

    html_content = f"""
    <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; padding: 20px;">
            <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <div style="background: #4C7B4B; padding: 32px; text-align: center;">
                    <h1 style="color: #fff; margin: 0; font-size: 28px; letter-spacing: 0.5px;">Yondly</h1>
                    <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Réinitialisation du mot de passe</p>
                </div>
                <div style="padding: 32px; text-align: center;">
                    <p style="color: #333; font-size: 16px; margin: 0 0 8px;">Vous avez demandé à réinitialiser votre mot de passe. Voici votre code :</p>
                    <div style="background: #f0f7f0; border: 2px solid #4C7B4B; border-radius: 12px; padding: 20px; margin: 24px 0;">
                        <span style="font-size: 36px; font-weight: bold; color: #4C7B4B; letter-spacing: 8px;">{code}</span>
                    </div>
                    <p style="color: #888; font-size: 13px; margin: 0;">Ce code expire dans <strong>10 minutes</strong>.</p>
                    <p style="color: #888; font-size: 13px; margin: 8px 0 0;">Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
                </div>
                <div style="background: #f9f9f9; padding: 16px; text-align: center; border-top: 1px solid #eee;">
                    <p style="color: #aaa; font-size: 12px; margin: 0;">&copy; Yondly — yondly.app</p>
                </div>
            </div>
        </body>
    </html>
    """

    return send_email(to_email, subject, html_content)
