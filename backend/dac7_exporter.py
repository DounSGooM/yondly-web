"""
DAC7 Exporter for PRO Sellers
Generates XML export for tax authorities (DAC7 directive)
"""

import xml.etree.ElementTree as ET
from xml.dom import minidom
from datetime import datetime
from typing import List, Optional
import hashlib
import os


def generate_dac7_xml(
    platform_info: dict,
    sellers: List[dict],
    reporting_year: int,
    output_dir: str = "dac7_exports"
) -> tuple[str, str]:
    """
    Generate DAC7 XML export for tax authorities
    
    Args:
        platform_info: Platform identification data
        sellers: List of PRO seller data with transactions
        reporting_year: Year being reported
        output_dir: Output directory for XML file
    
    Returns:
        tuple: (file_path, xml_hash)
    """

    # Create root element with namespaces
    nsmap = {
        "dpi": "urn:oecd:ties:dpi:v1",
        "stf": "urn:oecd:ties:dpistf:v1"
    }

    root = ET.Element("DPI_OECD", {
        "version": "1.0",
        "xmlns:dpi": nsmap["dpi"],
        "xmlns:stf": nsmap["stf"],
        "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance"
    })

    # ============ MESSAGE SPEC ============
    message_spec = ET.SubElement(root, "MessageSpec")

    ET.SubElement(message_spec, "SendingCompanyIN").text = platform_info.get("tax_id", "FR00000000000")
    ET.SubElement(message_spec, "TransmittingCountry").text = platform_info.get("country", "FR")
    ET.SubElement(message_spec, "ReceivingCountry").text = platform_info.get("country", "FR")
    ET.SubElement(message_spec, "MessageType").text = "DPI"
    ET.SubElement(message_spec, "MessageRefId").text = f"DAC7-{platform_info.get('platform_id', 'YONDLY')}-{reporting_year}-{datetime.now().strftime('%Y%m%d%H%M%S')}"
    ET.SubElement(message_spec, "MessageTypeIndic").text = "DPI401"  # New data
    ET.SubElement(message_spec, "ReportingPeriod").text = f"{reporting_year}-12-31"
    ET.SubElement(message_spec, "Timestamp").text = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

    # ============ PLATFORM OPERATOR ============
    platform_operator = ET.SubElement(root, "PlatformOperator")

    # Platform identifiers
    res_ctry_code = ET.SubElement(platform_operator, "ResCountryCode")
    res_ctry_code.text = platform_info.get("country", "FR")

    tin = ET.SubElement(platform_operator, "TIN", {"issuedBy": platform_info.get("country", "FR")})
    tin.text = platform_info.get("siret", "00000000000000")

    name = ET.SubElement(platform_operator, "Name")
    name.text = platform_info.get("name", "Yondly SAS")

    # Address
    address = ET.SubElement(platform_operator, "Address")
    ET.SubElement(address, "AddressFix").text = platform_info.get("address", "123 rue Example")
    ET.SubElement(address, "City").text = platform_info.get("city", "Paris")
    ET.SubElement(address, "PostCode").text = platform_info.get("postcode", "75001")
    ET.SubElement(address, "CountryCode").text = platform_info.get("country", "FR")

    # ============ REPORTABLE SELLERS ============
    for seller in sellers:
        # Skip if below threshold (1000€ or 30 transactions)
        total_consideration = seller.get("total_consideration_cents", 0) / 100
        total_transactions = seller.get("total_transactions", 0)

        # DAC7 threshold: > 2000€ or > 30 transactions
        if total_consideration < 2000 and total_transactions < 30:
            continue

        reportable_seller = ET.SubElement(root, "ReportableSeller")

        # Seller identity
        identity = ET.SubElement(reportable_seller, "Identity")

        # Entity or individual
        if seller.get("entity_type") == "COMPANY":
            entity = ET.SubElement(identity, "EntitySeller")
            ET.SubElement(entity, "EntSellerID", {"issuedBy": seller.get("country", "FR")}).text = seller.get("siret", "")
            ET.SubElement(entity, "Name").text = seller.get("legal_name", "")
        else:
            individual = ET.SubElement(identity, "IndividualSeller")
            name_elem = ET.SubElement(individual, "Name")
            ET.SubElement(name_elem, "FirstName").text = seller.get("first_name", "")
            ET.SubElement(name_elem, "LastName").text = seller.get("last_name", "")
            if seller.get("birth_date"):
                ET.SubElement(individual, "BirthDate").text = seller.get("birth_date")

        # TIN (Tax ID)
        if seller.get("siret"):
            seller_tin = ET.SubElement(identity, "TIN", {"issuedBy": seller.get("country", "FR")})
            seller_tin.text = seller.get("siret")

        # VAT number if available
        if seller.get("vat_number"):
            vat = ET.SubElement(identity, "VAT")
            vat.text = seller.get("vat_number")

        # Address
        seller_address = ET.SubElement(identity, "Address")
        ET.SubElement(seller_address, "AddressFix").text = seller.get("address", "")
        ET.SubElement(seller_address, "City").text = seller.get("city", "")
        ET.SubElement(seller_address, "PostCode").text = seller.get("postcode", "")
        ET.SubElement(seller_address, "CountryCode").text = seller.get("country", "FR")

        # Relevant activities
        relevant_activities = ET.SubElement(reportable_seller, "RelevantActivities")

        # Activity type breakdown
        for activity in seller.get("activities", []):
            activity_elem = ET.SubElement(relevant_activities, "RelevantActivity")

            # Activity type
            activity_type = ET.SubElement(activity_elem, "ActivityType")
            activity_type.text = activity.get("type", "SERVICES")  # GOODS, SERVICES, IMMOV_PROP, TRANSPORT

            # Number of activities
            num_activities = ET.SubElement(activity_elem, "NumberOfActivities")
            num_activities.text = str(activity.get("count", 0))

            # Consideration (revenue)
            consideration = ET.SubElement(activity_elem, "Consideration")
            ET.SubElement(consideration, "ConsiderationAmount", {"currCode": "EUR"}).text = f"{activity.get('amount', 0):.2f}"

            # Fees (platform commission)
            fees = ET.SubElement(activity_elem, "Fees")
            ET.SubElement(fees, "FeesAmount", {"currCode": "EUR"}).text = f"{activity.get('fees', 0):.2f}"

        # Financial account (IBAN)
        if seller.get("iban"):
            fin_account = ET.SubElement(reportable_seller, "FinancialIdentifier")
            account = ET.SubElement(fin_account, "OtherFI")
            ET.SubElement(account, "IBAN").text = seller.get("iban", "")

    # ============ GENERATE XML ============
    # Pretty print
    xml_string = ET.tostring(root, encoding="unicode")
    dom = minidom.parseString(xml_string)
    pretty_xml = dom.toprettyxml(indent="  ", encoding="UTF-8")

    # Create output directory
    os.makedirs(output_dir, exist_ok=True)

    # Generate filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"dac7_export_{reporting_year}_{timestamp}.xml"
    filepath = os.path.join(output_dir, filename)

    # Write file
    with open(filepath, "wb") as f:
        f.write(pretty_xml)

    # Calculate hash
    xml_hash = hashlib.sha256(pretty_xml).hexdigest()

    return filepath, xml_hash


