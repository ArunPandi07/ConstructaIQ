"""
Build sample PDFs from docs/samples/*.txt for Mode 2 API testing.

Usage:
    python scripts/build_sample_pdfs.py
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fpdf import FPDF

SAMPLES = Path(__file__).resolve().parent.parent / "docs" / "samples"
INPUTS = [
    ("sample_contract.txt", "sample_contract.pdf"),
    ("sample_blueprint_spec.txt", "sample_blueprint.pdf"),
]


def txt_to_pdf(src: Path, dest: Path) -> None:
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()
    pdf.set_font("Courier", size=7)
    w = pdf.w - pdf.l_margin - pdf.r_margin
    for line in src.read_text(encoding="utf-8").splitlines():
        safe = line.encode("latin-1", errors="replace").decode("latin-1")
        pdf.set_x(pdf.l_margin)
        pdf.multi_cell(w, 3.5, safe)
    pdf.output(str(dest))


def main() -> int:
    for txt_name, pdf_name in INPUTS:
        src = SAMPLES / txt_name
        dest = SAMPLES / pdf_name
        if not src.exists():
            print(f"Skip missing: {src}")
            continue
        txt_to_pdf(src, dest)
        print(f"Created: {dest}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
