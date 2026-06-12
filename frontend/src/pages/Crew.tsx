import { useState } from "react";
import { Users, UserCheck, ShieldCheck, AlertTriangle } from "lucide-react";

interface CrewMember {
  id: string; name: string; subContractor: string; title: string;
  oshaCertified: boolean; clearanceLevel: "Supervising" | "Heavy Operator" | "Journeyman" | "Apprentice"; mobilized: boolean;
}

const initialCrew: CrewMember[] = [
  { id: "crew-1", name: "Daryl Dixon", subContractor: "Apex Structural Steel Co.", title: "Erection Hoister Lead", oshaCertified: true, clearanceLevel: "Supervising", mobilized: true },
  { id: "crew-2", name: "Marcus Aurelius", subContractor: "Titan Foundations Settle", title: "Excavator Loader Operator", oshaCertified: true, clearanceLevel: "Heavy Operator", mobilized: true },
  { id: "crew-3", name: "Estella Vance", subContractor: "Apex Structural Steel Co.", title: "Structural Welder J1", oshaCertified: true, clearanceLevel: "Journeyman", mobilized: false },
  { id: "crew-4", name: "Leon Kennedy", subContractor: "Austin Civil Drainage", title: "Drainage Trench Planner", oshaCertified: true, clearanceLevel: "Journeyman", mobilized: true },
  { id: "crew-5", name: "Rebecca Chambers", subContractor: "Safety Core Solutions", title: "Site First-Aid EMT", oshaCertified: true, clearanceLevel: "Supervising", mobilized: true },
  { id: "crew-6", name: "Jack Marston", subContractor: "Titan Foundations Settle", title: "Concrete Finisher Apprentice", oshaCertified: false, clearanceLevel: "Apprentice", mobilized: false },
];

export default function Crew() {
  const [crew, setCrew] = useState<CrewMember[]>(initialCrew);
  const toggleMobilize = (id: string) => setCrew((prev) => prev.map((c) => c.id === id ? { ...c, mobilized: !c.mobilized } : c));
  const activeCount = crew.filter((c) => c.mobilized).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="kpi-card p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>Active Headcount</p>
          <p className="text-xl font-black" style={{ color: "var(--text-primary)" }}>{activeCount} / {crew.length} On Site</p>
        </div>
        <div className="kpi-card p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>OSHA Safety compliance</p>
          <p className="text-xl font-black" style={{ color: "var(--green-primary)" }}>93% Ratio</p>
        </div>
        <div className="kpi-card p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>Unions Represented</p>
          <p className="text-xl font-black" style={{ color: "var(--text-primary)" }}>3 Local Districts</p>
        </div>
        <div className="kpi-card p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>Sling Certifications</p>
          <p className="text-xl font-black" style={{ color: "var(--blue-primary)" }}>6 Certified Operators</p>
        </div>
      </div>

      <div className="glass-card p-6 space-y-4">
        <div className="flex justify-between items-center pb-2" style={{ borderBottom: "1px solid var(--border)" }}>
          <div>
            <h2 className="text-base font-extrabold tracking-tight flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <Users className="w-5 h-5" style={{ color: "var(--blue-primary)" }} />
              Staffing Mobilization Roster
            </h2>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Reconciled hourly against OSHA safety clearance cards</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--text-muted)" }} className="font-bold">
                <th className="pb-3 pt-1">Worker Name</th>
                <th className="pb-3 pt-1">Contractor Employer</th>
                <th className="pb-3 pt-1">Site Title</th>
                <th className="pb-3 pt-1">Clearance</th>
                <th className="pb-3 pt-1">OSHA Verified</th>
                <th className="pb-3 pt-1 text-right">Mobilize</th>
              </tr>
            </thead>
            <tbody>
              {crew.map((member) => (
                <tr key={member.id} style={{ borderBottom: "1px solid var(--border)" }} className="transition">
                  <td className="py-3 font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                    <UserCheck className="w-4 h-4" style={{ color: "var(--blue-primary)" }} />
                    {member.name}
                  </td>
                  <td className="py-3" style={{ color: "var(--text-secondary)" }}>{member.subContractor}</td>
                  <td className="py-3 font-sans" style={{ color: "var(--text-secondary)" }}>{member.title}</td>
                  <td className="py-3">
                    <span className="status-badge" style={
                      member.clearanceLevel === "Supervising" ? { background: "var(--purple-bg)", color: "var(--purple-primary)" }
                        : member.clearanceLevel === "Heavy Operator" ? { background: "var(--blue-bg)", color: "var(--blue-primary)" }
                          : member.clearanceLevel === "Journeyman" ? { background: "var(--blue-bg)", color: "var(--blue-primary)" }
                            : { background: "var(--bg3)", color: "var(--text-muted)" }
                    }>{member.clearanceLevel}</span>
                  </td>
                  <td className="py-3">
                    {member.oshaCertified ? (
                      <span className="font-bold flex items-center gap-1 text-[10px]" style={{ color: "var(--green-primary)" }}>
                        <ShieldCheck className="w-3.5 h-3.5" />Card Active
                      </span>
                    ) : (
                      <span className="font-bold flex items-center gap-1 text-[10px] animate-pulse" style={{ color: "var(--red-primary)" }}>
                        <AlertTriangle className="w-3.5 h-3.5" />Card Lapsed
                      </span>
                    )}
                  </td>
                  <td className="py-3 text-right">
                    <button onClick={() => toggleMobilize(member.id)}
                      className="text-[10px] font-bold px-3 py-1.5 border transition"
                      style={member.mobilized
                        ? { background: "var(--sidebar-bg)", color: "#fff", borderColor: "transparent", borderRadius: 8 }
                        : { background: "var(--card)", color: "var(--text-secondary)", border: "1px solid var(--border)", borderRadius: 8 }
                      }>
                      {member.mobilized ? "ACTIVE ON SITE" : "MOBILIZE CREW"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
