"""
Legal Templates for PRO Checkout
Versioned legal texts with variable placeholders
"""

# Current version - update when legal texts change
LEGAL_VERSION = "2026-01-01.v1"

# Platform role banner (displayed on offer page + checkout)
PLATFORM_ROLE_TEXT = """Yondly est une plateforme de mise en relation. Le contrat (vente ou location) est conclu directement entre vous et le professionnel. Yondly n'est pas le vendeur/locataire et n'assure pas la livraison : retrait ou remise en main propre uniquement."""

# Anti-gaspi checkout legal text template
CHECKOUT_ORDER_TEMPLATE = {
    "version": LEGAL_VERSION,
    "sections": [
        {
            "title": "Vendeur",
            "template": "{{pro.trade_name}} — {{pro.legal_name}} — SIRET : {{pro.siret}}"
        },
        {
            "title": "Contact",
            "template": "{{pro.contact_email}} — {{pro.contact_phone}}"
        },
        {
            "title": "Produit/Offre",
            "template": "{{offer.title}} — Quantité : {{order.qty}}"
        },
        {
            "title": "Prix total TTC",
            "template": "{{total_price}}"
        },
        {
            "title": "Modalités de retrait",
            "template": "{{pickup_slot_start}} – {{pickup_slot_end}}\n{{pickup_instructions}}"
        }
    ],
    "food_section": {
        "title": "Informations denrées",
        "allergens_template": "Allergènes (informations fournies par le professionnel) : {{allergens_text | 'Non renseigné'}}",
        "date_template": "Type de date : {{date_type}} — Date : {{date_value | 'Non renseignée'}}"
    },
    "retractation_perishable": """Important : certains produits périssables ne bénéficient pas du droit de rétractation. En payant, vous reconnaissez acheter un produit destiné à être retiré rapidement.""",
    "retractation_general": """Pour les achats à distance, un droit de rétractation peut s'appliquer selon la nature du produit. Les exceptions (notamment périssable) peuvent s'appliquer.""",
    "mediation_template": """En cas de litige non résolu avec le professionnel, vous pouvez contacter son médiateur :
{{pro.mediator_name}} — {{pro.mediator_url}} — {{pro.mediator_contact}}""",
    "checkbox_text": "J'ai lu et j'accepte les informations ci-dessus et je comprends que le contrat est conclu avec le professionnel."
}

# Rental checkout legal text template
CHECKOUT_RENTAL_TEMPLATE = {
    "version": LEGAL_VERSION,
    "sections": [
        {
            "title": "Loueur",
            "template": "{{pro.trade_name}} — {{pro.legal_name}} — SIRET : {{pro.siret}}"
        },
        {
            "title": "Contact",
            "template": "{{pro.contact_email}} — {{pro.contact_phone}}"
        },
        {
            "title": "Objet loué",
            "template": "{{offer.title}}"
        },
        {
            "title": "Période",
            "template": "{{rental.start_at}} → {{rental.end_at}}"
        },
        {
            "title": "Prix location TTC",
            "template": "{{rental_price}}"
        },
        {
            "title": "Dépôt de garantie (empreinte CB)",
            "template": "{{deposit_amount}}"
        },
        {
            "title": "Retard",
            "template": "Pénalité : {{late_fee_per_day}} / jour de retard (selon conditions du professionnel)."
        },
        {
            "title": "Remise / retour",
            "template": "Remise en main propre (pas de livraison)."
        }
    ],
    "retractation_text": """La location est un service. Selon la date de début, un droit de rétractation peut exister. Si vous souhaitez que la location démarre immédiatement (avant la fin d'un éventuel délai légal), vous pouvez demander l'exécution immédiate.""",
    "immediate_execution_checkbox": "Je demande l'exécution immédiate si la location démarre avant la fin d'un éventuel délai de rétractation.",
    "loss_right_checkbox": "Je comprends que si la prestation est pleinement exécutée, je peux perdre mon droit de rétractation.",
    "mediation_template": """Médiateur du professionnel : {{pro.mediator_name}} — {{pro.mediator_url}} — {{pro.mediator_contact}}""",
    "checkbox_text": "J'ai lu et j'accepte les informations ci-dessus et je comprends que le contrat est conclu avec le professionnel."
}

# Transparency page default texts
DEFAULT_RANKING_TEXT = """Trier / classer les offres :
- Proximité géographique (ville/zone)
- Disponibilités (créneaux de retrait / dates de location)
- Pertinence catégorie & mots-clés
- Qualité de l'annonce (photos, description complète, infos légales renseignées)
- Historique de fiabilité (annulations répétées, no-show, litiges)
- Signalements et modération

Yondly ne vend pas les produits : le professionnel reste responsable de son offre."""

DEFAULT_DEREFERENCING_TEXT = """Une offre peut être suspendue ou supprimée si :
- informations obligatoires manquantes (identité, médiation, dates, retrait)
- contenu trompeur / illégal / dangereux
- signalements répétés, fraude, non-respect des règles d'usage
- pro non vérifié, paiements désactivés, ou comportement abusif
- non-respect des conditions de retrait/remise ou litiges graves"""


