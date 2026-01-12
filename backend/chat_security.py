import re
from typing import Tuple, Optional

# Keywords that suggest platform circumvention
SUSPICIOUS_KEYWORDS = [
    r'paypal', r'lydia', r'pumpkin', r'cash app', r'venmo', r'western union', r'mandat cash', 
    r'virement', r'rib', r'iban', r'paylib', r'espece', r'espèce', r'liquide'
]

# Regex patterns for contact info
PATTERNS = {
    'email': r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+',
    'phone_fr': r'(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}',
    # Extended IBAN: Any 2-letter country code + 2 check digits + 11-30 alphanumeric BBAN
    # Supports: spaces, dashes, dots, or no separator between groups
    'iban': r'[A-Z]{2}[\s\-\.]*\d{2}[\s\-\.]*(?:[\dA-Z][\s\-\.]*){11,30}',
    'url': r'https?://(?:[-\w.]|(?:%[\da-fA-F]{2}))+'
}

def check_message_content(text: str) -> Tuple[bool, str, Optional[str]]:
    """
    Analyze message content for forbidden contact info or keywords.
    Returns: (is_blocked, cleaned_text, reason)
    """
    original_text = text
    is_suspicious = False
    reason = None

    # 1. Check Keywords
    for keyword in SUSPICIOUS_KEYWORDS:
        if re.search(keyword, text, re.IGNORECASE):
            is_suspicious = True
            reason = "PAYMENT_KEYWORD"
            # We might not block strictly on keywords (context matters), 
            # but for this strict safety module, we flag it.
            # Masking keyword:
            text = re.sub(keyword, '[BLOCKED]', text, flags=re.IGNORECASE)

    # 2. Check IBAN (before phone to avoid false positives)
    if re.search(PATTERNS['iban'], text):
        is_suspicious = True
        reason = "IBAN"
        text = re.sub(PATTERNS['iban'], '[IBAN_HIDDEN]', text)

    # 3. Check Phone Numbers
    if re.search(PATTERNS['phone_fr'], text):
        is_suspicious = True
        reason = "PHONE_NUMBER"
        text = re.sub(PATTERNS['phone_fr'], '[PHONE_HIDDEN]', text)

    # 4. Check Emails
    if re.search(PATTERNS['email'], text):
        is_suspicious = True
        reason = "EMAIL"
        text = re.sub(PATTERNS['email'], '[EMAIL_HIDDEN]', text)
        
    # 5. Check URLs
    if re.search(PATTERNS['url'], text):
        # We might whitelist some internal URLs later
        is_suspicious = True
        reason = "URL"
        text = re.sub(PATTERNS['url'], '[LINK_HIDDEN]', text)

    if is_suspicious:
        return True, text, reason
    
    return False, original_text, None
