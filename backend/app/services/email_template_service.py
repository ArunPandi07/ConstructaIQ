from __future__ import annotations

import html

from app.services.report_builder_service import ProjectIntelligenceReport

_BRAND_GOLD = "#F5C518"
_BRAND_NAVY = "#1a2035"


def _esc(value: str | None) -> str:
    return html.escape(value or "", quote=True)


def render_report_subject(report: ProjectIntelligenceReport) -> str:
    date_str = report.generated_at.strftime("%Y-%m-%d")
    return f"ConstructaIQ Report — {report.project_name} — {date_str}"


def render_report_plain_text(report: ProjectIntelligenceReport) -> str:
    lines = [
        "ConstructaIQ Intelligence Report",
        "=" * 40,
        report.executive_summary,
        "",
        "Key metrics",
        f"  Budget: {report.kpis.get('budget')}",
        f"  Duration: {report.kpis.get('duration')}",
        f"  Floors: {report.kpis.get('floors')}",
        f"  Complexity: {report.kpis.get('complexity')}",
        f"  Readiness: {report.kpis.get('readinessPct')}%",
        "",
    ]

    for section in report.agent_sections:
        lines.append(section.agent_name)
        lines.append("-" * len(section.agent_name))
        for label, value in section.highlights:
            lines.append(f"  {label}: {value}")
        lines.append("")

    if report.recommendations:
        lines.append("Top recommendations")
        for rec in report.recommendations[:10]:
            title = rec.get("title") or rec.get("category") or "Recommendation"
            desc = rec.get("description") or ""
            lines.append(f"  • {title}: {desc}")
        lines.append("")

    lines.append(f"View full project: {report.deep_link_url}")
    lines.append("")
    lines.append("— ConstructaIQ")

    return "\n".join(lines)


def render_report_html(report: ProjectIntelligenceReport) -> str:
    kpi_cells = [
        ("Budget", report.kpis.get("budget")),
        ("Duration", report.kpis.get("duration")),
        ("Floors", report.kpis.get("floors")),
        ("Readiness", f"{report.kpis.get('readinessPct')}%"),
    ]

    kpi_html = "".join(
        f"""
        <td style="padding:12px 16px;background:#f5f5f4;border:1px solid #e7e5e4;">
          <div style="font-size:10px;color:#78716c;text-transform:uppercase;font-weight:700;">{_esc(str(label))}</div>
          <div style="font-size:16px;font-weight:800;color:{_BRAND_NAVY};">{_esc(str(value or "—"))}</div>
        </td>
        """
        for label, value in kpi_cells
    )

    agent_sections_html = ""
    for section in report.agent_sections:
        rows = "".join(
            f"<tr><td style='padding:6px 0;color:#78716c;'>{_esc(label)}</td>"
            f"<td style='padding:6px 0;font-weight:600;color:{_BRAND_NAVY};text-align:right;'>"
            f"{_esc(value)}</td></tr>"
            for label, value in section.highlights
        )
        agent_sections_html += f"""
        <div style="margin-bottom:16px;padding:16px;background:#fafaf9;border:1px solid #e7e5e4;border-radius:12px;">
          <h3 style="margin:0 0 8px;font-size:13px;color:{_BRAND_NAVY};">{_esc(section.agent_name)}</h3>
          <table style="width:100%;border-collapse:collapse;font-size:13px;">{rows}</table>
        </div>
        """

    rec_html = ""
    if report.recommendations:
        items = "".join(
            f"<li style='margin-bottom:8px;'><strong>{_esc(str(r.get('title') or 'Recommendation'))}</strong>"
            f"<span style='color:#78716c;font-size:12px;'> ({_esc(str(r.get('category') or 'General'))})</span>"
            f"<br/><span style='color:#44403c;'>{_esc(str(r.get('description') or ''))}</span></li>"
            for r in report.recommendations[:10]
        )
        rec_html = f"""
        <h2 style="font-size:14px;color:{_BRAND_NAVY};margin:24px 0 12px;">Top recommendations</h2>
        <ul style="padding-left:20px;color:#44403c;font-size:13px;line-height:1.5;">{items}</ul>
        """

    return f"""
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:#f5f5f4;font-family:Inter,system-ui,sans-serif;">
      <div style="max-width:640px;margin:0 auto;padding:24px;">
        <div style="background:{_BRAND_NAVY};color:#fff;padding:20px 24px;border-radius:12px 12px 0 0;">
          <div style="font-size:11px;font-weight:700;color:{_BRAND_GOLD};letter-spacing:0.08em;">CONSTRUCTAIQ</div>
          <h1 style="margin:8px 0 0;font-size:20px;">Intelligence Report</h1>
          <p style="margin:6px 0 0;font-size:14px;opacity:0.9;">{_esc(report.project_name)}</p>
        </div>
        <div style="background:#fff;padding:24px;border:1px solid #e7e5e4;border-top:none;">
          <p style="font-size:14px;color:#44403c;line-height:1.6;margin:0 0 20px;">{_esc(report.executive_summary)}</p>
          <table style="width:100%;border-collapse:collapse;margin-bottom:8px;"><tr>{kpi_html}</tr></table>
          <h2 style="font-size:14px;color:{_BRAND_NAVY};margin:24px 0 12px;">Agent insights</h2>
          {agent_sections_html}
          {rec_html}
          <div style="margin-top:28px;text-align:center;">
            <a href="{_esc(report.deep_link_url)}"
               style="display:inline-block;background:{_BRAND_GOLD};color:{_BRAND_NAVY};
                      padding:12px 24px;border-radius:10px;font-weight:800;text-decoration:none;font-size:14px;">
              View project in ConstructaIQ
            </a>
          </div>
        </div>
        <p style="text-align:center;font-size:11px;color:#a8a29e;margin-top:16px;">
          Generated by ConstructaIQ reasoning agents · {report.generated_at.strftime("%Y-%m-%d %H:%M UTC")}
        </p>
      </div>
    </body>
    </html>
    """
