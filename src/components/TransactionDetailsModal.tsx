import { useMutation, useQuery } from "@tanstack/react-query";

import { Loader2, X, Copy, Wallet, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { transactionService } from "#/lib/transactions";
import type { DepositSummary, WithdrawalSummary } from "#/lib/transactions";

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
      <div className="flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-[22px] bg-[#F8F9FC] shadow-[0_30px_60px_rgba(11,20,48,0.18)]">
        {/* Header */}
        <div className="bg-white px-8 py-5 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 flex items-center justify-center rounded-full bg-[#E8F8EE] text-[#1E9E24]">
              <Wallet className="h-5 w-5" />
            </div>
            <h3 className="text-[20px] font-bold text-[#030229]">Transaction Details</h3>
          </div>
          <button onClick={onClose} className="h-9 w-9 flex items-center justify-center rounded-full bg-[#030229] text-white hover:opacity-90 transition-opacity cursor-pointer" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto p-6">
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
                className="mt-4 rounded-full bg-gray-100 px-4 py-2 text-sm font-medium cursor-pointer"
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

  const amount = `₦${summary.amount.toLocaleString("en-NG")}`;
  const fees = isDeposit
    ? `₦${((summary as DepositSummary).fees ?? 0).toLocaleString("en-NG")}`
    : `₦${((summary as WithdrawalSummary).feesAmount ?? 0).toLocaleString("en-NG")}`;

  const date = isDeposit
    ? (summary as DepositSummary).date ?? ""
    : (summary as WithdrawalSummary).requestedOn ?? "";

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    try {
      const formatted = new Date(dateString).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      });
      return formatted.replace(" AM", " am").replace(" PM", " pm");
    } catch {
      return dateString;
    }
  };

  const formattedDate = formatDate(date);

  const provider = isDeposit
    ? (summary as DepositSummary).provider ?? (summary as any).providerName ?? "N/A"
    : null;

  const description = isDeposit
    ? (summary as DepositSummary).description ?? (summary as any).note ?? ""
    : null;

  const balanceBefore = !isDeposit
    ? (summary as WithdrawalSummary).balanceBefore
    : null;

  const formattedBalanceBefore = balanceBefore != null
    ? `₦${balanceBefore.toLocaleString("en-NG")}`
    : "N/A";

  const requestedOn = !isDeposit ? (summary as WithdrawalSummary).requestedOn : null;
  const processedOn = !isDeposit ? (summary as WithdrawalSummary).processedOn : null;

  const formattedRequestedOn = requestedOn ? formatDate(requestedOn) : "";
  const formattedProcessedOn = processedOn ? formatDate(processedOn) : "";

  const isPending =
    summary.status === "pending_approval" || 
    summary.status === "Pending Approval" || 
    summary.status.toLowerCase() === "pending";

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const getStatusBadge = (status: string) => {
    const norm = status.toLowerCase().replace(/_/g, " ");
    if (norm.includes("success") || norm.includes("completed") || norm === "won") {
      return (
        <span className="inline-flex items-center rounded-full bg-[#E8F8EE] px-3.5 py-1 text-sm font-semibold text-[#1E9E24] border border-[#BFF0D4]">
          Success
        </span>
      );
    }
    if (norm.includes("pending") || norm.includes("process")) {
      return (
        <span className="inline-flex items-center rounded-full bg-[#FCF8E3] px-3.5 py-1 text-sm font-semibold text-[#B89020] border border-[#F5E7B7]">
          Pending
        </span>
      );
    }
    if (norm.includes("fail") || norm.includes("decline") || norm.includes("reject")) {
      return (
        <span className="inline-flex items-center rounded-full bg-[#FEE2E2] px-3.5 py-1 text-sm font-semibold text-[#DC2626] border border-[#FCA5A5]">
          Failed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full bg-gray-50 px-3.5 py-1 text-sm font-semibold text-gray-600 border border-gray-200">
        {status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-[22px] bg-white p-8 text-center shadow-[0_20px_50px_rgba(11,20,48,0.25)] ring-1 ring-gray-50 animate-in fade-in zoom-in-95 duration-200">
            <div className="mx-auto mb-5 h-16 w-16 flex items-center justify-center rounded-full bg-[#E8F8EE] text-[#1E9E24]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-[#030229]">Success!</h3>
            <p className="mt-2 text-sm text-[#82869A]">The {successType === "approved" ? "withdrawal has been Approved." : "withdrawal has been Declined."}</p>
            <button
              onClick={() => {
                setShowSuccess(false);
                onClose();
              }}
              className="w-full h-11 rounded-full text-white font-bold shadow-md mt-6 bg-[#1E9E24] hover:bg-[#16851B] transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Transaction Summary Card */}
      <div className="bg-white rounded-[18px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-[16px] font-bold text-[#030229]">Transaction Summary</h4>
            {!isDeposit && (
              <button 
                onClick={() => {
                  toast.info("Viewing player profile...");
                }}
                className="text-sm font-semibold text-[#1E9E24] underline hover:text-[#15803D] cursor-pointer"
              >
                View Player profile
              </button>
            )}
          </div>

          <div className="space-y-3.5">
            {/* Transaction ID */}
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#82869A] shrink-0">Transaction ID:</span>
              <span className="font-medium text-[#030229] flex items-center gap-1.5">
                {summary.transactionId}
                <button 
                  onClick={() => handleCopy(summary.transactionId, "Transaction ID")}
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                  title="Copy Transaction ID"
                >
                  <Copy className="h-3.5 w-3.5 text-[#1E9E24]" />
                </button>
              </span>
            </div>

            {/* Type */}
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#82869A] shrink-0">Type:</span>
              <span className="font-semibold text-[#030229] underline capitalize">
                {summary.type}
              </span>
            </div>

            {/* Status */}
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#82869A] shrink-0">Status:</span>
              {getStatusBadge(summary.status)}
            </div>

            {/* Amount */}
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#82869A] shrink-0">Amount:</span>
              <span className="font-bold text-[#030229] text-[15px]">{amount}</span>
            </div>

            {/* Fees */}
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#82869A] shrink-0">{isDeposit ? "Fees" : "Fees Amount"}:</span>
              <span className="font-bold text-[#030229] text-[15px]">{fees}</span>
            </div>

            {/* Date / Requested On */}
            {isDeposit ? (
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#82869A] shrink-0">Date:</span>
                <span className="font-medium text-[#030229]">{formattedDate}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#82869A] shrink-0">Requested On:</span>
                  <span className="font-medium text-[#030229]">{formattedRequestedOn}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#82869A] shrink-0">Processed On:</span>
                  <span className="font-medium text-[#030229]">{formattedProcessedOn || "N/A"}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Amount Credited Banner (Deposit only) */}
        {isDeposit && (
          <div className="bg-[#E8F8EE] px-6 py-3.5 flex items-center justify-between border-t border-[#D1F2DB]">
            <span className="text-sm font-bold text-[#1E9E24]">Amount Credited</span>
            <span className="text-sm font-bold text-[#1E9E24]">{amount}</span>
          </div>
        )}
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Payment Information Card */}
        <div className="bg-white rounded-[18px] border border-gray-100 shadow-sm p-6 space-y-4">
          <h4 className="text-[16px] font-bold text-[#030229]">Payment Information</h4>
          <div className="space-y-3.5 text-sm">
            {isDeposit ? (
              <>
                {/* Payment Method */}
                <div className="flex justify-between items-center">
                  <span className="text-[#82869A] shrink-0">Payment Method:</span>
                  <span className="font-bold text-[#030229]">{summary.paymentMethod}</span>
                </div>
                {/* Provider */}
                <div className="flex justify-between items-center">
                  <span className="text-[#82869A] shrink-0">Provider:</span>
                  <span className="font-bold text-[#030229]">{provider || "N/A"}</span>
                </div>
                {/* Reference ID */}
                <div className="flex justify-between items-center">
                  <span className="text-[#82869A] shrink-0">Reference ID:</span>
                  <span className="font-medium text-[#030229] flex items-center gap-1.5">
                    {summary.referenceId}
                    <button 
                      onClick={() => handleCopy(summary.referenceId, "Reference ID")}
                      className="hover:opacity-80 transition-opacity cursor-pointer"
                      title="Copy Reference ID"
                    >
                      <Copy className="h-3.5 w-3.5 text-[#1E9E24]" />
                    </button>
                  </span>
                </div>
                {/* Card Type */}
                <div className="flex justify-between items-center">
                  <span className="text-[#82869A] shrink-0">Card Type:</span>
                  <span className="font-bold text-[#030229]">{(summary as DepositSummary).cardType || "N/A"}</span>
                </div>
                {/* Card last 4 Digits */}
                <div className="flex justify-between items-center">
                  <span className="text-[#82869A] shrink-0">Card last 4 Digits:</span>
                  <span className="font-bold text-[#030229]">
                    {(summary as DepositSummary).cardLast4 ? `****${(summary as DepositSummary).cardLast4}` : "N/A"}
                  </span>
                </div>
              </>
            ) : (
              <>
                {/* Payment Method */}
                <div className="flex justify-between items-center">
                  <span className="text-[#82869A] shrink-0">Payment Method:</span>
                  <span className="font-bold text-[#030229]">{summary.paymentMethod}</span>
                </div>
                {/* Bank Name */}
                <div className="flex justify-between items-center">
                  <span className="text-[#82869A] shrink-0">Bank Name:</span>
                  <span className="font-bold text-[#030229]">
                    {(() => {
                      const bank = (summary as WithdrawalSummary).bankName;
                      if (!bank) return "N/A";
                      return bank.startsWith("(") && bank.endsWith(")") ? bank : `(${bank})`;
                    })()}
                  </span>
                </div>
                {/* Account Number ID */}
                <div className="flex justify-between items-center">
                  <span className="text-[#82869A] shrink-0">Account Number ID:</span>
                  <span className="font-bold text-[#030229]">
                    {(() => {
                      const accNum = (summary as WithdrawalSummary).accountNumber;
                      if (!accNum) return "N/A";
                      if (accNum.includes("*")) return accNum;
                      return accNum.length > 4 ? `****${accNum.slice(-4)}` : accNum;
                    })()}
                  </span>
                </div>
                {/* Account Name */}
                <div className="flex justify-between items-center">
                  <span className="text-[#82869A] shrink-0">Account Name:</span>
                  <span className="font-bold text-[#030229]">{(summary as WithdrawalSummary).accountName || "N/A"}</span>
                </div>
                {/* Reference ID */}
                <div className="flex justify-between items-center">
                  <span className="text-[#82869A] shrink-0">Reference ID:</span>
                  <span className="font-medium text-[#030229] flex items-center gap-1.5">
                    {summary.referenceId}
                    <button 
                      onClick={() => handleCopy(summary.referenceId, "Reference ID")}
                      className="hover:opacity-80 transition-opacity cursor-pointer"
                      title="Copy Reference ID"
                    >
                      <Copy className="h-3.5 w-3.5 text-[#1E9E24]" />
                    </button>
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Additional Information Card */}
        <div className="bg-white rounded-[18px] border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-[16px] font-bold text-[#030229]">Additional Information</h4>
            {!isDeposit && (
              <button 
                onClick={() => toast.info("More actions...")}
                className="text-[#82869A] hover:text-[#030229] transition-colors cursor-pointer"
                title="More Options"
              >
                <MoreHorizontal className="h-5 w-5" />
              </button>
            )}
          </div>
          <div className="space-y-3.5 text-sm">
            {isDeposit ? (
              <>
                {/* Description/Note */}
                <div className="flex justify-between items-center">
                  <span className="text-[#82869A] shrink-0">Description/Note:</span>
                  <span className="font-medium text-[#030229]">{description || "Deposit to main Wallet"}</span>
                </div>
              </>
            ) : (
              <>
                {/* Balance Before */}
                <div className="flex justify-between items-center">
                  <span className="text-[#82869A] shrink-0">Balance Before:</span>
                  <span className="font-bold text-[#030229]">{formattedBalanceBefore}</span>
                </div>
              </>
            )}
            {/* IP Address */}
            <div className="flex justify-between items-center">
              <span className="text-[#82869A] shrink-0">IP Address:</span>
              <span className="font-medium text-[#030229]">{summary.ipAddress || "N/A"}</span>
            </div>
            {/* Device */}
            <div className="flex justify-between items-center">
              <span className="text-[#82869A] shrink-0">Device:</span>
              <span className="font-medium text-[#030229]">{summary.device || "N/A"}</span>
            </div>
            {/* Location */}
            <div className="flex justify-between items-center">
              <span className="text-[#82869A] shrink-0">Location:</span>
              <span className="font-medium text-[#030229]">{summary.location || "N/A"}</span>
            </div>
            {/* Transaction Channel */}
            <div className="flex justify-between items-center">
              <span className="text-[#82869A] shrink-0">Transaction Channel:</span>
              <span className="font-medium text-[#030229]">{summary.transactionChannel || "N/A"}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Buttons */}
      <div className="space-y-3 pt-2">
        <button 
          onClick={() => toast.success("Receipt download started")}
          className="w-full py-3.5 bg-[#EEF0F3] hover:bg-[#E5E7EB] text-[#030229] font-bold rounded-full transition-colors text-sm text-center cursor-pointer"
        >
          Download Receipt
        </button>
        <div className="flex gap-4">
          {isDeposit ? (
            <>
              <button 
                onClick={() => toast.success("Transaction flagged successfully")}
                className="flex-1 py-3.5 bg-[#FFEBEB] hover:bg-[#FDD8D8] text-[#E11D48] font-bold rounded-full transition-colors text-sm text-center cursor-pointer"
              >
                Flag/Mark as Fraud
              </button>
              <button 
                onClick={() => toast.info("Redirecting to player profile...")}
                className="flex-1 py-3.5 bg-[#EEF0F3] hover:bg-[#E5E7EB] text-[#030229] font-bold rounded-full transition-colors text-sm text-center cursor-pointer"
              >
                View Player profile
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setShowRejectInput(true)}
                disabled={rejectMutation.isPending || !isPending}
                className="flex-1 py-3.5 bg-[#FFEBEB] hover:bg-[#FDD8D8] text-[#E11D48] font-bold rounded-full transition-colors text-sm text-center disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
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
                className="flex-1 py-3.5 bg-[#1E9E24] hover:bg-[#16851B] text-white font-bold rounded-full transition-colors text-sm text-center disabled:cursor-not-allowed disabled:opacity-50 shadow-sm cursor-pointer"
              >
                {approveMutation.isPending ? (
                  <Loader2 className="mx-auto h-4 w-4 animate-spin text-white" />
                ) : (
                  "Approve Withdrawal"
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Decline Dialog */}
      {showRejectInput && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-lg animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <h3 className="font-bold text-xl text-[#030229]">Decline Withdrawal</h3>
              <button onClick={() => setShowRejectInput(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-[#EEF0F3] flex items-center justify-center font-bold text-[#030229]">
                  {((summary as WithdrawalSummary).accountName || "Customer").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-[#030229]">{(summary as WithdrawalSummary).accountName || "Customer"}</p>
                  <p className="text-sm text-[#82869A]">{(summary as WithdrawalSummary).accountNumber || "N/A"}</p>
                </div>
                <div className="text-xs text-[#82869A]">Requested On: {formattedRequestedOn}</div>
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-sm font-semibold text-[#030229]">Please tell us why you’re Declining</label>
              <textarea
                placeholder="Reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="mt-3 w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-[#1E9E24] focus:outline-none focus:ring-1 focus:ring-[#1E9E24] text-[#030229]"
                rows={3}
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRejectInput(false);
                  setRejectReason("");
                }}
                className="rounded-full bg-[#EEF0F3] hover:bg-[#E5E7EB] px-5 py-2.5 text-sm font-bold text-[#030229] transition-colors cursor-pointer"
              >
                Keep Transaction
              </button>
              <button
                onClick={() => rejectMutation.mutate()}
                disabled={!rejectReason.trim() || rejectMutation.isPending}
                className="rounded-full bg-[#1E9E24] hover:bg-[#16851B] px-5 py-2.5 text-sm font-bold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {rejectMutation.isPending ? (
                  <Loader2 className="mx-auto h-4 w-4 animate-spin text-white" />
                ) : (
                  "Submit & Decline"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TransactionDetailsModal;
