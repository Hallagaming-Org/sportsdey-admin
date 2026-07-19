import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { MoreHorizontal, Copy, Eye } from "lucide-react";
import { toast } from "sonner";
import { TimePeriodFilter, type TimePeriod } from "./TimePeriodFilter";
import { ticketService, type TicketRecord } from "../lib/tickets";
import { ActionDropdown } from "./ActionDropdown";
import { TicketDetailsView } from "./TicketDetailsView";
import { getDateRangeForPeriod } from "#/lib/time-period";

import * as XLSX from "xlsx";
import { FaFileExport, FaFileExcel, FaFilePdf, FaFileWord } from "react-icons/fa6";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, WidthType } from "docx";

interface UserProfileHistoryProps {
  userId: string;
}

function calcDynamicCardFontSize(val: string | number | null | undefined, maxPx = 24, minPx = 10, baseChars = 9) {
  const str = String(val ?? "");
  if (!str || str.length <= baseChars) return { fontSize: `${maxPx}px`, lineHeight: "1.2" };
  const scale = baseChars / str.length;
  const fontPx = Math.max(minPx, Math.min(maxPx, Math.round(scale * maxPx * 10) / 10));
  return { fontSize: `${fontPx}px`, lineHeight: "1.2", wordBreak: "break-all" as const };
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />;
}