def get_checkout_order_texts(pro: dict, offer: dict, order: dict, antigaspi: dict) -> dict:
    """Generate filled legal texts for anti-gaspi checkout"""
    from datetime import datetime

    # Format helpers
    def format_date(dt):
        if isinstance(dt, str):
            try:
                dt = datetime.fromisoformat(dt.replace('Z', '+00:00'))
            except:
                return dt
        return dt.strftime("%d/%m/%Y %H:%M") if dt else "Non renseignée"

    def format_price(cents):
        return f"{cents/100:.2f}€"

    # Build sections
    sections = []
    template = CHECKOUT_ORDER_TEMPLATE

    for section in template["sections"]:
        text = section["template"]
        text = text.replace("{{pro.trade_name}}", pro.get("trade_name", pro.get("legal_name", "")))
        text = text.replace("{{pro.legal_name}}", pro.get("legal_name", ""))
        text = text.replace("{{pro.siret}}", pro.get("siret", ""))
        text = text.replace("{{pro.contact_email}}", pro.get("contact_email", ""))
        text = text.replace("{{pro.contact_phone}}", pro.get("contact_phone", ""))
        text = text.replace("{{offer.title}}", offer.get("title", ""))
        text = text.replace("{{order.qty}}", str(order.get("quantity", 1)))
        text = text.replace("{{total_price}}", format_price(offer.get("price_cents", 0)))

        # Pickup slots
        if antigaspi.get("pickup_slots"):
            slot = antigaspi["pickup_slots"][0]
            text = text.replace("{{pickup_slot_start}}", format_date(slot.get("start_at")))
            text = text.replace("{{pickup_slot_end}}", format_date(slot.get("end_at")))
        text = text.replace("{{pickup_instructions}}", antigaspi.get("pickup_instructions", ""))

        sections.append({"title": section["title"], "text": text})

    # Food section if applicable
    food_info = None
    if antigaspi.get("is_food"):
        food_section = template["food_section"]
        allergens = antigaspi.get("allergens_text") or "Non renseigné"
        date_type = antigaspi.get("date_type", "NONE")
        date_value = format_date(antigaspi.get("date_value")) if antigaspi.get("date_value") else "Non renseignée"

        food_info = {
            "allergens": f"Allergènes : {allergens}",
            "date": f"Type de date : {date_type} — Date : {date_value}"
        }

    # Retractation
    is_perishable = antigaspi.get("is_food") and antigaspi.get("date_type") == "DLC"
    retractation_text = template["retractation_perishable"] if is_perishable else template["retractation_general"]

    # Mediation
    mediation_text = template["mediation_template"]
    mediation_text = mediation_text.replace("{{pro.mediator_name}}", pro.get("mediator_name", "Non renseigné"))
    mediation_text = mediation_text.replace("{{pro.mediator_url}}", pro.get("mediator_url", ""))
    mediation_text = mediation_text.replace("{{pro.mediator_contact}}", pro.get("mediator_contact", ""))

    return {
        "version": template["version"],
        "platform_role": PLATFORM_ROLE_TEXT,
        "sections": sections,
        "food_info": food_info,
        "retractation_text": retractation_text,
        "show_perishable_warning": is_perishable,
        "mediation_text": mediation_text,
        "checkbox_text": template["checkbox_text"]
    }


def get_checkout_rental_texts(pro: dict, offer: dict, rental: dict, rental_data: dict) -> dict:
    """Generate filled legal texts for rental checkout"""
    from datetime import datetime, timedelta

    def format_date(dt):
        if isinstance(dt, str):
            try:
                dt = datetime.fromisoformat(dt.replace('Z', '+00:00'))
            except:
                return dt
        return dt.strftime("%d/%m/%Y %H:%M") if dt else "Non renseignée"

    def format_price(cents):
        return f"{cents/100:.2f}€"

    template = CHECKOUT_RENTAL_TEMPLATE

    # Build sections
    sections = []
    for section in template["sections"]:
        text = section["template"]
        text = text.replace("{{pro.trade_name}}", pro.get("trade_name", pro.get("legal_name", "")))
        text = text.replace("{{pro.legal_name}}", pro.get("legal_name", ""))
        text = text.replace("{{pro.siret}}", pro.get("siret", ""))
        text = text.replace("{{pro.contact_email}}", pro.get("contact_email", ""))
        text = text.replace("{{pro.contact_phone}}", pro.get("contact_phone", ""))
        text = text.replace("{{offer.title}}", offer.get("title", ""))
        text = text.replace("{{rental.start_at}}", format_date(rental.get("start_at")))
        text = text.replace("{{rental.end_at}}", format_date(rental.get("end_at")))
        text = text.replace("{{rental_price}}", format_price(offer.get("price_cents", 0)))
        text = text.replace("{{deposit_amount}}", format_price(rental_data.get("deposit_amount_cents", 0)))
        text = text.replace("{{late_fee_per_day}}", format_price(rental_data.get("late_fee_per_day_cents", 0)))

        sections.append({"title": section["title"], "text": text})

    # Check if start is within 14 days (requires immediate execution consent)
    start_at = rental.get("start_at")
    if isinstance(start_at, str):
        try:
            start_at = datetime.fromisoformat(start_at.replace('Z', '+00:00'))
        except:
            start_at = datetime.utcnow() + timedelta(days=30)

    requires_immediate_execution = start_at < datetime.utcnow() + timedelta(days=14) if start_at else False

    # Mediation
    mediation_text = template["mediation_template"]
    mediation_text = mediation_text.replace("{{pro.mediator_name}}", pro.get("mediator_name", "Non renseigné"))
    mediation_text = mediation_text.replace("{{pro.mediator_url}}", pro.get("mediator_url", ""))
    mediation_text = mediation_text.replace("{{pro.mediator_contact}}", pro.get("mediator_contact", ""))

    return {
        "version": template["version"],
        "platform_role": PLATFORM_ROLE_TEXT,
        "sections": sections,
        "retractation_text": template["retractation_text"],
        "requires_immediate_execution": requires_immediate_execution,
        "immediate_execution_checkbox": template["immediate_execution_checkbox"],
        "loss_right_checkbox": template["loss_right_checkbox"],
        "mediation_text": mediation_text,
        "checkbox_text": template["checkbox_text"]
    }
