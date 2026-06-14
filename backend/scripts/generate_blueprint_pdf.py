"""
Generate realistic architectural blueprint PDF for Oceana Residences project.
"""
from reportlab.lib.pagesizes import landscape, letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from reportlab.pdfgen import canvas
from reportlab.graphics.shapes import Drawing, Rect, Line, Circle, String
from reportlab.graphics import renderPDF
import os

def draw_title_block(c, page_width, page_height):
    """Draw standard architectural title block."""
    # Title block border
    margin = 0.5 * inch
    tb_height = 1.5 * inch
    tb_y = margin
    
    # Main title block rectangle
    c.setStrokeColor(colors.black)
    c.setLineWidth(2)
    c.rect(margin, tb_y, page_width - 2*margin, tb_height)
    
    # Vertical dividers
    col1_x = margin + 1.5*inch
    col2_x = margin + 4.5*inch
    col3_x = margin + 7*inch
    
    c.setLineWidth(1)
    c.line(col1_x, tb_y, col1_x, tb_y + tb_height)
    c.line(col2_x, tb_y, col2_x, tb_y + tb_height)
    c.line(col3_x, tb_y, col3_x, tb_y + tb_height)
    
    # Horizontal dividers
    h1_y = tb_y + tb_height - 0.5*inch
    h2_y = tb_y + 0.75*inch
    h3_y = tb_y + 0.35*inch
    
    c.line(margin, h1_y, page_width - margin, h1_y)
    c.line(margin, h2_y, page_width - margin, h2_y)
    c.line(col2_x, h3_y, page_width - margin, h3_y)
    
    # Project name
    c.setFont("Helvetica-Bold", 14)
    c.drawString(margin + 0.1*inch, h1_y + 0.2*inch, "OCEANA RESIDENCES")
    
    # Project location
    c.setFont("Helvetica", 9)
    c.drawString(margin + 0.1*inch, h1_y - 0.2*inch, "8701 Collins Avenue, Miami Beach, FL 33154")
    
    # Labels
    c.setFont("Helvetica-Bold", 8)
    c.drawString(margin + 0.1*inch, h2_y + 0.15*inch, "PROJECT NO:")
    c.drawString(margin + 0.1*inch, h2_y - 0.25*inch, "DRAWN BY:")
    
    c.drawString(col1_x + 0.1*inch, h2_y + 0.15*inch, "SHEET TITLE:")
    c.drawString(col1_x + 0.1*inch, h2_y - 0.25*inch, "CHECKED BY:")
    
    c.drawString(col2_x + 0.1*inch, h2_y + 0.15*inch, "SCALE:")
    c.drawString(col2_x + 0.1*inch, h3_y + 0.05*inch, "DATE:")
    c.drawString(col2_x + 0.1*inch, h3_y - 0.25*inch, "REVISION:")
    
    c.drawString(col3_x + 0.1*inch, h2_y + 0.15*inch, "SHEET:")
    
    # Values
    c.setFont("Helvetica", 8)
    c.drawString(margin + 0.7*inch, h2_y + 0.15*inch, "2025-057-ORC")
    c.drawString(margin + 0.7*inch, h2_y - 0.25*inch, "M.CHEN, AIA")
    
    c.drawString(col1_x + 0.8*inch, h2_y + 0.15*inch, "TYPICAL FLOOR PLAN")
    c.drawString(col1_x + 0.8*inch, h2_y - 0.25*inch, "J.RIVERA, PE")
    
    c.drawString(col2_x + 0.5*inch, h2_y + 0.15*inch, "1/8\" = 1'-0\"")
    c.drawString(col2_x + 0.5*inch, h3_y + 0.05*inch, "06/01/2025")
    c.drawString(col2_x + 0.7*inch, h3_y - 0.25*inch, "REV 03")
    
    c.setFont("Helvetica-Bold", 11)
    c.drawString(col3_x + 0.5*inch, h2_y + 0.05*inch, "A-301")
    
    # Architect info
    c.setFont("Helvetica-Bold", 10)
    c.drawString(page_width - margin - 2*inch, tb_y + tb_height + 0.2*inch, "ARQUITECTONICA")
    c.setFont("Helvetica", 8)
    c.drawString(page_width - margin - 2*inch, tb_y + tb_height + 0.05*inch, "550 Brickell Avenue, Miami, FL 33131")