export function UserProfileHistory({ userId }: UserProfileHistoryProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("All");
  const [customRange, setCustomRange] = useState<{ start: string; end: string } | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [selectedTicketDetails, setSelectedTicketDetails] = useState<TicketRecord | null>(null);
  const [actionDropdown, setActionDropdown] = useState<{ ticket: TicketRecord; top: number; right: number } | null>(null);
  const limit = 10;

  useEffect(() => {
    const handleClickOutside = () => setActionDropdown(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const { fromDate, toDate } = getDateRangeForPeriod(timePeriod, customRange, { output: "date" });

  const { data: ticketOverview, isLoading: isOverviewLoading } = useQuery({
    queryKey: ["user-ticket-overview", userId, fromDate, toDate],
    queryFn: async () => {
      const res = await ticketService.getUserTicketOverview(userId, { fromDate, toDate });
      if (!res.success) return null;
      return res.data;
    },
    enabled: !!userId,
  });

  const { data: ticketsData, isLoading: isTicketsLoading } = useQuery({
    queryKey: ["user-history-tickets", userId, page, fromDate, toDate],
    queryFn: async () => {
      const res = await ticketService.getUserTickets(userId, {
        page,
        limit,
        type: "all",
        fromDate,
        toDate,
      });
      if (!res.success) return null;
      return res.data;
    },
    enabled: !!userId,
  });

  // Sample/mock items if API has no tickets yet for demo
  const sampleTickets = [
    {
      id: "012345",
      dateTime: "Aug 8, 2025\n10:42 pm",
      amount: "₦150,000.00",
      gameType: "Casino",
      gameName: "Slots",
      provider: "Thndr",
      roundId: "41abeae8-587b-5a9d-944a-d934d127046c",
      balanceBefore: "₦14,358.59",
      balanceAfter: "₦15,738.29",
      odds: "0.50",
      potentialWin: "₦150,000.00",
      payOut: "₦150,000.00",
      status: "Won",
    },
    {
      id: "012346",
      dateTime: "Aug 8, 2025\n10:42 pm",
      amount: "₦80,000.00",
      gameType: "Casino",
      gameName: "Eagle",
      provider: "ICRASH",
      roundId: null,
      balanceBefore: "₦79,903.31",
      balanceAfter: "₦75,903.31",
      odds: "0.50",
      potentialWin: "₦80,000.00",
      payOut: "₦80,000.00",
      status: "Active",
    },
  ];

  const formatMoney = (val: string | number | null | undefined) => {
    if (val == null || val === "") return "₦0.00";
    if (typeof val === "string") {
      const trimmed = val.trim();
      if (trimmed.startsWith("₦") || trimmed.startsWith("$")) {
        return trimmed;
      }
      const num = parseFloat(trimmed.replace(/[^0-9.-]+/g, ""));
      if (isNaN(num)) return trimmed;
      return `₦${num.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (typeof val === "number") {
      return `₦${val.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return String(val);
  };

  const formatTicketDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    if (dateStr.includes(",")) {
      const parts = dateStr.split(",");
      if (parts.length >= 3) {
        return `${parts[0]}, ${parts[1]}\n${parts.slice(2).join(",").trim()}`;
      } else if (parts.length === 2) {
        return `${parts[0]}\n${parts[1].trim()}`;
      }
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const datePart = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      const timePart = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase();
      return `${datePart}\n${timePart}`;
    }
    return dateStr;
  };

  const rawTicketList = ticketsData?.tickets;
  const hasLoadedTickets = Array.isArray(rawTicketList);

  const ticketsToDisplay = hasLoadedTickets
    ? rawTicketList.map((t: TicketRecord) => {
        const amount = formatMoney(t.betAmount);
        const potWin = t.potentialWin != null ? formatMoney(t.potentialWin) : (t.outcome === "Won" ? amount : "₦0.00");
        const payOut = (t.payout != null || t.payOut != null) ? formatMoney(t.payout || t.payOut) : (t.outcome === "Won" ? amount : "₦0.00");
        const status = t.outcome === "Won" ? "Won" : (t.outcome === "Active" || (t.outcome as any) === "Pending") ? "Active" : "Lost";

        const gameType = t.gameType || "Casino";
        const gameName = t.gameName || "—";
        const provider = t.provider || "—";
        const roundId = t.roundId || null;
        const balanceBefore = t.balanceBefore ? formatMoney(t.balanceBefore) : "—";
        const balanceAfter = t.balanceAfter ? formatMoney(t.balanceAfter) : "—";
        const oddsVal = (t as any).odd || (t as any).odds || (t as any).oddValue || "1.00";

        return {
          id: t.id,
          dateTime: formatTicketDate(t.createdAt),
          amount,
          gameType,
          gameName,
          provider,
          roundId,
          balanceBefore,
          balanceAfter,
          odds: String(oddsVal),
          potentialWin: potWin,
          payOut,
          status,
        };
      })
    : sampleTickets;

  const totalPages = ticketsData?.pagination?.totalPages || (hasLoadedTickets ? 1 : 10);
  const currentPage = ticketsData?.pagination?.page || page;


  const exportToExcel = () => {
    const dataToExport = ticketsToDisplay.map((t) => ({
      "Bet ID": t.id,
      "Date & Time": t.dateTime.replace("\n", " "),
      "Amount": t.amount,
      "Game Type": t.gameType,
      "Game Name": t.gameName,
      "Provider": t.provider,
      "Round ID": t.roundId || "-",
      "Odds": t.odds,
      "Potential Win": t.potentialWin,
      "Pay Out": t.payOut,
      "Balance Before": t.balanceBefore,
      "Balance After": t.balanceAfter,
      "Status": t.status,
    }));

    if (!dataToExport || dataToExport.length === 0) {
      toast.error("No ticket history to export");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bet History");
    XLSX.writeFile(workbook, `Bet_History_${userId}_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const exportToPdf = () => {
    if (!ticketsToDisplay || ticketsToDisplay.length === 0) {
      toast.error("No ticket history to export");
      return;
    }
    const doc = new jsPDF("landscape");
    doc.text("Bet History Summary", 14, 15);
    autoTable(doc, {
      head: [["Bet ID", "Date & Time", "Amount", "Game Type", "Game Name", "Provider", "Round ID", "Potential Win", "Pay Out", "Status"]],
      body: ticketsToDisplay.map((t) => [
        t.id,
        t.dateTime.replace("\n", " "),
        t.amount,
        t.gameType,
        t.gameName,
        t.provider,
        t.roundId || "-",
        t.potentialWin,
        t.payOut,
        t.status,
      ]),
      startY: 20,
    });
    doc.save(`Bet_History_${userId}_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const exportToDocx = async () => {
    if (!ticketsToDisplay || ticketsToDisplay.length === 0) {
      toast.error("No ticket history to export");
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
                  text: "Bet History Summary",
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
                  children: ["Bet ID", "Date & Time", "Amount", "Game Type", "Game Name", "Provider", "Round ID", "Potential Win", "Pay Out", "Status"].map(
                    (header) =>
                      new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: header, bold: true })] })],
                        shading: { fill: "f3f4f6" },
                      })
                  ),
                }),
                ...ticketsToDisplay.map(
                  (t) =>
                    new TableRow({
                      children: [
                        t.id,
                        t.dateTime.replace("\n", " "),
                        t.amount,
                        t.gameType,
                        t.gameName,
                        t.provider,
                        t.roundId || "-",
                        t.potentialWin,
                        t.payOut,
                        t.status,
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
    a.download = `Bet_History_${userId}_${new Date().toISOString().split("T")[0]}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Ticket Overview */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h4 className="font-bold text-xl text-gray-900">Ticket Overview</h4>
          <div className="flex items-center gap-2">
            <TimePeriodFilter
              onFilterChange={(period, range) => {
                setTimePeriod(period);
                setCustomRange(range);
              }}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-gray-500 text-sm mb-1">Current Bets placed</p>
            {isOverviewLoading ? (
              <Skeleton className="h-7 w-28 mt-1" />
            ) : (
              (() => {
                const valStr = formatMoney(
                  ticketOverview?.currentBet ??
                    ticketOverview?.currentActiveBetAmount ??
                    ticketOverview?.activeBetAmount ??
                    ticketOverview?.currentActiveBet
                );
                return (
                  <p style={calcDynamicCardFontSize(valStr)} className="font-bold text-gray-900 tracking-tight">
                    {valStr}
                  </p>
                );
              })()
            )}
          </div>
          <div>
            <p className="text-gray-500 text-sm mb-1">Total Games won</p>
            {isOverviewLoading ? (
              <Skeleton className="h-7 w-28 mt-1" />
            ) : (
              (() => {
                const valStr = formatMoney(
                  ticketOverview?.totalGamesWon ??
                    ticketOverview?.gamesWon
                );
                return (
                  <p style={calcDynamicCardFontSize(valStr)} className="font-bold text-gray-900 tracking-tight">
                    {valStr}
                  </p>
                );
              })()
            )}
          </div>
          <div>
            <p className="text-gray-500 text-sm mb-1">Total Games Lost</p>
            {isOverviewLoading ? (
              <Skeleton className="h-7 w-28 mt-1" />
            ) : (
              (() => {
                const valStr = formatMoney(
                  ticketOverview?.totalGamesLost ??
                    ticketOverview?.gamesLost
                );
                return (
                  <p style={calcDynamicCardFontSize(valStr)} className="font-bold text-gray-900 tracking-tight">
                    {valStr}
                  </p>
                );
              })()
            )}
          </div>
          <div>
            <p className="text-gray-500 text-sm mb-1">Net Position (GGR)</p>
            {isOverviewLoading ? (
              <Skeleton className="h-7 w-28 mt-1" />
            ) : (
              (() => {
                const valStr = formatMoney(
                  ticketOverview?.grossGamingRevenue ??
                    ticketOverview?.ggr ??
                    ticketOverview?.netPosition
                );
                return (
                  <p style={calcDynamicCardFontSize(valStr)} className="font-bold text-gray-900 tracking-tight">
                    {valStr}
                  </p>
                );
              })()
            )}
          </div>
        </div>
      </div>

      {/* Tickets (bet) Summary */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h4 className="font-bold text-xl text-gray-900">Tickets (bet) Summary</h4>
          
          {ticketsToDisplay.length > 0 && (
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
        
        <div className="overflow-x-auto overflow-y-auto max-h-[380px] custom-scrollbar">
          <table className="min-w-full text-sm whitespace-nowrap">
            <thead className="sticky top-0 z-10 bg-white shadow-[0_1px_0_#f3f4f6]">
              <tr className="border-b border-gray-100 text-gray-500 text-xs font-semibold text-left">
                <th className="pb-4 pt-2 pr-4 bg-white">Bet ID</th>
                <th className="pb-4 pt-2 pr-4 bg-white">Date &amp; Time</th>
                <th className="pb-4 pt-2 pr-4 bg-white">Amount</th>
                <th className="pb-4 pt-2 pr-4 bg-white">Game type</th>
                <th className="pb-4 pt-2 pr-4 bg-white">Game Name</th>
                <th className="pb-4 pt-2 pr-4 bg-white">Provider</th>
                <th className="pb-4 pt-2 pr-4 bg-white">Round ID</th>
                <th className="pb-4 pt-2 pr-4 bg-white">Odds</th>
                <th className="pb-4 pt-2 pr-4 bg-white">Potential win</th>
                <th className="pb-4 pt-2 pr-4 bg-white">Pay out</th>
                <th className="pb-4 pt-2 pr-4 bg-white">Balance Before</th>
                <th className="pb-4 pt-2 pr-4 bg-white">Balance After</th>
                <th className="pb-4 pt-2 pr-4 bg-white">Status</th>
                <th className="pb-4 pt-2 bg-white text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isTicketsLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-4 pr-4"><Skeleton className="h-4 w-16" /></td>
                    <td className="py-4 pr-4">
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-3 w-16" />
                    </td>
                    <td className="py-4 pr-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="py-4 pr-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="py-4 pr-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="py-4 pr-4"><Skeleton className="h-4 w-16" /></td>
                    <td className="py-4 pr-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="py-4 pr-4"><Skeleton className="h-4 w-12" /></td>
                    <td className="py-4 pr-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="py-4 pr-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="py-4 pr-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="py-4 pr-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="py-4 pr-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
                    <td className="py-4 text-right"><Skeleton className="h-4 w-4 ml-auto" /></td>
                  </tr>
                ))
              ) : ticketsToDisplay.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-8 text-center text-gray-400 text-sm">
                    No ticket history found for this user
                  </td>
                </tr>
              ) : (
                ticketsToDisplay.map((ticket, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-1.5 font-mono text-xs">
                        <span className="font-medium text-gray-900 truncate max-w-[90px]" title={ticket.id}>
                          {ticket.id.length > 10 ? `${ticket.id.substring(0, 10)}...` : ticket.id}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(ticket.id);
                            toast.success("Bet ID copied to clipboard");
                          }}
                          className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                          title="Copy Bet ID"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="py-4 pr-4 text-xs">
                      {ticket.dateTime.includes("\n") ? (
                        <>
                          <div className="font-semibold text-gray-900">{ticket.dateTime.split("\n")[0]}</div>
                          <div className="text-gray-400 text-[11px]">{ticket.dateTime.split("\n")[1]}</div>
                        </>
                      ) : (
                        <div className="font-semibold text-gray-900">{ticket.dateTime}</div>
                      )}
                    </td>
                    <td className="py-4 pr-4 font-bold text-gray-900 text-xs">{ticket.amount}</td>
                    <td className="py-4 pr-4 text-gray-700 text-xs">{ticket.gameType}</td>
                    <td className="py-4 pr-4 text-gray-700 text-xs">{ticket.gameName}</td>
                    <td className="py-4 pr-4 font-mono text-gray-700 text-xs">{ticket.provider}</td>
                    <td className="py-4 pr-4 font-mono text-xs">
                      {ticket.roundId ? (
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500 truncate max-w-[80px]" title={ticket.roundId}>
                            {ticket.roundId.length > 8 ? `${ticket.roundId.substring(0, 8)}...` : ticket.roundId}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(ticket.roundId!);
                              toast.success("Round ID copied to clipboard");
                            }}
                            className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                            title="Copy Round ID"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-4 pr-4 font-mono text-gray-700 text-xs">{ticket.odds}</td>
                    <td className="py-4 pr-4 font-semibold text-gray-900 text-xs">{ticket.potentialWin}</td>
                    <td className="py-4 pr-4 font-semibold text-gray-900 text-xs">{ticket.payOut}</td>
                    <td className="py-4 pr-4 text-gray-500 text-xs">{ticket.balanceBefore}</td>
                    <td className="py-4 pr-4 text-gray-500 text-xs">{ticket.balanceAfter}</td>
                    <td className="py-4 pr-4">
                      {ticket.status === "Won" && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#E8F8E5] text-[#10C300] border border-[#10C300]/20">
                          Won
                        </span>
                      )}
                      {(ticket.status === "Active" || ticket.status === "Pending") && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#FFF8E5] text-[#FFB000] border border-[#FFB000]/20">
                          {ticket.status}
                        </span>
                      )}
                      {ticket.status === "Lost" && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#FEECEB] text-[#EE201C] border border-[#EE201C]/20">
                          Lost
                        </span>
                      )}
                    </td>
                    <td className="py-4 text-right">
                      <button 
                        type="button" 
                        onClick={(e) => {
                          e.stopPropagation();
                          e.nativeEvent.stopImmediatePropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          setActionDropdown({
                            ticket: {
                              id: ticket.id,
                              playerName: "User",
                              betAmount: ticket.amount,
                              potentialWin: ticket.potentialWin,
                              payout: ticket.payOut,
                              gameType: ticket.gameType,
                              gameName: ticket.gameName,
                              provider: ticket.provider,
                              roundId: ticket.roundId,
                              outcome: ticket.status as any,
                              createdAt: ticket.dateTime,
                              balanceBefore: ticket.balanceBefore,
                              balanceAfter: ticket.balanceAfter,
                            },
                            top: rect.bottom + window.scrollY,
                            right: window.innerWidth - rect.right,
                          });
                        }}
                        className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 pt-5 mt-4 text-xs font-medium text-gray-700">
          <span>Page {currentPage} of {totalPages}</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-lg bg-[#10C300] text-white hover:bg-[#0ea800] disabled:opacity-40 disabled:cursor-not-allowed font-semibold cursor-pointer transition-colors"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-lg bg-[#10C300] text-white hover:bg-[#0ea800] disabled:opacity-40 disabled:cursor-not-allowed font-semibold cursor-pointer transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {actionDropdown && (
        <ActionDropdown
          top={actionDropdown.top}
          right={actionDropdown.right}
          onClose={() => setActionDropdown(null)}
          items={[
            {
              icon: <Copy className="w-4 h-4" />,
              label: "Copy ticket ID",
              onClick: () => {
                navigator.clipboard.writeText(actionDropdown.ticket.id);
                toast.success("Ticket ID copied to clipboard");
                setActionDropdown(null);
              },
            },
            {
              icon: <Eye className="w-4 h-4" />,
              label: "View ticket details",
              onClick: () => {
                setSelectedTicketDetails(actionDropdown.ticket);
                setActionDropdown(null);
              },
            },
          ]}
        />
      )}

      {selectedTicketDetails && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <TicketDetailsView
            ticket={selectedTicketDetails}
            onBack={() => setSelectedTicketDetails(null)}
            onViewPlayerProfile={() => setSelectedTicketDetails(null)}
          />
        </div>
      )}
    </div>
  );
}
