"""
Mediation Dossier PDF Generator
Generates comprehensive PDF dossier for mediator escalation
Uses ReportLab for PDF generation
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, HRFlowable
from reportlab.lib import colors
from datetime import datetime
import os
import hashlib


# Colors
PRIMARY_COLOR = HexColor("#22c55e")
SECONDARY_COLOR = HexColor("#64748b")
DARK_COLOR = HexColor("#1e293b")


async def generate_mediation_dossier(
    dispute: dict,
    transaction: dict,
    opener: dict,
    other_party: dict,
    pro_profile: dict,
    evidence: list,
    settlement_offers: list,
    messages: list
) -> str:
    """
    Generate mediation dossier PDF with all dispute information
    
    Returns:
        str: URL/path to generated PDF
    """
    
    # Create output directory
    output_dir = os.path.join(os.path.dirname(__file__), "mediation_dossiers")
    os.makedirs(output_dir, exist_ok=True)
    
    # Generate filename
    dispute_id = dispute.get("id", "unknown")
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"dossier_mediation_{dispute_id[:8]}_{timestamp}.pdf"
    filepath = os.path.join(output_dir, filename)
    
    # Create PDF
    doc = SimpleDocTemplate(
        filepath,
        pagesize=A4,
        rightMargin=2*cm,
        leftMargin=2*cm,
        topMargin=2*cm,
        bottomMargin=2*cm
    )
    
    # Styles
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=20,
        spaceAfter=20,
        textColor=DARK_COLOR,
        alignment=1  # Center
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        spaceAfter=10,
        spaceBefore=15,
        textColor=PRIMARY_COLOR
    )
    
    subheading_style = ParagraphStyle(
        'CustomSubHeading',
        parent=styles['Heading3'],
        fontSize=12,
        spaceAfter=8,
        spaceBefore=10,
        textColor=SECONDARY_COLOR
    )
    
    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontSize=10,
        spaceAfter=6,
        textColor=DARK_COLOR
    )
    
    small_style = ParagraphStyle(
        'CustomSmall',
        parent=styles['Normal'],
        fontSize=8,
        textColor=SECONDARY_COLOR
    )
    
    disclaimer_style = ParagraphStyle(
        'Disclaimer',
        parent=styles['Normal'],
        fontSize=9,
        textColor=HexColor("#ef4444"),
        borderWidth=1,
        borderColor=HexColor("#ef4444"),
        borderPadding=10,
        spaceAfter=15
    )
    
    # Build content
    content = []
    
    # ============ HEADER ============
    content.append(Paragraph("DOSSIER DE MÉDIATION", title_style))
    content.append(Paragraph(f"Réf. Litige: {dispute_id}", small_style))
    content.append(Paragraph(f"Généré le: {datetime.now().strftime('%d/%m/%Y à %H:%M')}", small_style))
    content.append(Spacer(1, 20))
    
    # ============ DISCLAIMER ============
    content.append(Paragraph(
        "<b>IMPORTANT:</b> Yondly facilite la résolution amiable mais n'est pas médiateur. "
        "Ce dossier est transmis au médiateur indépendant choisi par le professionnel conformément "
        "à ses obligations légales (Article L612-1 du Code de la consommation).",
        disclaimer_style
    ))
    
    # ============ SECTION 1: PARTIES ============
    content.append(Paragraph("1. IDENTIFICATION DES PARTIES", heading_style))
    
    # Demandeur
    content.append(Paragraph("1.1 Demandeur (Partie ayant ouvert le litige)", subheading_style))
    opener_name = opener.get("display_name", "Non renseigné") if opener else "Non renseigné"
    opener_email = opener.get("email", "Non renseigné") if opener else "Non renseigné"
    content.append(Paragraph(f"<b>Nom:</b> {opener_name}", normal_style))
    content.append(Paragraph(f"<b>Email:</b> {opener_email}", normal_style))
    
    # Défendeur
    content.append(Paragraph("1.2 Défendeur", subheading_style))
    other_name = other_party.get("display_name", "Non renseigné") if other_party else "Non renseigné"
    other_email = other_party.get("email", "Non renseigné") if other_party else "Non renseigné"
    content.append(Paragraph(f"<b>Nom:</b> {other_name}", normal_style))
    content.append(Paragraph(f"<b>Email:</b> {other_email}", normal_style))
    
    # Professionnel
    if pro_profile:
        content.append(Paragraph("1.3 Professionnel concerné", subheading_style))
        content.append(Paragraph(f"<b>Raison sociale:</b> {pro_profile.get('legal_name', 'N/A')}", normal_style))
        content.append(Paragraph(f"<b>SIRET:</b> {pro_profile.get('siret', 'N/A')}", normal_style))
        content.append(Paragraph(f"<b>Adresse:</b> {pro_profile.get('address_line1', '')}, {pro_profile.get('postal_code', '')} {pro_profile.get('city', '')}", normal_style))
        content.append(Paragraph(f"<b>Email:</b> {pro_profile.get('contact_email', 'N/A')}", normal_style))
    
    content.append(HRFlowable(width="100%", thickness=0.5, color=colors.grey))
    
    # ============ SECTION 2: TRANSACTION ============
    content.append(Paragraph("2. OBJET DU LITIGE", heading_style))
    
    trans_type = dispute.get("transaction_type", "UNKNOWN")
    content.append(Paragraph(f"<b>Type de transaction:</b> {'Commande Anti-gaspi' if trans_type == 'ORDER' else 'Location'}", normal_style))
    
    if transaction:
        content.append(Paragraph(f"<b>Référence:</b> {transaction.get('id', 'N/A')}", normal_style))
        amount = transaction.get("amount_cents", 0) / 100
        content.append(Paragraph(f"<b>Montant:</b> {amount:.2f}€", normal_style))
        
        created = transaction.get("created_at")
        if created:
            if isinstance(created, str):
                created = datetime.fromisoformat(created.replace("Z", "+00:00"))
            content.append(Paragraph(f"<b>Date:</b> {created.strftime('%d/%m/%Y')}", normal_style))
    
    content.append(Spacer(1, 10))
    content.append(Paragraph(f"<b>Motif du litige:</b> {dispute.get('reason', 'Non précisé')}", normal_style))
    content.append(Paragraph(f"<b>Description:</b> {dispute.get('description', 'Aucune description')}", normal_style))
    
    content.append(HRFlowable(width="100%", thickness=0.5, color=colors.grey))
    
    # ============ SECTION 3: TIMELINE ============
    content.append(Paragraph("3. CHRONOLOGIE", heading_style))
    
    created_at = dispute.get("created_at")
    if isinstance(created_at, str):
        created_at = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
    elif not created_at:
        created_at = datetime.now()
    
    timeline = [
        ("Ouverture du litige", created_at.strftime("%d/%m/%Y %H:%M")),
    ]
    
    escalated_at = dispute.get("escalated_at")
    if escalated_at:
        if isinstance(escalated_at, str):
            escalated_at = datetime.fromisoformat(escalated_at.replace("Z", "+00:00"))
        timeline.append(("Escalade vers médiateur", escalated_at.strftime("%d/%m/%Y %H:%M")))
    
    # Add settlement offers timeline
    for offer in settlement_offers:
        offer_date = offer.get("created_at")
        if isinstance(offer_date, str):
            offer_date = datetime.fromisoformat(offer_date.replace("Z", "+00:00"))
        elif offer_date:
            status = offer.get("status", "PROPOSED")
            timeline.append((f"Proposition: {offer.get('type', 'N/A')} ({status})", offer_date.strftime("%d/%m/%Y %H:%M")))
    
    # Sort timeline
    # (skipping sort as dates may be mixed types)
    
    for event, date_str in timeline:
        content.append(Paragraph(f"• <b>{date_str}</b> - {event}", normal_style))
    
    content.append(HRFlowable(width="100%", thickness=0.5, color=colors.grey))
    
    # ============ SECTION 4: SETTLEMENT OFFERS ============
    content.append(Paragraph("4. PROPOSITIONS D'ACCORD AMIABLE", heading_style))
    
    if settlement_offers:
        for i, offer in enumerate(settlement_offers, 1):
            content.append(Paragraph(f"4.{i} Proposition #{i}", subheading_style))
            content.append(Paragraph(f"<b>Type:</b> {offer.get('type', 'N/A')}", normal_style))
            
            if offer.get("amount_cents"):
                content.append(Paragraph(f"<b>Montant proposé:</b> {offer.get('amount_cents', 0)/100:.2f}€", normal_style))
            
            content.append(Paragraph(f"<b>Détails:</b> {offer.get('details_text', 'N/A')}", normal_style))
            content.append(Paragraph(f"<b>Statut:</b> {offer.get('status', 'N/A')}", normal_style))
            content.append(Spacer(1, 8))
    else:
        content.append(Paragraph("Aucune proposition d'accord n'a été soumise.", normal_style))
    
    content.append(HRFlowable(width="100%", thickness=0.5, color=colors.grey))
    
    # ============ SECTION 5: MESSAGES ============
    content.append(Paragraph("5. ÉCHANGES ENTRE LES PARTIES", heading_style))
    
    if messages:
        for msg in messages:
            msg_date = msg.get("created_at")
            if isinstance(msg_date, str):
                msg_date = datetime.fromisoformat(msg_date.replace("Z", "+00:00"))
            elif msg_date:
                pass
            else:
                msg_date = datetime.now()
            
            author = msg.get("author_id", "Système")
            msg_content = msg.get("content", "")
            
            content.append(Paragraph(
                f"<b>[{msg_date.strftime('%d/%m/%Y %H:%M')}]</b> {author[:8]}...: {msg_content}",
                normal_style
            ))
    else:
        content.append(Paragraph("Aucun échange enregistré.", normal_style))
    
    content.append(HRFlowable(width="100%", thickness=0.5, color=colors.grey))
    
    # ============ SECTION 6: EVIDENCE ============
    content.append(Paragraph("6. PIÈCES JOINTES / PREUVES", heading_style))
    
    if evidence:
        for i, e in enumerate(evidence, 1):
            content.append(Paragraph(
                f"{i}. {e.get('file_type', 'DOCUMENT')}: {e.get('description', 'Aucune description')}",
                normal_style
            ))
            content.append(Paragraph(f"   URL: {e.get('file_url', 'N/A')}", small_style))
    else:
        content.append(Paragraph("Aucune pièce jointe.", normal_style))
    
    content.append(HRFlowable(width="100%", thickness=0.5, color=colors.grey))
    
    # ============ SECTION 7: MEDIATOR INFO ============
    content.append(Paragraph("7. MÉDIATEUR DÉSIGNÉ", heading_style))
    
    if pro_profile:
        content.append(Paragraph(f"<b>Nom:</b> {pro_profile.get('mediator_name', 'Non renseigné')}", normal_style))
        content.append(Paragraph(f"<b>Site web:</b> {pro_profile.get('mediator_url', 'N/A')}", normal_style))
        content.append(Paragraph(f"<b>Contact:</b> {pro_profile.get('mediator_contact', 'N/A')}", normal_style))
    else:
        content.append(Paragraph("Informations médiateur non disponibles.", normal_style))
    
    # ============ FOOTER ============
    content.append(Spacer(1, 30))
    content.append(HRFlowable(width="100%", thickness=1, color=colors.grey))
    content.append(Paragraph(
        f"Document généré automatiquement par la plateforme Yondly le {datetime.now().strftime('%d/%m/%Y à %H:%M')}. "
        "Ce document a valeur informative et constitue un récapitulatif factuel des échanges. "
        "Il ne constitue pas une décision de médiation.",
        small_style
    ))
    
    # Build PDF
    doc.build(content)
    
    # Calculate hash
    with open(filepath, "rb") as f:
        pdf_hash = hashlib.sha256(f.read()).hexdigest()
    
    # Return relative URL (in production, upload to S3/GCS)
    return f"/mediation_dossiers/{filename}"
