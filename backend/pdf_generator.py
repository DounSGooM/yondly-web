"""
PDF Generator for Rental Contracts
Uses ReportLab for pure Python PDF generation
"""

import os
import hashlib
from datetime import datetime
from io import BytesIO
from typing import Optional

try:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import cm
    from reportlab.lib.colors import HexColor
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
    from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False


def generate_rental_contract(
    rental_id: str,
    pro_data: dict,
    renter_data: dict,
    offer_data: dict,
    rental_data: dict,
    rental_specific: dict,
    output_dir: str = "contracts"
) -> tuple[str, str]:
    """
    Generate a rental contract PDF
    
    Returns:
        tuple: (file_path, pdf_hash)
    """
    if not REPORTLAB_AVAILABLE:
        raise ImportError("reportlab is required for PDF generation. Install with: pip install reportlab")
    
    # Ensure output directory exists
    os.makedirs(output_dir, exist_ok=True)
    
    # Create PDF buffer
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2*cm,
        leftMargin=2*cm,
        topMargin=2*cm,
        bottomMargin=2*cm
    )
    
    # Styles
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'ContractTitle',
        parent=styles['Heading1'],
        fontSize=18,
        spaceAfter=20,
        alignment=TA_CENTER,
        textColor=HexColor('#1f2937')
    )
    
    heading_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontSize=12,
        spaceBefore=15,
        spaceAfter=8,
        textColor=HexColor('#4C7B4B'),
        fontName='Helvetica-Bold'
    )
    
    body_style = ParagraphStyle(
        'ContractBody',
        parent=styles['Normal'],
        fontSize=10,
        alignment=TA_JUSTIFY,
        spaceAfter=6,
        leading=14
    )
    
    small_style = ParagraphStyle(
        'SmallText',
        parent=styles['Normal'],
        fontSize=8,
        textColor=HexColor('#6b7280'),
        spaceAfter=4
    )
    
    # Format helpers
    def format_date(dt):
        if isinstance(dt, str):
            try:
                dt = datetime.fromisoformat(dt.replace('Z', '+00:00'))
            except:
                return dt
        return dt.strftime("%d/%m/%Y à %H:%M") if dt else "Non renseignée"
    
    def format_price(cents):
        return f"{cents/100:.2f}€" if cents else "0.00€"
    
    # Build document content
    content = []
    
    # Title
    content.append(Paragraph("CONTRAT DE LOCATION", title_style))
    content.append(Paragraph(f"Référence : {rental_id}", small_style))
    content.append(Paragraph(f"Date de génération : {datetime.now().strftime('%d/%m/%Y %H:%M')}", small_style))
    content.append(Spacer(1, 20))
    
    # ============ ARTICLE 1: PARTIES ============
    content.append(Paragraph("ARTICLE 1 – LES PARTIES", heading_style))
    
    # Lessor (PRO)
    content.append(Paragraph("<b>LE LOUEUR (Professionnel)</b>", body_style))
    lessor_info = f"""
    Raison sociale : {pro_data.get('legal_name', 'N/A')}<br/>
    Nom commercial : {pro_data.get('trade_name', pro_data.get('legal_name', 'N/A'))}<br/>
    SIRET : {pro_data.get('siret', 'N/A')}<br/>
    Adresse : {pro_data.get('address_line1', '')}, {pro_data.get('postal_code', '')} {pro_data.get('city', '')}<br/>
    Contact : {pro_data.get('contact_email', '')} - {pro_data.get('contact_phone', '')}
    """
    content.append(Paragraph(lessor_info, body_style))
    content.append(Spacer(1, 10))
    
    # Renter
    content.append(Paragraph("<b>LE LOCATAIRE</b>", body_style))
    renter_info = f"""
    Nom : {renter_data.get('display_name', 'N/A')}<br/>
    Email : {renter_data.get('email', 'N/A')}<br/>
    Téléphone : {renter_data.get('phone', 'N/A')}
    """
    content.append(Paragraph(renter_info, body_style))
    content.append(Spacer(1, 10))
    
    # Platform
    content.append(Paragraph("<b>LA PLATEFORME (Mise en relation uniquement)</b>", body_style))
    platform_info = """
    Yondly - Plateforme de mise en relation<br/>
    Yondly n'est pas partie au contrat de location. Yondly fournit uniquement le service de mise en relation et de paiement sécurisé.
    """
    content.append(Paragraph(platform_info, body_style))
    
    content.append(HRFlowable(width="100%", thickness=0.5, color=HexColor('#e5e5e5'), spaceBefore=15, spaceAfter=15))
    
    # ============ ARTICLE 2: OBJET ============
    content.append(Paragraph("ARTICLE 2 – OBJET DE LA LOCATION", heading_style))
    object_info = f"""
    <b>Désignation :</b> {offer_data.get('title', 'N/A')}<br/>
    <b>Description :</b> {offer_data.get('description', 'Aucune description')}<br/>
    <b>Catégorie :</b> {offer_data.get('category', 'N/A')}
    """
    content.append(Paragraph(object_info, body_style))
    
    # ============ ARTICLE 3: DURÉE ============
    content.append(Paragraph("ARTICLE 3 – DURÉE DE LA LOCATION", heading_style))
    duration_info = f"""
    <b>Date et heure de début :</b> {format_date(rental_data.get('start_at'))}<br/>
    <b>Date et heure de fin :</b> {format_date(rental_data.get('end_at'))}<br/>
    <b>Durée minimale :</b> {rental_specific.get('min_duration_hours', 24)} heures<br/>
    <b>Durée maximale :</b> {rental_specific.get('max_duration_hours', 168)} heures
    """
    content.append(Paragraph(duration_info, body_style))
    
    # ============ ARTICLE 4: PRIX ============
    content.append(Paragraph("ARTICLE 4 – PRIX ET PAIEMENT", heading_style))
    price_info = f"""
    <b>Prix de la location (TTC) :</b> {format_price(offer_data.get('price_cents', 0))}<br/>
    <b>Pénalité de retard :</b> {format_price(rental_specific.get('late_fee_per_day_cents', 0))} par jour de retard<br/>
    <b>Mode de paiement :</b> Paiement sécurisé via Yondly (Stripe)
    """
    content.append(Paragraph(price_info, body_style))
    
    # ============ ARTICLE 5: DÉPÔT DE GARANTIE ============
    content.append(Paragraph("ARTICLE 5 – DÉPÔT DE GARANTIE", heading_style))
    deposit_info = f"""
    <b>Montant du dépôt de garantie :</b> {format_price(rental_specific.get('deposit_amount_cents', 0))}<br/><br/>
    Le dépôt de garantie est prélevé sous forme d'empreinte bancaire (autorisation de prélèvement) au moment de la réservation.<br/><br/>
    <b>Restitution :</b> Le dépôt est intégralement restitué dans les 7 jours suivant la restitution du bien en bon état, après validation de l'état des lieux de retour.<br/><br/>
    <b>Retenue :</b> En cas de dégradation, perte ou vol du bien, le loueur peut retenir tout ou partie du dépôt, avec justification écrite et preuves (photos de l'état des lieux).
    """
    content.append(Paragraph(deposit_info, body_style))
    
    # ============ ARTICLE 6: REMISE & RETOUR ============
    content.append(Paragraph("ARTICLE 6 – REMISE ET RETOUR DU BIEN", heading_style))
    handover_info = """
    <b>Lieu :</b> Remise en main propre à l'adresse convenue. Aucune livraison ni expédition.<br/><br/>
    <b>État des lieux de remise :</b> Un état des lieux photographique est réalisé lors de la remise du bien. Le locataire doit signaler tout défaut apparent à ce moment.<br/><br/>
    <b>État des lieux de retour :</b> Un état des lieux photographique comparatif est réalisé lors du retour. Toute différence sera documentée et peut justifier une retenue sur le dépôt.
    """
    content.append(Paragraph(handover_info, body_style))
    
    # ============ ARTICLE 7: OBLIGATIONS DU LOCATAIRE ============
    content.append(Paragraph("ARTICLE 7 – OBLIGATIONS DU LOCATAIRE", heading_style))
    renter_obligations = f"""
    Le locataire s'engage à :<br/>
    • Utiliser le bien conformément à sa destination et aux règles d'usage ci-dessous<br/>
    • Prendre soin du bien comme un bon père de famille<br/>
    • Ne pas sous-louer ni prêter le bien à un tiers<br/>
    • Restituer le bien à la date et heure convenues, dans l'état initial<br/>
    • Signaler immédiatement tout incident, panne ou dégradation<br/><br/>
    <b>Règles d'usage spécifiques :</b><br/>
    {rental_specific.get('usage_rules', 'Aucune règle spécifique')}
    """
    content.append(Paragraph(renter_obligations, body_style))
    
    # ============ ARTICLE 8: OBLIGATIONS DU LOUEUR ============
    content.append(Paragraph("ARTICLE 8 – OBLIGATIONS DU LOUEUR", heading_style))
    lessor_obligations = """
    Le loueur s'engage à :<br/>
    • Fournir un bien en bon état de fonctionnement<br/>
    • Être disponible pour la remise et le retour aux dates convenues<br/>
    • Fournir les instructions d'utilisation nécessaires<br/>
    • Restituer le dépôt de garantie selon les conditions prévues
    """
    content.append(Paragraph(lessor_obligations, body_style))
    
    # ============ ARTICLE 9: RESPONSABILITÉ ============
    content.append(Paragraph("ARTICLE 9 – RESPONSABILITÉ EN CAS DE DÉGRADATION, PERTE OU VOL", heading_style))
    responsibility_info = """
    <b>Responsabilité du locataire :</b><br/>
    Le locataire est responsable du bien pendant toute la durée de la location. En cas de dégradation, perte ou vol :<br/>
    • Le locataire doit en informer immédiatement le loueur<br/>
    • Le dépôt de garantie peut être retenu en totalité ou partiellement<br/>
    • Des frais supplémentaires peuvent être demandés si les dégâts excèdent le montant du dépôt<br/><br/>
    <b>Assurance :</b><br/>
    Le locataire est invité à vérifier sa couverture assurance (responsabilité civile, assurance habitation étendue aux biens loués).
    """
    content.append(Paragraph(responsibility_info, body_style))
    
    # ============ ARTICLE 10: LITIGES ============
    content.append(Paragraph("ARTICLE 10 – LITIGES ET MÉDIATION", heading_style))
    dispute_info = f"""
    En cas de litige entre le loueur et le locataire, les parties s'engagent à rechercher une solution amiable.<br/><br/>
    <b>Médiation :</b><br/>
    Conformément aux articles L.611-1 et suivants du Code de la consommation, le locataire peut recourir gratuitement au médiateur de la consommation désigné par le loueur :<br/>
    • <b>Médiateur :</b> {pro_data.get('mediator_name', 'Non renseigné')}<br/>
    • <b>Site :</b> {pro_data.get('mediator_url', 'Non renseigné')}<br/>
    • <b>Contact :</b> {pro_data.get('mediator_contact', 'Non renseigné')}<br/><br/>
    <b>Tribunal compétent :</b><br/>
    À défaut de résolution amiable ou par médiation, le litige sera porté devant les tribunaux compétents.
    """
    content.append(Paragraph(dispute_info, body_style))
    
    # ============ ARTICLE 11: SIGNATURE ÉLECTRONIQUE ============
    content.append(Paragraph("ARTICLE 11 – ACCEPTATION ÉLECTRONIQUE", heading_style))
    signature_info = f"""
    Ce contrat est conclu par voie électronique. L'acceptation du contrat par le locataire est matérialisée par :<br/>
    • La validation du paiement sur la plateforme Yondly<br/>
    • Le cochage de la case d'acceptation des conditions<br/><br/>
    Cette acceptation électronique a valeur de signature conformément à l'article 1366 du Code civil.<br/><br/>
    <b>Date d'acceptation :</b> {format_date(rental_data.get('accepted_at', datetime.now()))}<br/>
    <b>IP du locataire :</b> {rental_data.get('ip', 'Non enregistré')}<br/>
    <b>Référence d'acceptation :</b> {rental_data.get('acceptance_log_id', rental_id)}
    """
    content.append(Paragraph(signature_info, body_style))
    
    # Footer
    content.append(Spacer(1, 30))
    content.append(HRFlowable(width="100%", thickness=1, color=HexColor('#4C7B4B'), spaceBefore=10, spaceAfter=10))
    content.append(Paragraph(
        "Document généré automatiquement par Yondly. Ce contrat engage les parties dès son acceptation électronique.",
        small_style
    ))
    content.append(Paragraph(
        f"Hash du document : À générer après création",
        small_style
    ))
    
    # Build PDF
    doc.build(content)
    
    # Get PDF bytes and calculate hash
    pdf_bytes = buffer.getvalue()
    pdf_hash = hashlib.sha256(pdf_bytes).hexdigest()
    
    # Save to file
    filename = f"rental_contract_{rental_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    filepath = os.path.join(output_dir, filename)
    
    with open(filepath, 'wb') as f:
        f.write(pdf_bytes)
    
    buffer.close()
    
    return filepath, pdf_hash


def generate_rental_contract_from_db(db_data: dict, output_dir: str = "contracts") -> tuple[str, str]:
    """
    Convenience function to generate contract from database objects
    
    Expected db_data keys:
    - rental: rental document
    - offer: offer_pro document
    - rental_specific: offer_rental document
    - pro: pro_profile document
    - renter: user document
    """
    return generate_rental_contract(
        rental_id=db_data['rental']['id'],
        pro_data=db_data['pro'],
        renter_data=db_data['renter'],
        offer_data=db_data['offer'],
        rental_data=db_data['rental'],
        rental_specific=db_data['rental_specific'],
        output_dir=output_dir
    )
