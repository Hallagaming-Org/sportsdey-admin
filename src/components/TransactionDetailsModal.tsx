import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { transactionService } from "#/lib/transactions";
import type { DepositSummary, WithdrawalSummary } from "#/lib/transactions";
// Tailwind utilities inlined; removed external CSS file

interface Props {
  transactionId: string;
  open: boolean;
  onClose: () => void;
  onActionSuccess?: () => void;
}

export function TransactionDetailsModal({
  transactionId,
  open,
  onClose,
  onActionSuccess,
}: Props) {
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successType, setSuccessType] = useState<"approved" | "declined">("approved");
  const [rejectReason, setRejectReason] = useState("");

  const {
    data: summary,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["transaction-summary", transactionId],
    queryFn: async () => {
      const result = await transactionService.getTransactionSummary(
        transactionId,
      );
      if (!result.success) throw new Error(result.error || "Failed to fetch");
      return result.data!;
    },
    enabled: open && !!transactionId,
  });

  const approveMutation = useMutation({
    mutationFn: () => transactionService.approveWithdrawal(transactionId),
    onSuccess: (result) => {
      if (result.success) {
        setSuccessType("approved");
        setShowSuccess(true);
        onActionSuccess?.();
      } else {
        toast.error(result.error || "Failed to approve withdrawal");
      }
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to approve withdrawal");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => {
      return transactionService.rejectWithdrawal(transactionId, rejectReason);
    },
    onSuccess: (result) => {
      if (result.success) {
        setSuccessType("declined");
        setShowRejectInput(false);
        setShowSuccess(true);
        onActionSuccess?.();
      } else {
        toast.error(result.error || "Failed to decline withdrawal");
      }
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to decline withdrawal");
    },
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-4xl rounded-[22px] bg-white p-8 shadow-[0_30px_60px_rgba(11,20,48,0.18)] ring-1 ring-gray-50">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-[20px] font-extrabold text-[#03002B]">Transaction Details</h3>
          <button onClick={onClose} className="h-10 w-10 flex items-center justify-center rounded-full bg-[#0b1430] text-white hover:opacity-90" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : error ? (
          <div className="py-20 text-center text-red-500">
            Failed to load transaction details.
            <br />
            <button
              onClick={onClose}
              className="mt-4 rounded-full bg-gray-100 px-4 py-2 text-sm font-medium"
            >
              Close
            </button>
          </div>
        ) : summary ? (
          <Content
            summary={summary}
            showRejectInput={showRejectInput}
            setShowRejectInput={setShowRejectInput}
            rejectReason={rejectReason}
            setRejectReason={setRejectReason}
            showSuccess={showSuccess}
            setShowSuccess={setShowSuccess}
            successType={successType}
            onClose={onClose}
            approveMutation={{
              isPending: approveMutation.isPending,
              mutate: () => approveMutation.mutate(undefined),
            }}
            rejectMutation={{
              isPending: rejectMutation.isPending,
              mutate: () => rejectMutation.mutate(undefined),
            }}
          />
        ) : null}
      </div>
    </div>
  );
}

interface MutationState {
  isPending: boolean;
  mutate: () => void;
}

