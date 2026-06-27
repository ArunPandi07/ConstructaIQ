import React, { useEffect, useState } from "react";
import { Users, UploadCloud, CheckCircle2, XCircle } from "lucide-react";
import { apiClient } from "../services/apiClient";

interface RosterMember {
  roster_id: number;
  worker_name: string;
  subcontractor: string;
  title: string;
  osha_verified: boolean;
  is_mobilized: boolean;
}

export default function CrewRosterPanel({ projectId }: { projectId: string | number }) {
  const [roster, setRoster] = useState<RosterMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchRoster = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<{ roster: RosterMember[] }>(`/projects/${projectId}/crew-roster`);
      setRoster(res.data?.roster || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoster();
  }, [projectId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      await apiClient.postForm(`/projects/${projectId}/crew-roster/excel`, formData);
      fetchRoster();
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in-up mt-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
          <Users className="w-4 h-4 text-[#F5C518]" />
          Crew Roster (Workforce Mobilization)
        </h3>
        <label className="cursor-pointer bg-[#F5C518] text-black font-bold px-4 py-2 rounded-xl text-xs hover:bg-[#e2b30d] transition flex items-center gap-2">
          <UploadCloud className="w-4 h-4" />
          {uploading ? "AI Extracting..." : "Upload Excel (AI R&D)"}
          <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileUpload} />
        </label>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase font-bold text-[10px]">
            <tr>
              <th className="p-3">Worker Name</th>
              <th className="p-3">Subcontractor</th>
              <th className="p-3">Title</th>
              <th className="p-3 text-center">OSHA Verified</th>
              <th className="p-3 text-center">Mobilized</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {loading ? (
              <tr><td colSpan={5} className="p-4 text-center">Loading...</td></tr>
            ) : roster.length === 0 ? (
              <tr><td colSpan={5} className="p-4 text-center text-stone-500">No crew data. Upload Excel or run seed script.</td></tr>
            ) : (
              roster.map(r => (
                <tr key={r.roster_id} className="hover:bg-stone-50">
                  <td className="p-3 font-bold text-stone-800">{r.worker_name}</td>
                  <td className="p-3 text-stone-600">{r.subcontractor || "—"}</td>
                  <td className="p-3 text-stone-600">{r.title || "—"}</td>
                  <td className="p-3 text-center">
                    {r.osha_verified ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : <XCircle className="w-4 h-4 text-red-500 mx-auto" />}
                  </td>
                  <td className="p-3 text-center">
                    {r.is_mobilized ? <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold">Yes</span> : <span className="bg-stone-100 text-stone-500 px-2 py-0.5 rounded font-bold">No</span>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