def draw_floor_plan(c, origin_x, origin_y, scale=0.05):
    """Draw a typical residential floor plan."""
    # Building outline (43m x 37m converted to points at scale)
    unit_width = 43 * 72 / 12 * scale  # 43 meters to feet to inches to points
    unit_depth = 37 * 72 / 12 * scale
    
    # Exterior walls (thick)
    c.setLineWidth(4)
    c.setStrokeColor(colors.black)
    c.rect(origin_x, origin_y, unit_width, unit_depth)
    
    # Interior corridor (center spine)
    corridor_width = 8 * 72 / 12 * scale  # 8 feet wide corridor
    corridor_x = origin_x + (unit_width - corridor_width) / 2
    
    c.setLineWidth(2)
    c.line(corridor_x, origin_y, corridor_x, origin_y + unit_depth)
    c.line(corridor_x + corridor_width, origin_y, corridor_x + corridor_width, origin_y + unit_depth)
    
    # Elevator core (center)
    elevator_size = 20 * 72 / 12 * scale
    elevator_x = origin_x + (unit_width - elevator_size) / 2
    elevator_y = origin_y + (unit_depth - elevator_size) / 2
    
    c.setLineWidth(3)
    c.rect(elevator_x, elevator_y, elevator_size, elevator_size)
    
    # Draw elevator symbols
    c.setFont("Helvetica", 6)
    c.drawCentredString(elevator_x + elevator_size/4, elevator_y + elevator_size/2, "ELEV 1")
    c.drawCentredString(elevator_x + 3*elevator_size/4, elevator_y + elevator_size/2, "ELEV 2")
    
    # Vertical line for elevator separation
    c.setLineWidth(1)
    c.line(elevator_x + elevator_size/2, elevator_y, elevator_x + elevator_size/2, elevator_y + elevator_size)
    
    # Stair cores (adjacent to elevators)
    stair_width = 12 * 72 / 12 * scale
    stair_depth = 15 * 72 / 12 * scale
    
    # North stair
    stair1_x = elevator_x - stair_width - 2
    stair1_y = elevator_y + (elevator_size - stair_depth) / 2
    c.rect(stair1_x, stair1_y, stair_width, stair_depth)
    
    # South stair
    stair2_x = elevator_x + elevator_size + 2
    stair2_y = elevator_y + (elevator_size - stair_depth) / 2
    c.rect(stair2_x, stair2_y, stair_width, stair_depth)
    
    # Draw stair symbols
    c.setFont("Helvetica", 5)
    c.drawCentredString(stair1_x + stair_width/2, stair1_y + stair_depth/2 + 3, "STAIR A")
    c.drawCentredString(stair2_x + stair_width/2, stair2_y + stair_depth/2 + 3, "STAIR B")
    
    # Draw stair lines
    c.setLineWidth(0.5)
    for i in range(5):
        y_offset = stair1_y + stair_depth * 0.2 + i * (stair_depth * 0.6 / 5)
        c.line(stair1_x + 2, y_offset, stair1_x + stair_width - 2, y_offset)
        c.line(stair2_x + 2, y_offset, stair2_x + stair_width - 2, y_offset)
    
    # Draw residential units (4 per floor)
    unit_depth_half = (unit_depth - 30) / 2
    
    # Unit partitions
    c.setLineWidth(2)
    # Horizontal partition
    c.line(origin_x, origin_y + unit_depth_half + 15, corridor_x, origin_y + unit_depth_half + 15)
    c.line(corridor_x + corridor_width, origin_y + unit_depth_half + 15, origin_x + unit_width, origin_y + unit_depth_half + 15)
    
    # Vertical partitions
    c.line(origin_x + unit_width/2, origin_y, origin_x + unit_width/2, origin_y + unit_depth_half + 15)
    c.line(origin_x + unit_width/2, origin_y + unit_depth_half + 15, origin_x + unit_width/2, origin_y + unit_depth)
    
    # Windows (exterior walls - dashed lines for glazing)
    c.setDash(3, 3)
    c.setLineWidth(1.5)
    c.setStrokeColor(colors.HexColor('#0066cc'))
    
    # North facade windows
    window_start = origin_x + 15
    window_end = origin_x + unit_width - 15
    c.line(window_start, origin_y + unit_depth, window_end, origin_y + unit_depth)
    
    # South facade windows
    c.line(window_start, origin_y, window_end, origin_y)
    
    # East facade windows
    c.line(origin_x + unit_width, origin_y + 15, origin_x + unit_width, origin_y + unit_depth - 15)
    
    # West facade windows
    c.line(origin_x, origin_y + 15, origin_x, origin_y + unit_depth - 15)
    
    # Reset dash
    c.setDash()
    
    # Door symbols
    c.setStrokeColor(colors.black)
    c.setLineWidth(1)
    
    # Unit entry doors from corridor
    door_width = 4 * 72 / 12 * scale
    
    # Draw doors to units
    for door_y in [origin_y + unit_depth_half/2, origin_y + unit_depth_half + 15 + unit_depth_half/2]:
        # Left side doors
        c.line(corridor_x, door_y, corridor_x - door_width, door_y)
        c.arc(corridor_x - door_width, door_y - door_width, corridor_x, door_y, 90, 90)
        
        # Right side doors  
        c.line(corridor_x + corridor_width, door_y, corridor_x + corridor_width + door_width, door_y)
        c.arc(corridor_x + corridor_width, door_y - door_width, corridor_x + corridor_width + door_width, door_y, 0, 90)
    
    # Room labels
    c.setFont("Helvetica-Bold", 7)
    c.drawCentredString(origin_x + unit_width/4, origin_y + unit_depth_half/2, "UNIT 01")
    c.drawCentredString(origin_x + 3*unit_width/4, origin_y + unit_depth_half/2, "UNIT 02")
    c.drawCentredString(origin_x + unit_width/4, origin_y + unit_depth_half + 15 + unit_depth_half/2, "UNIT 03")
    c.drawCentredString(origin_x + 3*unit_width/4, origin_y + unit_depth_half + 15 + unit_depth_half/2, "UNIT 04")
    
    c.setFont("Helvetica", 6)
    c.drawCentredString(origin_x + unit_width/4, origin_y + unit_depth_half/2 - 8, "2BR / 2.5BA")
    c.drawCentredString(origin_x + 3*unit_width/4, origin_y + unit_depth_half/2 - 8, "3BR / 3.5BA")
    c.drawCentredString(origin_x + unit_width/4, origin_y + unit_depth_half + 15 + unit_depth_half/2 - 8, "2BR / 2.5BA")
    c.drawCentredString(origin_x + 3*unit_width/4, origin_y + unit_depth_half + 15 + unit_depth_half/2 - 8, "3BR / 3.5BA")