function Content({
  summary,
  showRejectInput,
  setShowRejectInput,
  rejectReason,
  setRejectReason,
  rejectDetails,
  setRejectDetails,
  showSuccess,
  setShowSuccess,
  successType,
  onClose,
  approveMutation,
  rejectMutation,
}: {
  summary: DepositSummary | WithdrawalSummary;
  showRejectInput: boolean;
  setShowRejectInput: (v: boolean) => void;
  rejectReason: string;
  setRejectReason: (v: string) => void;
  showSuccess: boolean;
  setShowSuccess: (v: boolean) => void;
  successType: "approved" | "declined";
  onClose: () => void;
  approveMutation: MutationState;
  rejectMutation: MutationState;
}) {
  const isDeposit = summary.type === "deposit";
  const headerBadge = isDeposit
    ? "Success"
    : summary.status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const imageSrc = isDeposit
    ? "/transaction-deposit.png"
    : "/transaction-withdrawal.png";

  const amount = `₦${summary.amount.toLocaleString("en-NG")}`;
  const fees = isDeposit
    ? `₦${((summary as DepositSummary).fees ?? 0).toLocaleString("en-NG")}`
    : `₦${((summary as WithdrawalSummary).feesAmount ?? 0).toLocaleString("en-NG")}`;

  const date = isDeposit
    ? (summary as DepositSummary).date ?? ""
    : (summary as WithdrawalSummary).requestedOn ?? "";

  const formattedDate = date
    ? (() => {
        try {
          return new Date(date).toLocaleString("en-US", {
            dateStyle: "medium",
            timeStyle: "short",
          });
        } catch {
          return date;
        }
      })()
    : "";

  const provider = isDeposit
    ? (summary as DepositSummary).provider ?? (summary as any).providerName ?? "N/A"
    : null;

  const description = isDeposit
    ? (summary as DepositSummary).description ?? (summary as any).note ?? ""
    : null;

  const balanceBefore = !isDeposit
    ? (summary as WithdrawalSummary).balanceBefore
    : null;

  const balanceAfter =
    balanceBefore != null
      ? `₦${Math.max(0, balanceBefore - summary.amount).toLocaleString("en-NG")}`
      : "N/A";

  const isPending =
    summary.status === "pending_approval" || summary.status === "Pending Approval";

  return (
    <div className="mt-4 space-y-4">
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="w-full max-w-sm rounded-[18px] bg-white p-8 text-center shadow-[0_20px_50px_rgba(11,20,48,0.25)] ring-1 ring-gray-50">
              <div className="-mt-10 mb-4 h-20 w-20 flex items-center justify-center rounded-full shadow-lg bg-gradient-to-b from-green-400 to-green-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-9 w-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[#03002B]">Success!</h3>
              <p className="mt-2 text-sm text-gray-600">The {successType === "approved" ? "withdrawal has been Approved." : "withdrawal has been Declined."}</p>
              <button
                onClick={() => {
                  setShowSuccess(false);
                  onClose();
                }}
                className="inline-block w-36 h-10 rounded-full text-white font-semibold shadow-md mt-6 bg-gradient-to-b from-green-500 to-green-600"
              >
                Done
              </button>
            </div>
        </div>
      )}
      <h4 className="text-lg font-semibold text-[#03002B]">Transaction Summary</h4>

      <div className="rounded-t-[18px] border border-gray-200 bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500">Transaction ID:</p>
            <p className="font-medium">{summary.transactionId}</p>
            <p className="mt-2 text-sm text-gray-500">
              Type: <span className="font-medium">{summary.type}</span>
            </p>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-700">
              {headerBadge}
            </div>
            <p className="mt-3 text-lg font-semibold">{amount}</p>
          </div>
        </div>
        <div className="mt-4 h-0.5 bg-gray-100" />
        <div className="mt-3 flex items-center gap-4">
          <img
            src={imageSrc}
            alt={summary.type}
            className="h-24 w-24 rounded-md object-cover"
          />
          <div className="flex-1 grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Amount</p>
              <p className="font-medium">{amount}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">
                {isDeposit ? "Fees" : "Fees Amount"}
              </p>
              <p className="font-medium">{fees}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">
                {isDeposit ? "Date" : "Requested On"}
              </p>
              <p className="font-medium whitespace-pre-line">{formattedDate}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Balance After</p>
              <p className="font-medium">{balanceAfter}</p>
            </div>
          </div>
        </div>
      </div>
      {isDeposit && (
        <div className="rounded-b-[18px] bg-green-50 p-4 border border-t-0 border-gray-200">
          <div className="flex items-center justify-between text-green-700">
            <span className="text-sm font-medium">Amount Credited</span>
            <span className="text-sm font-semibold">{amount}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h4 className="font-semibold">Payment Information</h4>
          <div className="mt-3 space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Payment Method:</span>
              <span className="font-medium">{summary.paymentMethod}</span>
            </div>
              {isDeposit && (
                <div className="flex justify-between">
                  <span>Provider:</span>
                  <span className="font-medium">{provider ?? "N/A"}</span>
                </div>
              )}
            <div className="flex justify-between">
              <span>Reference ID:</span>
              <span className="font-medium">{summary.referenceId}</span>
            </div>
            {isDeposit ? (
              <>
                <div className="flex justify-between">
                  <span>Card Type:</span>
                  <span className="font-medium">
                    {(summary as DepositSummary).cardType ?? "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Card Last 4:</span>
                  <span className="font-medium">
                    {(summary as DepositSummary).cardLast4 ?? "N/A"}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between">
                  <span>Bank Name:</span>
                  <span className="font-medium">
                    {(summary as WithdrawalSummary).bankName ?? "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Account Number:</span>
                  <span className="font-medium">
                    {(summary as WithdrawalSummary).accountNumber ?? "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Account Name:</span>
                  <span className="font-medium">
                    {(summary as WithdrawalSummary).accountName ?? "N/A"}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h4 className="font-semibold">Additional Information</h4>
          <div className="mt-3 space-y-2 text-sm text-gray-600">
            {isDeposit && (
              <div className="flex justify-between">
                <span>Description/Note:</span>
                <span className="font-medium">{description || "N/A"}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>IP Address:</span>
              <span className="font-medium">{summary.ipAddress || "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span>Device:</span>
              <span className="font-medium">{summary.device || "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span>Location:</span>
              <span className="font-medium">{summary.location || "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span>Channel:</span>
              <span className="font-medium">
                {summary.transactionChannel || "N/A"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <button className="w-full rounded-full bg-gray-100 px-4 py-3 text-sm font-medium">
          Download Receipt
        </button>
        <div className="flex gap-3">
          {isDeposit ? (
            <>
              <button className="flex-1 rounded-full bg-red-50 px-4 py-3 text-sm font-medium text-red-600 border border-red-100">
                Flag/Mark as Fraud
              </button>
              <button className="flex-1 rounded-full bg-white px-4 py-3 text-sm font-medium border border-gray-200">
                View Player profile
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setShowRejectInput(true)}
                disabled={rejectMutation.isPending || !isPending}
                className="flex-1 rounded-full bg-red-50 px-4 py-3 text-sm font-medium text-red-600 border border-red-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {rejectMutation.isPending ? (
                  <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                ) : (
                  "Decline Withdrawal"
                )}
              </button>
              <button
                onClick={() => approveMutation.mutate()}
                disabled={approveMutation.isPending || !isPending}
                className="flex-1 rounded-full bg-green-600 px-4 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {approveMutation.isPending ? (
                  <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                ) : (
                  "Approve Withdrawal"
                )}
              </button>
            </>
          )}
        </div>
        {showRejectInput && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-lg">
              <div className="flex items-start justify-between">
                <h3 className="font-bold text-xl text-[#03002B]">Decline Withdrawal</h3>
                <button onClick={() => setShowRejectInput(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div className="flex items-center gap-4">
                  <img src="/avatar-placeholder.png" alt="avatar" className="h-12 w-12 rounded-full object-cover" />
                  <div className="flex-1">
                    <p className="font-medium">{(summary as WithdrawalSummary).accountName || "Customer"}</p>
                    <p className="text-sm text-gray-500">{(summary as WithdrawalSummary).accountNumber || "N/A"}</p>
                  </div>
                  <div className="text-sm text-gray-500">Requested On: {date}</div>
                </div>
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-sm text-gray-600">Please tell us why you’re Declining</label>
                <textarea
                  placeholder="Reason"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="mt-3 w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  rows={3}
                />
              </div>

              <div className="mt-4 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowRejectInput(false);
                    setRejectReason("");
                  }}
                  className="rounded-full border border-gray-200 bg-gray-100 px-4 py-2 text-sm font-medium"
                >
                  Keep Transaction
                </button>
                <button
                  onClick={() => rejectMutation.mutate()}
                  disabled={!rejectReason.trim() || rejectMutation.isPending}
                  className="rounded-full bg-green-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {rejectMutation.isPending ? (
                    <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                  ) : (
                    "Submit & Decline"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TransactionDetailsModal;
