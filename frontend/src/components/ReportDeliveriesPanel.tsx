import { useEffect, useState } from "react";
import { Mail, Loader2 } from "lucide-react";
import { getReportDeliveries } from "../services/projectApi";
import type { ReportDeliveryRead } from "../services/projectApi";

interface Props {
  projectId: string;
}

export default function ReportDeliveriesPanel({ projectId }: Props) {
  const [deliveries, setDeliveries] = useState<ReportDeliveryRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    getReportDeliveries(Number(projectId))
      .then(setDeliveries)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-stone-500 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading report deliveries…
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-600 py-6 text-center">{error}</p>;
  }

  if (deliveries.length === 0) {
    return (
      <p className="text-sm text-stone-500 py-6 text-center">
        No report emails sent yet for this project.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Mail className="w-4 h-4 text-[#F5C518]" />
        <h3 className="text-sm font-bold text-stone-900">Report Email Deliveries</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-stone-200 text-left text-stone-500">
              <th className="py-2 pr-4 font-bold">Date</th>
              <th className="py-2 pr-4 font-bold">Recipient</th>
              <th className="py-2 pr-4 font-bold">Status</th>
            </tr>
          </thead>
          <tbody>
            {deliveries.map((row) => (
              <tr key={row.delivery_id} className="border-b border-stone-100">
                <td className="py-2 pr-4 text-stone-700">
                  {row.sent_at ? new Date(row.sent_at).toLocaleString() : "—"}
                </td>
                <td className="py-2 pr-4 text-stone-700">{row.recipient_email ?? "—"}</td>
                <td className="py-2 pr-4">
                  <span className="font-bold capitalize text-stone-800">
                    {row.status ?? "unknown"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