def draw_dimensions(c, origin_x, origin_y, width, height):
    """Draw dimension lines."""
    c.setStrokeColor(colors.HexColor('#cc0000'))
    c.setLineWidth(0.5)
    
    # Dimension line style
    offset = 15
    
    # Horizontal dimension
    dim_y = origin_y - offset
    c.line(origin_x, dim_y, origin_x + width, dim_y)
    
    # Dimension arrows
    arrow_size = 3
    c.line(origin_x, dim_y, origin_x + arrow_size, dim_y + arrow_size/2)
    c.line(origin_x, dim_y, origin_x + arrow_size, dim_y - arrow_size/2)
    c.line(origin_x + width, dim_y, origin_x + width - arrow_size, dim_y + arrow_size/2)
    c.line(origin_x + width, dim_y, origin_x + width - arrow_size, dim_y - arrow_size/2)
    
    # Dimension text
    c.setFont("Helvetica", 7)
    c.setFillColor(colors.HexColor('#cc0000'))
    c.drawCentredString(origin_x + width/2, dim_y - 8, "43.00 m (141'-1\")")
    
    # Vertical dimension
    dim_x = origin_x - offset
    c.line(dim_x, origin_y, dim_x, origin_y + height)
    
    # Vertical arrows
    c.line(dim_x, origin_y, dim_x + arrow_size/2, origin_y + arrow_size)
    c.line(dim_x, origin_y, dim_x - arrow_size/2, origin_y + arrow_size)
    c.line(dim_x, origin_y + height, dim_x + arrow_size/2, origin_y + height - arrow_size)
    c.line(dim_x, origin_y + height, dim_x - arrow_size/2, origin_y + height - arrow_size)
    
    # Vertical dimension text
    c.saveState()
    c.translate(dim_x - 12, origin_y + height/2)
    c.rotate(90)
    c.drawCentredString(0, 0, "37.00 m (121'-5\")")
    c.restoreState()

def draw_north_arrow(c, x, y, size=30):
    """Draw north arrow symbol."""
    c.setStrokeColor(colors.black)
    c.setFillColor(colors.black)
    c.setLineWidth(1.5)
    
    # Arrow shaft
    c.line(x, y - size/2, x, y + size/2)
    
    # Arrow head as filled triangle
    path = c.beginPath()
    path.moveTo(x, y + size/2)
    path.lineTo(x - size/4, y + size/4)
    path.lineTo(x + size/4, y + size/4)
    path.close()
    c.drawPath(path, fill=1, stroke=0)
    
    # 'N' label
    c.setFont("Helvetica-Bold", 10)
    c.drawCentredString(x, y + size/2 + 8, "N")

def draw_scale_bar(c, x, y):
    """Draw graphic scale bar."""
    c.setStrokeColor(colors.black)
    c.setLineWidth(1)
    
    # Scale bar
    bar_length = 60
    bar_height = 8
    
    c.rect(x, y, bar_length, bar_height)
    c.rect(x + bar_length, y, bar_length, bar_height)
    
    # Fill alternating sections
    c.setFillColor(colors.black)
    c.rect(x, y, bar_length, bar_height, fill=1)
    
    # Labels
    c.setFont("Helvetica", 6)
    c.setFillColor(colors.black)
    c.drawCentredString(x, y - 8, "0")
    c.drawCentredString(x + bar_length, y - 8, "10m")
    c.drawCentredString(x + 2*bar_length, y - 8, "20m")
    
    c.setFont("Helvetica-Bold", 7)
    c.drawString(x, y + bar_height + 4, "GRAPHIC SCALE")

