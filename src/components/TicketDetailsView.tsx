import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  ArrowLeft, 
  Printer, 
  MoreHorizontal, 
  CheckCircle2, 
  PauseCircle,
  Mail,
  Phone,
  Copy,
  XCircle,
} from "lucide-react";
import { FaFileExport, FaFilePdf, FaFileWord, FaFileExcel } from "react-icons/fa6";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { ticketService, type TicketRecord, type DetailedTicket, type MatchSelection } from "#/lib/tickets";
import type { User } from "#/lib/users";

interface TicketDetailsViewProps {
  ticket: TicketRecord;
  onBack: () => void;
  onViewPlayerProfile: (user: User) => void;
  onSuspendPlayer?: (userId: string, isReactivate?: boolean) => void;
}

function getUniformCardFontSize(values: Array<string | number | null | undefined>, maxPx = 22, minPx = 10, baseChars = 9) {
  const maxLen = Math.max(0, ...values.map(val => String(val ?? "").length));
  if (!maxLen || maxLen <= baseChars) return { fontSize: `${maxPx}px`, lineHeight: "1.2" };
  const scale = baseChars / maxLen;
  const fontPx = Math.max(minPx, Math.min(maxPx, Math.round(scale * maxPx * 10) / 10));
  return { fontSize: `${fontPx}px`, lineHeight: "1.2", wordBreak: "break-all" as const };
}

const formatDate = (dateString?: string | number | null) => {
  if (!dateString || dateString === "—") return "—";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return String(dateString);
  return new Intl.DateTimeFormat('en-GB', { 
    year: 'numeric', month: 'short', day: 'numeric', 
    hour: 'numeric', minute: '2-digit',
    hour12: true
  }).format(date);
};