async def generate_dac7_from_db(db, reporting_year: int, output_dir: str = "dac7_exports") -> dict:
    """
    Generate DAC7 export from database
    
    Args:
        db: MongoDB database connection
        reporting_year: Year to report
        output_dir: Output directory
    
    Returns:
        dict with export results
    """
    # Platform info (could be from config)
    platform_info = {
        "platform_id": "YONDLY",
        "name": "Yondly SAS",
        "siret": "12345678901234",  # Replace with actual
        "tax_id": "FR12345678901234",
        "country": "FR",
        "address": "123 rue Example",
        "city": "Paris",
        "postcode": "75001"
    }

    # Get all PRO profiles
    pro_profiles = await db.pro_profiles.find({}).to_list(10000)

    sellers = []
    skipped = 0

    for pro in pro_profiles:
        pro_id = pro.get("pro_id")

        # Get verification status
        verif = await db.trader_verifications.find_one({"pro_id": pro_id, "status": "APPROVED"})
        if not verif:
            skipped += 1
            continue

        # Get orders for this PRO in the reporting year
        start_date = datetime(reporting_year, 1, 1)
        end_date = datetime(reporting_year, 12, 31, 23, 59, 59)

        # Anti-gaspi orders
        antigaspi_orders = await db.orders_pro.find({
            "pro_id": pro_id,
            "status": "PICKED_UP",
            "created_at": {"$gte": start_date, "$lte": end_date}
        }).to_list(10000)

        # Rentals
        rentals = await db.rentals.find({
            "pro_id": pro_id,
            "status": "COMPLETED",
            "created_at": {"$gte": start_date, "$lte": end_date}
        }).to_list(10000)

        # Calculate totals
        antigaspi_total = sum(o.get("amount_cents", 0) for o in antigaspi_orders)
        rental_total = sum(r.get("amount_cents", 0) for r in rentals)

        total_transactions = len(antigaspi_orders) + len(rentals)
        total_consideration = antigaspi_total + rental_total

        # Skip if below threshold
        if total_consideration < 200000 and total_transactions < 30:  # 2000€ in cents
            skipped += 1
            continue

        # Build seller record
        seller = {
            "pro_id": pro_id,
            "entity_type": "COMPANY",
            "legal_name": pro.get("legal_name", ""),
            "siret": pro.get("siret", ""),
            "vat_number": pro.get("vat_number"),
            "address": pro.get("address_line1", ""),
            "city": pro.get("city", ""),
            "postcode": pro.get("postal_code", ""),
            "country": "FR",
            "iban": None,  # From Stripe Connect if available
            "total_consideration_cents": total_consideration,
            "total_transactions": total_transactions,
            "activities": []
        }

        # Add anti-gaspi activity
        if antigaspi_orders:
            seller["activities"].append({
                "type": "GOODS",  # Anti-gaspi = goods
                "count": len(antigaspi_orders),
                "amount": antigaspi_total / 100,
                "fees": antigaspi_total * 0.05 / 100  # 5% platform fee
            })

        # Add rental activity
        if rentals:
            seller["activities"].append({
                "type": "SERVICES",  # Rentals = services
                "count": len(rentals),
                "amount": rental_total / 100,
                "fees": rental_total * 0.10 / 100  # 10% platform fee on rentals
            })

        sellers.append(seller)

    # Generate XML
    filepath, xml_hash = generate_dac7_xml(
        platform_info=platform_info,
        sellers=sellers,
        reporting_year=reporting_year,
        output_dir=output_dir
    )

    # Create export job record
    import uuid
    job = {
        "id": str(uuid.uuid4()),
        "year": reporting_year,
        "status": "COMPLETED",
        "file_path": filepath,
        "xml_hash": xml_hash,
        "sellers_count": len(sellers),
        "skipped_count": skipped,
        "created_at": datetime.utcnow()
    }

    await db.dac7_export_jobs.insert_one(job)

    return {
        "job_id": job["id"],
        "file_path": filepath,
        "xml_hash": xml_hash,
        "sellers_exported": len(sellers),
        "sellers_skipped": skipped
    }
