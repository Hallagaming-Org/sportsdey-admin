import { useQuery } from "@tanstack/react-query";
import { Copy, Loader2, Wallet, X } from "lucide-react";
import { formatActivityAmount, getAdminActivityDetail, isWalletActivity, type AdminActivity, type AdminActivityDetail } from "@/lib/admin-activity";

interface Props { activity: AdminActivity | null; isOpen: boolean; onClose: () => void; }
const recorded = (value?: string | null) => value || "Not recorded";

export function ActivityLogDetailsModal({ activity, isOpen, onClose }: Props) {
  const { data: detail, isLoading } = useQuery({
    queryKey: ["admin-activity-detail", activity?.id],
    queryFn: async () => {
      if (!activity) return null;
      const result = await getAdminActivityDetail(activity.id);
      if (!result.success) throw new Error(result.error || "Could not load activity details");
      return result.data || null;
    },
    enabled: isOpen && !!activity?.id,
  });
  if (!isOpen || !activity) return null;
  const record: AdminActivityDetail = detail || activity;
  const walletActivity = isWalletActivity(record);
  const copy = (value?: string | null) => value && navigator.clipboard?.writeText(value);
  const status = record.executionStatus || "completed";

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label="Activity log details">
    <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-[#f8f9fb] shadow-xl">
      <header className="flex items-center justify-between border-b border-gray-100 bg-white p-6"><div className="flex items-center gap-4"><span className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700"><Wallet /></span><h2 className="text-2xl font-bold text-gray-900">Activity Log Details</h2></div><button type="button" onClick={onClose} className="rounded-full bg-[#08083b] p-3 text-white"><X /></button></header>
      <div className="overflow-y-auto p-6 custom-scrollbar">
        {isLoading ? <div className="flex min-h-64 items-center justify-center text-gray-500"><Loader2 className="mr-2 animate-spin" /> Loading activity details…</div> : <div className="space-y-5">
          <Panel title="Activity Overview">
            <Field label="Log ID" value={<span className="flex items-center gap-2">{record.id}<button type="button" onClick={() => copy(record.id)} className="text-green-600"><Copy className="h-4 w-4" /></button></span>} />
            <Field label="Admin User" value={<span className="flex items-center gap-2"><img src={record.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${record.userId}`} className="h-6 w-6 rounded-full" alt="" />{record.fullName} (ID {record.userId})</span>} />
            <Field label="Role" value={record.role} /><Field label="Action" value={record.action} /><Field label="Module" value={recorded(record.module)} /><Field label="IP Address" value={recorded(record.ipAddress)} /><Field label="Device" value={recorded(record.device)} /><Field label="Browser" value={recorded(record.browser)} /><Field label="Location" value={recorded(record.location)} />
            <div className="mt-5 flex items-center justify-between border-t pt-4"><span className="font-medium text-green-700">Status</span><span className="rounded-full border border-green-300 bg-green-50 px-4 py-1 text-sm font-medium capitalize text-green-700">{status}</span></div>
          </Panel>
          <div className="grid gap-5 md:grid-cols-2">
            <Panel title="Action Details"><Field label="Description" value={record.description || record.action} /><Field label="Reference" value={record.reference || "—"} />{record.targetUser && <><Field label="Affected user" value={record.targetUser.name || "User"} /><Field label="User ID" value={record.targetUser.id} /><Field label="Email" value={record.targetUser.email || "—"} /></>}{walletActivity && <><Field label="Adjustment" value={record.details?.transactionType === "credit" ? `Credited: ${formatActivityAmount(record)}` : `Debited: ${formatActivityAmount(record)}`} /><Field label="Reason" value={record.details?.reason || "—"} /><Field label="Transaction ID" value={record.details?.transactionId || "—"} /><Field label="Balance after" value={formatNaira(record.details?.balanceAfter)} /></>}</Panel>
            <Panel title="Additional Information"><Field label="Session ID" value={recorded(record.sessionId)} /><Field label="Browser" value={recorded(record.browser)} /><Field label="Device" value={recorded(record.device)} /><Field label="Screen Resolution" value={recorded(record.screenResolution)} /><Field label="Time Zone" value={recorded(record.timeZone)} /><Field label="Reference" value={record.reference || "—"} /></Panel>
          </div>
        </div>}
      </div>
    </div>
  </div>;
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) { return <section className="rounded-3xl bg-white p-6 shadow-sm"><h3 className="mb-5 text-xl font-bold text-[#08083b]">{title}</h3><div className="space-y-3">{children}</div></section>; }
function Field({ label, value }: { label: string; value: React.ReactNode }) { return <div className="grid grid-cols-[minmax(120px,1fr)_minmax(0,2fr)] gap-4 text-sm"><span className="text-gray-500">{label}</span><span className="break-words text-right font-medium text-[#25254d]">{value}</span></div>; }
function formatNaira(value?: number) { return value === undefined ? "—" : new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(value); }