def create_blueprint_pdf(output_path):
    """Create realistic architectural blueprint PDF."""
    
    # Create canvas in landscape orientation
    page_width, page_height = landscape(letter)
    c = canvas.Canvas(output_path, pagesize=landscape(letter))
    
    # Set background to blueprint blue tint (optional - traditional blueprints)
    # c.setFillColor(colors.HexColor('#e8f4f8'))
    # c.rect(0, 0, page_width, page_height, fill=1)
    
    # Draw title block
    draw_title_block(c, page_width, page_height)
    
    # Main drawing area
    drawing_origin_x = 1.5 * inch
    drawing_origin_y = 3.5 * inch
    
    # Draw floor plan
    draw_floor_plan(c, drawing_origin_x, drawing_origin_y, scale=0.8)
    
    # Draw dimensions
    unit_width = 43 * 72 / 12 * 0.8
    unit_depth = 37 * 72 / 12 * 0.8
    draw_dimensions(c, drawing_origin_x, drawing_origin_y, unit_width, unit_depth)
    
    # Draw north arrow
    draw_north_arrow(c, page_width - 1.5*inch, page_height - 1.5*inch)
    
    # Draw scale bar
    draw_scale_bar(c, drawing_origin_x, drawing_origin_y - 50)
    
    # General notes
    c.setFont("Helvetica-Bold", 9)
    c.drawString(page_width - 3*inch, drawing_origin_y + unit_depth + 40, "GENERAL NOTES:")
    
    c.setFont("Helvetica", 7)
    notes = [
        "1. ALL DIMENSIONS IN MILLIMETERS UNLESS NOTED.",
        "2. VERIFY ALL DIMENSIONS ON SITE BEFORE PROCEEDING.",
        "3. FLOOR TO FLOOR HEIGHT: 4.0 M (13'-1\").",
        "4. CONCRETE STRENGTH: 45 MPa (6,500 PSI).",
        "5. GLAZING: IMPACT-RESISTANT PER MIAMI-DADE NOA.",
        "6. REFER TO STRUCTURAL DWGS FOR COLUMN LOCATIONS.",
        "7. CEILING HEIGHT: 3.0 M (9'-10\") CLEAR.",
    ]
    
    y_pos = drawing_origin_y + unit_depth + 25
    for note in notes:
        c.drawString(page_width - 3*inch, y_pos, note)
        y_pos -= 10
    
    # Legend
    c.setFont("Helvetica-Bold", 9)
    c.drawString(page_width - 3*inch, y_pos - 15, "LEGEND:")
    
    c.setFont("Helvetica", 7)
    y_pos -= 30
    
    # Wall symbol
    c.setLineWidth(4)
    c.line(page_width - 3*inch, y_pos, page_width - 2.7*inch, y_pos)
    c.drawString(page_width - 2.5*inch, y_pos - 2, "EXTERIOR WALL")
    y_pos -= 12
    
    # Interior wall symbol
    c.setLineWidth(2)
    c.line(page_width - 3*inch, y_pos, page_width - 2.7*inch, y_pos)
    c.drawString(page_width - 2.5*inch, y_pos - 2, "INTERIOR WALL")
    y_pos -= 12
    
    # Window symbol
    c.setLineWidth(1.5)
    c.setStrokeColor(colors.HexColor('#0066cc'))
    c.setDash(3, 3)
    c.line(page_width - 3*inch, y_pos, page_width - 2.7*inch, y_pos)
    c.setDash()
    c.setStrokeColor(colors.black)
    c.drawString(page_width - 2.5*inch, y_pos - 2, "CURTAIN WALL/GLAZING")
    
    # Drawing title
    c.setFont("Helvetica-Bold", 12)
    c.drawString(drawing_origin_x, page_height - 1*inch, "TYPICAL RESIDENTIAL FLOOR PLAN")
    c.setFont("Helvetica", 9)
    c.drawString(drawing_origin_x, page_height - 1.2*inch, "LEVELS 13-55 (TOWER)")
    
    # Save the page
    c.showPage()
    
    # Save PDF
    c.save()
    print(f"Blueprint PDF created successfully: {output_path}")

if __name__ == "__main__":
    # Output directory
    output_dir = os.path.join(os.path.dirname(__file__), "..", "demo_documents")
    os.makedirs(output_dir, exist_ok=True)
    
    output_path = os.path.join(output_dir, "Oceana_Residences_Architectural_Blueprint.pdf")
    create_blueprint_pdf(output_path)