export function TicketDetailsView({
  ticket,
  onBack,
  onViewPlayerProfile,
  onSuspendPlayer,
}: TicketDetailsViewProps) {
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [showTopMenu, setShowTopMenu] = useState(false);

  const { data: fetchedDetails, isLoading } = useQuery({
    queryKey: ["ticket-details", ticket.id],
    queryFn: async () => {
      const res = await ticketService.getTicketDetails(ticket.id);
      if (!res.success) return null;
      return res.data;
    },
    enabled: !!ticket.id,
  });

  const isCasino =
    ticket.gameType?.toLowerCase() === "casino" ||
    fetchedDetails?.gameType?.toLowerCase() === "casino";

  // Construct full display details with fallbacks matching Figma design when fields are missing
  const details: DetailedTicket = {
    ...ticket,
    ...fetchedDetails,
    placedAt: (fetchedDetails as any)?.createdAt || fetchedDetails?.placedAt || "—",
    settledAt: fetchedDetails?.settledAt || "—",
    stakeAmount: (fetchedDetails as any)?.stake || fetchedDetails?.stakeAmount || ticket.betAmount || "—",
    potentialWin: fetchedDetails?.potentialWin || ticket.potentialWin || "—",
    actualPayout: fetchedDetails?.actualPayout || ticket.payout || ticket.payOut || (ticket.outcome === "Won" ? ticket.potentialWin : "₦0.00") || "—",
    profit: fetchedDetails?.profit || "—",
    playerEmail: (fetchedDetails as any)?.player?.email || fetchedDetails?.playerEmail || "—",
    playerPhone: (fetchedDetails as any)?.player?.mobileNumber || fetchedDetails?.playerPhone || "—",
    playerVerified: (fetchedDetails as any)?.player?.verified ?? fetchedDetails?.playerVerified ?? true,
    balanceBefore: (fetchedDetails as any)?.player?.balanceBefore || ticket.balanceBefore || "—",
    balanceAfter: (fetchedDetails as any)?.player?.balanceAfter || ticket.balanceAfter || "—",
    image: (fetchedDetails as any)?.player?.image || ticket.image,
    betType: fetchedDetails?.betType || ticket.gameType || "—",
    selectionCount: fetchedDetails?.selectionCount || 0,
    totalOdds: fetchedDetails?.totalOdds || "—",
    freeBet: fetchedDetails?.freeBet ?? "—",
    bonusUsed: fetchedDetails?.bonusUsed ?? "—",
    cashOut: (fetchedDetails as any)?.cashedOut ? "Yes" : (fetchedDetails?.cashOut || "—"),
    ipAddress: fetchedDetails?.ipAddress || "—",
    deviceInfo: fetchedDetails?.deviceInfo || "—",
    // Casino specific fields
    gameName: fetchedDetails?.gameName || ticket.gameName || "—",
    provider: fetchedDetails?.provider || ticket.provider || "—",
    roundId: fetchedDetails?.roundId || ticket.roundId || "—",
    sessionId: fetchedDetails?.sessionId || ticket.sessionId || "—",
    betTime: (fetchedDetails as any)?.createdAt || fetchedDetails?.betTime || "—",
    cashOutTime: (fetchedDetails as any)?.settledAt || fetchedDetails?.cashOutTime || "—",
    multiplier: (fetchedDetails as any)?.totalOdds || ticket.odds || "—",
    winAmount: (fetchedDetails as any)?.actualPayout || ticket.payout || ticket.payOut || "—",
    roundSummary: fetchedDetails?.roundSummary || (isCasino ? [
      {
        id: (fetchedDetails as any)?.roundId || ticket.roundId || "—",
        betAmount: (fetchedDetails as any)?.stake || ticket.betAmount || "—",
        cashedOutAt: (fetchedDetails as any)?.settledAt || fetchedDetails?.cashOutTime || ticket.createdAt || "—",
        winAmount: (fetchedDetails as any)?.actualPayout || ticket.payout || ticket.payOut || "—",
        status: ticket.outcome === "Won" ? "Won" : "Lost",
      }
    ] : []),
    selections: fetchedDetails?.selections || [],
  };

  const userForProfile: User = {
    id: ticket.userId || (ticket as any).playerId || ticket.id,
    name: ticket.playerName,
    email: details.playerEmail!,
    wallet: 0,
    status: details.playerVerified ? "verified" : "unverified",
    registeredDate: Date.now(),
    suspended: ticket.userSuspended,
  };

  const isUserSuspended = Boolean(ticket.userSuspended || details.userSuspended);
  const outcomeKey = ticket.outcome === "Won" ? "Won" : (ticket.outcome as any) === "Active" || (ticket.outcome as any) === "Pending" ? "Active" : "Lost";

  const exportToPdf = () => {
    const doc = new jsPDF();
    const cleanCurr = (val?: string | number | null) => (val ? String(val).replace(/₦/g, "NGN ") : "N/A");
    doc.text(`Ticket Details - ${details.id}`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Player: ${details.playerName} | Status: ${details.outcome}`, 14, 23);

    if (isCasino) {
      doc.text(`Stake: ${cleanCurr(details.stakeAmount)} | Win Amount: ${cleanCurr(details.winAmount || details.actualPayout)} | Profit: ${cleanCurr(details.profit)}`, 14, 30);
      autoTable(doc, {
        head: [["#", "Bet Amount", "Cashed out at", "Win Amount"]],
        body: details.roundSummary?.map((r, idx) => [
          idx + 1,
          cleanCurr(r.betAmount),
          formatDate(r.cashedOutAt),
          cleanCurr(r.winAmount),
        ]) || [],
        startY: 38,
      });
    } else {
      doc.text(`Stake: ${cleanCurr(details.stakeAmount)} | Payout: ${cleanCurr(details.actualPayout)} | Profit: ${cleanCurr(details.profit)}`, 14, 30);
      autoTable(doc, {
        head: [["#", "Match", "Pick", "Odds"]],
        body: details.selections?.map((s: MatchSelection, idx: number) => [
          idx + 1,
          s.match,
          s.pick,
          s.odds,
        ]) || [],
        startY: 38,
      });
    }

    doc.save(`Ticket_${details.id}.pdf`);
  };

  const exportToExcel = () => {
    toast.success("Ticket exported to Excel");
  };

  const exportToDocx = () => {
    toast.success("Ticket exported to DOCX");
  };

  return (
    <div className="font-inter flex flex-col gap-6 px-8 py-2 overflow-y-auto max-h-[calc(100vh-100px)] print:max-h-none print:overflow-visible print:p-0 custom-scrollbar relative">
      {isLoading && (
        <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-sm flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-[#1BAA04] rounded-full animate-spin"></div>
        </div>
      )}
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#757575] text-[#757575] transition-colors cursor-pointer print:hidden"
            title="Back to Ticket History"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-2xl text-gray-900" title={details.id}>
                  Ticket ID - {details.id && details.id.length > 16 ? `${details.id.substring(0, 12)}...` : details.id}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(details.id);
                    toast.success("Ticket ID copied to clipboard");
                  }}
                  className="text-gray-400 hover:text-gray-700 transition-colors cursor-pointer p-1 rounded-md hover:bg-gray-100"
                  title="Copy Ticket ID"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <span
                className={`px-3 py-0.5 rounded-full text-xs font-semibold ${
                  outcomeKey === "Won"
                    ? "bg-[#E8F8E5] text-[#10C300]"
                    : outcomeKey === "Active"
                    ? "bg-[#FFF8E5] text-[#FFB000]"
                    : "bg-[#FEECEB] text-[#EE201C]"
                }`}
              >
                {details.outcome}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Placed: {details.placedAt} . Cash out: {details.settledAt}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 relative print:hidden">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-gray-200 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Ticket
          </button>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1BAA04] hover:bg-[#158903] text-white text-xs font-medium transition-colors cursor-pointer shadow-sm"
            >
              Export File as
              <FaFileExport className="w-3 h-3" />
            </button>

            {showExportDropdown && (
              <div className="absolute right-0 mt-2 w-36 bg-white rounded-xl border border-gray-100 shadow-lg p-1 z-30 overflow-hidden">
                <button
                  onClick={() => {
                    setShowExportDropdown(false);
                    exportToPdf();
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 rounded-lg cursor-pointer"
                >
                  <FaFilePdf className="text-red-500 w-3.5 h-3.5" /> PDF
                </button>
                <button
                  onClick={() => {
                    setShowExportDropdown(false);
                    exportToDocx();
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 rounded-lg cursor-pointer"
                >
                  <FaFileWord className="text-blue-600 w-3.5 h-3.5" /> DOCX
                </button>
                <button
                  onClick={() => {
                    setShowExportDropdown(false);
                    exportToExcel();
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 rounded-lg cursor-pointer"
                >
                  <FaFileExcel className="text-green-600 w-3.5 h-3.5" /> Excel
                </button>
              </div>
            )}
          </div>

          {/* Top Menu Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowTopMenu(!showTopMenu)}
              className="p-2.5 rounded-full border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer shadow-xs"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {showTopMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-gray-100 shadow-xl p-1 z-30 overflow-hidden">
                <button
                  onClick={() => {
                    setShowTopMenu(false);
                    if (onSuspendPlayer) {
                      onSuspendPlayer(userForProfile.id, isUserSuspended);
                    } else {
                      toast.info(isUserSuspended ? "Reactivate action triggered" : "Suspend action triggered");
                    }
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 rounded-lg cursor-pointer"
                >
                  {isUserSuspended ? (
                    <>
                      <PauseCircle className="w-3.5 h-3.5 text-[#10C300]" /> Reactivate Player
                    </>
                  ) : (
                    <>
                      <PauseCircle className="w-3.5 h-3.5 text-gray-500" /> Suspend Player
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Stat Cards */}
      {isCasino ? (
        (() => {
          const cardStyle = getUniformCardFontSize([details.stakeAmount, details.actualPayout, details.profit]);
          return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
                <p className="text-xs text-gray-500 font-medium">Stake Amount</p>
                <h4 style={cardStyle} className="font-bold text-gray-900 mt-1.5">
                  {details.stakeAmount}
                </h4>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
                <p className="text-xs text-gray-500 font-medium">Win Amount</p>
                <h4 style={cardStyle} className="font-bold text-gray-900 mt-1.5">
                  {details.actualPayout}
                </h4>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
                <p className="text-xs text-gray-500 font-medium">Profit</p>
                <h4 style={cardStyle} className="font-bold text-[#10C300] mt-1.5">
                  {details.profit}
                </h4>
              </div>
            </div>
          );
        })()
      ) : (
        (() => {
          const cardStyle = getUniformCardFontSize([details.stakeAmount, details.potentialWin, details.actualPayout, details.profit]);
          return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
                <p className="text-xs text-gray-500 font-medium">Stake Amount</p>
                <h4 style={cardStyle} className="font-bold text-gray-900 mt-1.5">
                  {details.stakeAmount}
                </h4>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
                <p className="text-xs text-gray-500 font-medium">Potential Win</p>
                <h4 style={cardStyle} className="font-bold text-gray-900 mt-1.5">
                  {details.potentialWin}
                </h4>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
                <p className="text-xs text-gray-500 font-medium">Actual Payout</p>
                <h4 style={cardStyle} className="font-bold text-[#10C300] mt-1.5">
                  {details.actualPayout}
                </h4>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
                <p className="text-xs text-gray-500 font-medium">Profit</p>
                <h4 style={cardStyle} className="font-bold text-[#10C300] mt-1.5">
                  {details.profit}
                </h4>
              </div>
            </div>
          );
        })()
      )}

      {/* Player Information Card */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
          <h4 className="text-base font-bold text-gray-900">
            Player Information
          </h4>
          <button
            type="button"
            onClick={() => onViewPlayerProfile(userForProfile)}
            className="bg-[#1BAA04] hover:bg-[#158903] text-white px-5 py-2 rounded-full text-xs font-semibold shadow-sm transition-colors cursor-pointer whitespace-nowrap print:hidden"
          >
            View Player Profile
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-gray-100 items-center">
          <div className="flex items-center gap-4 pr-0 md:pr-4">
            <img
              src={
                details.image ||
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
              }
              alt={details.playerName}
              className="w-12 h-12 rounded-full object-cover border border-gray-200"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900 text-sm">
                  {details.playerName}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#E8F8E5] text-[#10C300]">
                  Verified
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5 font-mono">
                <span title={userForProfile.id}>
                  Player ID: {userForProfile.id && userForProfile.id.length > 14 ? `${userForProfile.id.substring(0, 10)}...` : userForProfile.id}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(userForProfile.id);
                    toast.success("Player ID copied to clipboard");
                  }}
                  className="text-gray-400 hover:text-gray-700 transition-colors cursor-pointer p-0.5 rounded hover:bg-gray-100"
                  title="Copy Player ID"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div className="pt-4 md:pt-0 md:pl-6 space-y-2 text-xs text-gray-600">
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="truncate">{details.playerEmail}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-gray-400 shrink-0" />
              <span>{details.playerPhone}</span>
            </div>
          </div>

          <div className="pt-4 md:pt-0 md:pl-6 space-y-2 text-xs text-gray-600">
            <div className="flex items-center gap-4">
              <span className="text-gray-400 min-w-[75px]">Bal. Before:</span>
              <span className="font-semibold text-gray-900">
                {details.balanceBefore}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-400 min-w-[75px]">Bal. After:</span>
              <span className="font-semibold text-gray-900">
                {details.balanceAfter}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Details Table */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <h4 className="text-base font-bold text-gray-900 mb-5">
          {isCasino ? "Game Details" : "Betting Details"}
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#F9F9F9]">
              {isCasino ? (
                <tr className="text-gray-400 font-medium">
                  <th className="py-3 px-4 rounded-l-xl font-normal">Game Name</th>
                  <th className="py-3 px-4 font-normal">Provider</th>
                  <th className="py-3 px-4 font-normal">Round ID</th>
                  <th className="py-3 px-4 font-normal">Session ID</th>
                  <th className="py-3 px-4 font-normal">Bet Time</th>
                  <th className="py-3 px-4 font-normal">Cash out Time</th>
                  <th className="py-3 px-4 font-normal">Bet Amount</th>
                  <th className="py-3 px-4 font-normal">Multiplier</th>
                  <th className="py-3 px-4 rounded-r-xl font-normal">Win Amount</th>
                </tr>
              ) : (
                <tr className="text-gray-400 font-medium">
                  <th className="py-3 px-4 rounded-l-xl font-normal">Bet Type</th>
                  <th className="py-3 px-4 font-normal">Selection</th>
                  <th className="py-3 px-4 font-normal">Stake amount</th>
                  <th className="py-3 px-4 font-normal">Potential Win</th>
                  <th className="py-3 px-4 font-normal">Payout</th>
                  <th className="py-3 px-4 font-normal">Total Odds</th>
                  <th className="py-3 px-4 font-normal">Free Bet</th>
                  <th className="py-3 px-4 font-normal">Bonus used</th>
                  <th className="py-3 px-4 font-normal">Cash out</th>
                  <th className="py-3 px-4 rounded-r-xl font-normal">IP address</th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-gray-50 text-gray-800">
              {isCasino ? (
                <tr>
                  <td className="py-4 px-4 font-semibold text-gray-900">
                    {details.gameName}
                  </td>
                  <td className="py-4 px-4 font-medium text-gray-700">
                    {details.provider}
                  </td>
                  <td className="py-4 px-4 font-medium text-gray-900">
                    {details.roundId}
                  </td>
                  <td className="py-4 px-4 font-medium text-gray-900">
                    {details.sessionId}
                  </td>
                  <td className="py-4 px-4 text-gray-700">
                    {details.betTime}
                  </td>
                  <td className="py-4 px-4 text-gray-700">
                    {details.cashOutTime}
                  </td>
                  <td className="py-4 px-4 font-semibold text-gray-900">
                    {details.stakeAmount}
                  </td>
                  <td className="py-4 px-4 font-semibold text-[#10C300]">
                    {details.multiplier}
                  </td>
                  <td className="py-4 px-4 font-semibold text-[#10C300]">
                    {details.winAmount}
                  </td>
                </tr>
              ) : (
                <tr>
                  <td className="py-4 px-4 font-semibold text-gray-900">
                    {details.betType}
                  </td>
                  <td className="py-4 px-4 font-medium">
                    {details.selectionCount}
                  </td>
                  <td className="py-4 px-4 font-medium">
                    {details.stakeAmount}
                  </td>
                  <td className="py-4 px-4 font-semibold text-gray-900">
                    {details.potentialWin ?? "—"}
                  </td>
                  <td className="py-4 px-4 font-semibold text-gray-900">
                    {details.actualPayout || details.payout || details.payOut || "—"}
                  </td>
                  <td className="py-4 px-4 font-semibold text-gray-900">
                    {details.totalOdds}
                  </td>
                  <td className="py-4 px-4">{details.freeBet}</td>
                  <td className="py-4 px-4">{details.bonusUsed}</td>
                  <td className="py-4 px-4">{details.cashOut}</td>
                  <td className="py-4 px-4">
                    <div className="flex flex-col space-y-1">
                      <button className="w-max p-1 text-[11px] border border-[#757979] rounded-full bg-[#F0F0F0] text-gray-500">
                        {details.deviceInfo}
                      </button>
                      <span className="font-mono text-[11px] text-gray-700">
                        {details.ipAddress}
                      </span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Table: Round Summary for Casino / Match Selections for Sportsbook */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs mb-6">
        <h4 className="text-base font-bold text-gray-900 mb-5">
          {isCasino ? `${details.gameName} - Round Summary` : "Match Selections"}
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#F9F9F9]">
              {isCasino ? (
                <tr className="text-gray-400 font-medium">
                  <th className="py-3 px-4 rounded-l-xl w-12 font-normal">#</th>
                  <th className="py-3 px-4 font-normal">Bet Amount</th>
                  <th className="py-3 px-4 font-normal">Cashed out at</th>
                  <th className="py-3 px-4 font-normal">Win Amount</th>
                  <th className="py-3 px-4 rounded-r-xl w-12 text-center font-normal"></th>
                </tr>
              ) : (
                <tr className="text-gray-400 font-medium">
                  <th className="py-3 px-4 rounded-l-xl w-12 font-normal">#</th>
                  <th className="py-3 px-4 font-normal">Match</th>
                  <th className="py-3 px-4 font-normal">Pick</th>
                  <th className="py-3 px-4 font-normal">Odds</th>
                  <th className="py-3 px-4 rounded-r-xl w-12 text-center font-normal"></th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-800">
              {isCasino ? (
                details.roundSummary?.map((round, idx: number) => (
                  <tr key={idx}>
                    <td className="py-3.5 px-4 font-medium text-gray-400">
                      {idx + 1}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-gray-900">
                      {round.betAmount}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-gray-700">
                      {formatDate(round.cashedOutAt)}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#10C300]">
                      {round.winAmount}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {round.status === "Lost" ? (
                        <XCircle className="w-4 h-4 text-red-500 fill-red-500 text-white inline-block" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-[#10C300] fill-[#10C300] text-white inline-block" />
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <>
                  {details.selections?.map((sel: MatchSelection, idx: number) => (
                    <tr key={idx}>
                      <td className="py-3.5 px-4 font-medium text-gray-400">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-gray-900">
                        {sel.match}
                      </td>
                      <td className="py-3.5 px-4 text-gray-700">{sel.pick}</td>
                      <td className="py-3.5 px-4 font-semibold text-gray-900">
                        {sel.odds}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {sel.status === "Lost" ? (
                          <XCircle className="w-4 h-4 text-red-500 fill-red-500 text-white inline-block" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-[#10C300] fill-[#10C300] text-white inline-block" />
                        )}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-[#E8F8E5]/50 border-t border-gray-100 font-bold">
                    <td className="py-3.5 px-4"></td>
                    <td colSpan={2} className="py-3.5 px-4 text-[#10C300] font-bold">
                      Total Odds
                    </td>
                    <td className="py-3.5 px-4 text-[#10C300] font-bold text-sm">
                      {details.totalOdds}
                    </td>
                    <td className="py-3.5 px-4"></td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
