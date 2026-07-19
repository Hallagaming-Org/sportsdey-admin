import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DataTable, type Column } from "./DataTable";
import { TimePeriodFilter, type TimePeriod } from "./TimePeriodFilter";
import { ChevronDown, Plus, Minus, Loader2 } from "lucide-react";
import { SuccessModal } from "./SuccessModal";
import { useHasPermission } from "../hooks/useCurrentUser";
import { userService, type UserTransaction } from "../lib/users";
import { getDateRangeForPeriod } from "#/lib/time-period";
import { toast } from "sonner";

import * as XLSX from "xlsx";
import { FaFileExport, FaFileExcel, FaFilePdf, FaFileWord } from "react-icons/fa6";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, WidthType } from "docx";

interface UserProfileWalletInfoProps {
  userId: string;
  balance: number;
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />;
}

export function UserProfileWalletInfo({ userId, balance }: UserProfileWalletInfoProps) {
  const canManualCreditDebit = useHasPermission("manual_credit_debit");
  const queryClient = useQueryClient();
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<TimePeriod>("All");
  const [customRange, setCustomRange] = useState<{ start: string; end: string } | undefined>(undefined);
  const [transactionType, setTransactionType] = useState<"credit" | "debit">("credit");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [successData, setSuccessData] = useState<{ type: "credit" | "debit"; amount: string } | null>(null);

  const { fromDate, toDate } = getDateRangeForPeriod(selectedTimePeriod, customRange, { output: "iso" });

  const { data: overview, isLoading: isOverviewLoading } = useQuery({
    queryKey: ["user-wallet-overview", userId, fromDate, toDate],
    queryFn: async () => {
      const res = await userService.getUserWalletOverview(userId, { fromDate, toDate });
      if (!res.success) return null;
      return res.data;
    },
    enabled: !!userId,
  });

  const { data: txData, isLoading: isTxLoading } = useQuery({
    queryKey: ["user-wallet-transactions", userId, fromDate, toDate],
    queryFn: async () => {
      const res = await userService.getUserWalletTransactions(userId, { fromDate, toDate, limit: 10 });
      if (!res.success) return null;
      return res.data;
    },
    enabled: !!userId,
  });

  const manualMutation = useMutation({
    mutationFn: async () => {
      const numAmount = Number(amount);
      if (!amount || Number.isNaN(numAmount) || numAmount <= 0) {
        throw new Error("Please enter a valid amount");
      }
      if (!reason.trim()) {
        throw new Error("Please select a reason");
      }
      const res = await userService.processManualTransaction(userId, {
        type: transactionType,
        amount: numAmount,
        reason: reason.trim(),
      });
      if (!res.success) throw new Error(res.error || "Failed to process manual transaction");
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-wallet-overview", userId] });
      queryClient.invalidateQueries({ queryKey: ["user-wallet-transactions", userId] });
      queryClient.invalidateQueries({ queryKey: ["user-profile", userId] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setSuccessData({ type: transactionType, amount });
      setShowSuccessModal(true);
      setAmount("");
      setReason("");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const handleProcessTransaction = () => {
    manualMutation.mutate();
  };

  const rawTxList = (txData as any)?.transactions || (txData as any)?.data || (Array.isArray(txData) ? txData : []);
  const transactions: UserTransaction[] = Array.isArray(rawTxList) ? rawTxList : [];

  const columns: Column<UserTransaction>[] = [
    {
      header: "Type",
      accessor: (t) => {
        const typeStr = String(t.type || "").toLowerCase();
        if (typeStr === "deposit") return "Deposit";
        if (typeStr === "withdrawal") return "Withdrawal";
        if (typeStr === "manual_credit" || typeStr === "credit") return "Manual Credit";
        if (typeStr === "manual_debit" || typeStr === "debit") return "Manual Debit";
        return t.type || "Transaction";
      },
      cellClassName: "font-medium text-gray-900",
    },
    {
      header: "Amount",
      accessor: (t) => {
        const amt = typeof t.amount === "number" ? t.amount : parseFloat(String(t.amount || 0));
        return `₦${(isNaN(amt) ? 0 : amt).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      },
      cellClassName: "font-bold text-gray-900",
    },
    {
      header: "Reference ID",
      accessor: (t) => t.referenceId || t.id || "-",
      cellClassName: "font-mono text-gray-500",
    },
    {
      header: "Date & Time",
      accessor: (t) => {
        if (!t.dateTime) return <span className="text-gray-400 text-xs">-</span>;
        const d = new Date(t.dateTime);
        if (isNaN(d.getTime())) {
          return <span className="whitespace-pre-line text-gray-500 text-xs">{t.dateTime}</span>;
        }
        const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        const timeStr = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase();
        return (
          <span className="block text-gray-500 text-xs">
            <span className="font-semibold text-gray-900 block">{dateStr}</span>
            <span>{timeStr}</span>
          </span>
        );
      },
    },
    {
      header: "Status",
      accessor: (t) => {
        const s = String(t.status || "").toLowerCase();
        const isSuccess = s === "success" || s === "completed";
        const isPending = s === "pending" || s === "processing";
        const isFailed = s === "failed" || s === "rejected";

        const badgeCls = isSuccess
          ? "bg-[#E8F8E5] text-[#10C300]"
          : isPending
            ? "bg-[#FFF8E5] text-[#FFB000]"
            : isFailed
              ? "bg-[#FEECEB] text-[#EE201C]"
              : "bg-gray-100 text-gray-600";

        return (
          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${badgeCls}`}>
            {isSuccess ? "Success" : isPending ? "Pending" : isFailed ? "Failed" : t.status || "Completed"}
          </span>
        );
      },
    },
  ];

  const formatCurrency = (val?: number | null) => {
    if (val == null) return null;
    return `₦${val.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const exportToExcel = () => {
    const dataToExport = transactions.map((t) => ({
      "Type": String(t.type || ""),
      "Amount": typeof t.amount === "number" ? `₦${t.amount.toLocaleString()}` : String(t.amount || 0),
      "Reference ID": t.referenceId || t.id || "-",
      "Date & Time": t.dateTime || "-",
      "Status": t.status || "Completed",
    }));

    if (!dataToExport || dataToExport.length === 0) {
      toast.error("No transactions to export");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
    XLSX.writeFile(workbook, `Transactions_${userId}_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const exportToPdf = () => {
    if (!transactions || transactions.length === 0) {
      toast.error("No transactions to export");
      return;
    }
    const doc = new jsPDF("landscape");
    doc.text("Transaction Summary", 14, 15);
    autoTable(doc, {
      head: [["Type", "Amount", "Reference ID", "Date & Time", "Status"]],
      body: transactions.map((t) => [
        String(t.type || ""),
        typeof t.amount === "number" ? `₦${t.amount.toLocaleString()}` : String(t.amount || 0),
        t.referenceId || t.id || "-",
        t.dateTime || "-",
        t.status || "Completed",
      ]),
      startY: 20,
    });
    doc.save(`Transactions_${userId}_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const exportToDocx = async () => {
    if (!transactions || transactions.length === 0) {
      toast.error("No transactions to export");
      return;
    }

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "Transaction Summary",
                  bold: true,
                  size: 28,
                }),
              ],
              spacing: { after: 300 },
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: ["Type", "Amount", "Reference ID", "Date & Time", "Status"].map(
                    (header) =>
                      new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: header, bold: true })] })],
                        shading: { fill: "f3f4f6" },
                      })
                  ),
                }),
                ...transactions.map(
                  (t) =>
                    new TableRow({
                      children: [
                        String(t.type || ""),
                        typeof t.amount === "number" ? `₦${t.amount.toLocaleString()}` : String(t.amount || 0),
                        t.referenceId || t.id || "-",
                        t.dateTime || "-",
                        t.status || "Completed",
                      ].map(
                        (val) =>
                          new TableCell({
                            children: [new Paragraph({ children: [new TextRun({ text: String(val) })] })],
                          })
                      ),
                    })
                ),
              ],
            }),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Transactions_${userId}_${new Date().toISOString().split("T")[0]}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Wallet Overview */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h4 className="font-bold text-xl text-gray-900">Wallet Overview</h4>
          <TimePeriodFilter 
            onFilterChange={(period, range) => {
              setSelectedTimePeriod(period);
              setCustomRange(range);
            }}
            buttonClassName="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-gray-500 text-sm mb-1">Current Balance</p>
            {isOverviewLoading ? (
              <Skeleton className="h-7 w-28 mt-1" />
            ) : (
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(overview?.currentBalance) ?? `₦${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
              </p>
            )}
          </div>
          <div>
            <p className="text-gray-500 text-sm mb-1">Total Deposits</p>
            {isOverviewLoading ? (
              <Skeleton className="h-7 w-28 mt-1" />
            ) : (
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(overview?.totalDeposits) ?? "₦0.00"}
              </p>
            )}
          </div>
          <div>
            <p className="text-gray-500 text-sm mb-1">Total Withdrawals</p>
            {isOverviewLoading ? (
              <Skeleton className="h-7 w-28 mt-1" />
            ) : (
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(overview?.totalWithdrawals) ?? "₦0.00"}
              </p>
            )}
          </div>
          <div>
            <p className="text-gray-500 text-sm mb-1">Net Position (GGR)</p>
            {isOverviewLoading ? (
              <Skeleton className="h-7 w-28 mt-1" />
            ) : (
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(overview?.netPosition) ?? "₦0.00"}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Transaction Summary */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col min-h-[300px]">
        <div className="flex items-center justify-between mb-6">
          <h4 className="font-bold text-xl text-gray-900">Transaction Summary</h4>
          {transactions.length > 0 && (
            <div className="relative">
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (e.nativeEvent) {
                    e.nativeEvent.stopImmediatePropagation();
                  }
                  setShowExportDropdown(!showExportDropdown);
                }}
                className="inline-flex items-center h-9 gap-1.5 rounded-full bg-[#1BAA04] px-3.5 py-1.5 text-xs font-medium text-white cursor-pointer hover:bg-[#158903] transition-colors"
              >
                Export File as
                <FaFileExport className="h-3 w-3 text-white" />
              </button>

              {showExportDropdown && (
                <div className="absolute right-0 z-[70] mt-2 w-40 rounded-xl border border-gray-200 bg-white p-1 shadow-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowExportDropdown(false);
                      exportToPdf();
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <FaFilePdf className="text-red-500 w-4 h-4" />
                    PDF
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowExportDropdown(false);
                      exportToDocx();
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <FaFileWord className="text-blue-600 w-4 h-4" />
                    DOCX
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowExportDropdown(false);
                      exportToExcel();
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <FaFileExcel className="text-green-600 w-4 h-4" />
                    Excel
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex-1 min-h-0">
          <DataTable 
            columns={columns}
            data={transactions}
            maxHeight="300px"
            onActionClick={() => {}}
            actionMenuItems={[]}
            emptyMessage="No transactions found"
            isLoading={isTxLoading}
          />
        </div>
      </div>

      {/* Manual Credit/Debits */}
      {canManualCreditDebit && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h4 className="font-bold text-xl text-gray-900">Manual Credit/Debits</h4>
          <p className="text-gray-500 text-sm mb-6">Manually adjust user wallet balance</p>
          
          <div className="flex items-end gap-6 flex-wrap lg:flex-nowrap">
            <div className="flex-none">
              <p className="text-gray-700 text-sm font-medium mb-2">Transaction Type</p>
              <div className="flex items-center gap-2">
                <button 
                  type="button"
                  onClick={() => setTransactionType("credit")}
                  className={`inline-flex items-center gap-2 px-2 w-[84px] py-2 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${
                    transactionType === "credit" ? "border-[#10C300] bg-[#F7FEF7] text-[#10C300]" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <div className="w-[14px] h-[14px] rounded-full flex items-center justify-center border border-[#1BAA04]">
                    <Plus className="w-4 h-4" />
                  </div>
                  Credit
                </button>
                <button 
                  type="button"
                  onClick={() => setTransactionType("debit")}
                  className={`inline-flex items-center gap-2 px-2 w-[84px] py-2 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${
                    transactionType === "debit" ? "border-[#EE201C] bg-[#FEECEB] text-[#EE201C]" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <div className="w-[14px] h-[14px] rounded-full flex items-center justify-center border border-[#F3442D]">
                    <Minus className="w-4 h-4 text-[#F3442D]" />
                  </div>
                  Debit
                </button>
              </div>
            </div>

            <div className="flex-1 min-w-[200px]">
              <p className="text-gray-700 text-sm font-medium mb-2">Amount (₦)</p>
              <input 
                type="number" 
                min="1"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#10C300] focus:outline-none focus:ring-1 focus:ring-[#10C300]"
              />
            </div>

            <div className="flex-1 w-[207px]">
              <p className="text-gray-700 text-sm font-medium mb-2">Reasons</p>
              <div className="relative">
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 pr-10 text-sm text-gray-700 focus:border-[#10C300] focus:outline-none focus:ring-1 focus:ring-[#10C300] cursor-pointer"
                >
                  <option value="" disabled>Select a reason</option>
                  <option value="bonus">Bonus</option>
                  <option value="refund">Refund</option>
                  <option value="correction">Correction</option>
                  <option value="promotional_credit">Promotional Credit</option>
                  <option value="compensation">Compensation</option>
                  <option value="fraud_reversal">Fraud Reversal</option>
                  <option value="other">Other</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 w-4 h-4 -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <button 
              type="button"
              onClick={handleProcessTransaction}
              disabled={!amount || !reason || manualMutation.isPending}
              className="bg-[#1BAA04] hover:bg-[#0ea800] text-white font-bold px-8 py-3 rounded-[6px] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {manualMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                "Process Transaction"
              )}
            </button>
          </div>
        </div>
      )}

      <SuccessModal 
        open={showSuccessModal} 
        onClose={() => setShowSuccessModal(false)}
        text={successData ? `This user has been successfully ${successData.type === 'credit' ? 'credited' : 'Debited'} with an amount of ₦${Number(successData.amount).toLocaleString()}.` : ""}
      />
    </div>
  );
}
