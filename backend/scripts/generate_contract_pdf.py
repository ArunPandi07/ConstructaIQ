"""
Generate realistic construction contract PDF for Oceana Residences project.
"""
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_JUSTIFY
from datetime import datetime
import os

def create_contract_pdf(output_path):
    """Create a realistic construction contract PDF."""
    
    # Create the PDF document
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        rightMargin=0.75*inch,
        leftMargin=0.75*inch,
        topMargin=0.75*inch,
        bottomMargin=0.75*inch
    )
    
    # Container for the 'Flowable' objects
    elements = []
    
    # Define styles
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=16,
        textColor=colors.HexColor('#1a1a1a'),
        spaceAfter=30,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=12,
        textColor=colors.HexColor('#2c3e50'),
        spaceAfter=12,
        spaceBefore=16,
        fontName='Helvetica-Bold'
    )
    
    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['BodyText'],
        fontSize=10,
        alignment=TA_JUSTIFY,
        spaceAfter=12,
        leading=14
    )
    
    # Title
    elements.append(Paragraph("CONSTRUCTION CONTRACT", title_style))
    elements.append(Spacer(1, 0.1*inch))
    
    # Contract header information
    header_data = [
        ['Contract Number:', 'ORC-2025-057'],
        ['Project Name:', 'Oceana Residences — 57-Story Luxury Condominium'],
        ['Date:', 'June 1, 2025'],
        ['Location:', '8701 Collins Avenue, Miami Beach, FL 33154']
    ]
    
    header_table = Table(header_data, colWidths=[2*inch, 4.5*inch])
    header_table.setStyle(TableStyle([
        ('FONT', (0, 0), (0, -1), 'Helvetica-Bold', 10),
        ('FONT', (1, 0), (1, -1), 'Helvetica', 10),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#2c3e50')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    
    elements.append(header_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # Parties section
    elements.append(Paragraph("PARTIES TO THE AGREEMENT", heading_style))
    
    parties_text = """
    This Construction Contract ("Agreement") is entered into as of June 1, 2025, by and between:
    """
    elements.append(Paragraph(parties_text, body_style))
    
    elements.append(Paragraph("<b>OWNER:</b>", body_style))
    owner_text = """
    Oceana Development LLC<br/>
    555 Brickell Avenue, Suite 3200<br/>
    Miami, FL 33131<br/>
    Federal Tax ID: 65-1234567
    """
    elements.append(Paragraph(owner_text, body_style))
    
    elements.append(Paragraph("<b>CONTRACTOR:</b>", body_style))
    contractor_text = """
    Turner Construction Company<br/>
    375 Hudson Street<br/>
    New York, NY 10014<br/>
    License No.: CGC1234567 (Florida)<br/>
    Federal Tax ID: 13-9876543
    """
    elements.append(Paragraph(contractor_text, body_style))
    
    elements.append(Spacer(1, 0.2*inch))
    
    # Project description
    elements.append(Paragraph("1. PROJECT DESCRIPTION", heading_style))
    
    project_desc = """
    The Contractor agrees to furnish all labor, materials, equipment, and services necessary to complete 
    the construction of a 57-story oceanfront luxury condominium tower with 120 residences (ranging from 
    2,400 to 8,500 SF), 4 penthouses, 12-story parking podium, resort-level amenity deck (pool, spa, 
    fitness center, private theater), private marina berths, and all associated site work, utilities, 
    and infrastructure improvements in accordance with the Contract Documents.
    """
    elements.append(Paragraph(project_desc, body_style))
    
    elements.append(Paragraph("<b>Building Specifications:</b>", body_style))
    specs_text = """
    • Total Height: 228 meters (748 feet) above grade<br/>
    • Total Area: Approximately 1,450,000 gross square feet<br/>
    • Structure: Post-tensioned concrete with auger-cast pile foundation<br/>
    • Facade: High-performance impact-resistant glazing system<br/>
    • Building Systems: Full LEED Silver certification target
    """
    elements.append(Paragraph(specs_text, body_style))
    
    elements.append(Spacer(1, 0.2*inch))
    
    # Contract sum
    elements.append(Paragraph("2. CONTRACT SUM", heading_style))
    
    sum_text = """
    The Owner shall pay the Contractor for the performance of the Contract the sum of <b>EIGHT HUNDRED 
    NINETY MILLION DOLLARS ($890,000,000.00)</b>, subject to additions and deductions as provided in 
    the Contract Documents. This amount includes all labor, materials, equipment, permits, insurance, 
    taxes, overhead, and profit.
    """
    elements.append(Paragraph(sum_text, body_style))
    
    # Payment breakdown table
    payment_data = [
        ['Description', 'Amount', 'Percentage'],
        ['Site Preparation & Foundation', '$125,000,000', '14.0%'],
        ['Structural Frame & Concrete', '$210,000,000', '23.6%'],
        ['Building Enclosure & Facade', '$145,000,000', '16.3%'],
        ['MEP Systems', '$185,000,000', '20.8%'],
        ['Interior Finishes', '$125,000,000', '14.0%'],
        ['Amenity Deck & Pool', '$35,000,000', '3.9%'],
        ['Contingency & Allowances', '$65,000,000', '7.3%'],
        ['<b>TOTAL CONTRACT SUM</b>', '<b>$890,000,000</b>', '<b>100.0%</b>']
    ]
    
    payment_table = Table(payment_data, colWidths=[3.5*inch, 1.75*inch, 1.25*inch])
    payment_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#34495e')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
        ('FONT', (0, 0), (-1, 0), 'Helvetica-Bold', 10),
        ('FONT', (0, 1), (-1, -2), 'Helvetica', 9),
        ('FONT', (0, -1), (-1, -1), 'Helvetica-Bold', 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('TOPPADDING', (0, 1), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('LINEABOVE', (0, -1), (-1, -1), 2, colors.black),
    ]))
    
    elements.append(Spacer(1, 0.15*inch))
    elements.append(payment_table)
    
    elements.append(PageBreak())
    
    # Contract time
    elements.append(Paragraph("3. CONTRACT TIME", heading_style))
    
    time_text = """
    The Contractor shall commence work within ten (10) calendar days of receiving the Notice to Proceed 
    and shall achieve Substantial Completion within <b>thirty-six (36) months</b> from the commencement date.
    """
    elements.append(Paragraph(time_text, body_style))
    
    schedule_data = [
        ['Milestone', 'Target Date', 'Duration'],
        ['Notice to Proceed', 'June 1, 2025', '—'],
        ['Mobilization Complete', 'June 15, 2025', '2 weeks'],
        ['Site Prep & Piling Complete', 'November 30, 2025', '6 months'],
        ['Podium Structure Complete', 'June 30, 2026', '12 months'],
        ['Tower Structure Topped Out', 'September 15, 2027', '27 months'],
        ['Facade Substantially Complete', 'January 31, 2028', '32 months'],
        ['Substantial Completion', 'June 1, 2028', '36 months'],
        ['Final Completion & Certificate of Occupancy', 'August 1, 2028', '38 months']
    ]
    
    schedule_table = Table(schedule_data, colWidths=[2.8*inch, 2.0*inch, 1.7*inch])
    schedule_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#34495e')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
        ('FONT', (0, 0), (-1, 0), 'Helvetica-Bold', 10),
        ('FONT', (0, 1), (-1, -1), 'Helvetica', 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('TOPPADDING', (0, 1), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ]))
    
    elements.append(Spacer(1, 0.15*inch))
    elements.append(schedule_table)
    
    elements.append(Spacer(1, 0.2*inch))
    
    # Liquidated damages
    ld_text = """
    <b>Liquidated Damages:</b> If Substantial Completion is not achieved by the target date, the Contractor 
    shall pay the Owner liquidated damages in the amount of <b>$25,000 per calendar day</b> of delay, up to 
    a maximum of 5% of the Contract Sum. The parties agree that actual damages for delay are difficult to 
    ascertain and that this amount represents a reasonable pre-estimate of probable loss.
    """
    elements.append(Paragraph(ld_text, body_style))
    
    # Payment terms
    elements.append(Paragraph("4. PAYMENT TERMS", heading_style))
    
    payment_terms = """
    Payment shall be made monthly based on the percentage of work completed, as certified by the Architect 
    and approved by the Owner's Representative. The Owner shall retain ten percent (10%) of each progress 
    payment as retainage until fifty percent (50%) of the Work is complete, after which retainage shall be 
    reduced to five percent (5%). Final payment, including all retained amounts, shall be due thirty (30) 
    days after Final Completion and acceptance by the Owner.
    """
    elements.append(Paragraph(payment_terms, body_style))
    
    # Insurance requirements
    elements.append(Paragraph("5. INSURANCE REQUIREMENTS", heading_style))
    
    insurance_text = """
    The Contractor shall procure and maintain the following insurance coverage throughout the duration 
    of the Contract:
    """
    elements.append(Paragraph(insurance_text, body_style))
    
    insurance_list = """
    • <b>Commercial General Liability:</b> $10,000,000 per occurrence / $20,000,000 aggregate<br/>
    • <b>Workers' Compensation:</b> Statutory limits for State of Florida<br/>
    • <b>Employer's Liability:</b> $5,000,000 per accident<br/>
    • <b>Commercial Auto Liability:</b> $5,000,000 combined single limit<br/>
    • <b>Builders Risk (All Risk):</b> Full replacement value ($890,000,000)<br/>
    • <b>Professional Liability:</b> $5,000,000 per claim (for design-assist services)<br/>
    • <b>Umbrella/Excess Liability:</b> $50,000,000 per occurrence
    """
    elements.append(Paragraph(insurance_list, body_style))
    
    elements.append(PageBreak())
    
    # Contract documents
    elements.append(Paragraph("6. CONTRACT DOCUMENTS", heading_style))
    
    docs_text = """
    The Contract Documents consist of this Agreement, General Conditions (AIA Document A201-2017, as amended), 
    Supplementary Conditions, Specifications, Drawings, and all Addenda and Modifications. In the event of 
    conflict between Contract Documents, the order of precedence shall be: (1) Modifications and Change Orders, 
    (2) Addenda, (3) this Agreement, (4) Supplementary Conditions, (5) General Conditions, (6) Specifications, 
    and (7) Drawings.
    """
    elements.append(Paragraph(docs_text, body_style))
    
    # Permits and approvals
    elements.append(Paragraph("7. PERMITS AND APPROVALS", heading_style))
    
    permits_text = """
    The Contractor shall obtain and pay for all permits, licenses, and certificates of inspection required 
    for the proper execution and completion of the Work, including but not limited to:
    """
    elements.append(Paragraph(permits_text, body_style))
    
    permits_list = """
    • Miami-Dade County Building Permit<br/>
    • Florida Department of Environmental Protection (FDEP) Construction Dewatering Permit<br/>
    • U.S. Army Corps of Engineers Section 10/404 Permits (marina construction)<br/>
    • Miami-Dade Aviation Department (crane permits for operations near airport)<br/>
    • Florida Department of Transportation (DOT) right-of-way permits<br/>
    • Miami Beach Certificate of Occupancy upon Final Completion
    """
    elements.append(Paragraph(permits_list, body_style))
    
    # Warranty
    elements.append(Paragraph("8. WARRANTY", heading_style))
    
    warranty_text = """
    The Contractor warrants that all materials and equipment furnished under the Contract will be new unless 
    otherwise specified, and that all Work will be of good quality, free from faults and defects, and in 
    conformance with the Contract Documents. The Contractor warrants all Work for a period of <b>two (2) years</b> 
    from the date of Substantial Completion. Specialized systems (roofing, waterproofing, HVAC, elevators) 
    shall carry extended manufacturer warranties as specified in Division 01 of the Specifications.
    """
    elements.append(Paragraph(warranty_text, body_style))
    
    # Termination
    elements.append(Paragraph("9. TERMINATION", heading_style))
    
    termination_text = """
    Either party may terminate this Contract for cause upon seven (7) days' written notice if the other party 
    fails to perform in accordance with the Contract Documents and fails to cure such failure within the 
    notice period. The Owner may terminate this Contract for convenience upon thirty (30) days' written notice, 
    in which case the Contractor shall be compensated for Work performed, materials delivered, demobilization 
    costs, and reasonable profit on Work performed.
    """
    elements.append(Paragraph(termination_text, body_style))
    
    # Dispute resolution
    elements.append(Paragraph("10. DISPUTE RESOLUTION", heading_style))
    
    dispute_text = """
    Any disputes arising out of or relating to this Contract shall be subject to mediation as a condition 
    precedent to arbitration or litigation. If mediation is unsuccessful, disputes shall be resolved by 
    binding arbitration in accordance with the Construction Industry Arbitration Rules of the American 
    Arbitration Association. The place of arbitration shall be Miami, Florida, and Florida law shall govern.
    """
    elements.append(Paragraph(dispute_text, body_style))
    
    elements.append(Spacer(1, 0.3*inch))
    
    # Signature block
    elements.append(Paragraph("IN WITNESS WHEREOF, the parties have executed this Contract as of the date first written above.", body_style))
    
    elements.append(Spacer(1, 0.4*inch))
    
    # Signature table
    sig_data = [
        ['<b>OWNER: Oceana Development LLC</b>', '<b>CONTRACTOR: Turner Construction Company</b>'],
        ['', ''],
        ['', ''],
        ['_________________________________', '_________________________________'],
        ['Michael J. Rodriguez', 'Peter J. Davoren'],
        ['Managing Director', 'President & CEO'],
        ['Date: _______________', 'Date: _______________'],
    ]
    
    sig_table = Table(sig_data, colWidths=[3.25*inch, 3.25*inch])
    sig_table.setStyle(TableStyle([
        ('FONT', (0, 0), (-1, 0), 'Helvetica-Bold', 10),
        ('FONT', (0, 3), (-1, -1), 'Helvetica', 9),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 1), (-1, 2), 18),
    ]))
    
    elements.append(sig_table)
    
    # Build PDF
    doc.build(elements)
    print(f"Contract PDF created successfully: {output_path}")

if __name__ == "__main__":
    # Output directory
    output_dir = os.path.join(os.path.dirname(__file__), "..", "demo_documents")
    os.makedirs(output_dir, exist_ok=True)
    
    output_path = os.path.join(output_dir, "Oceana_Residences_Construction_Contract.pdf")
    create_contract_pdf(output_path)
