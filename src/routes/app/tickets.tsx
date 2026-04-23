import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Clock } from "lucide-react";
import { DataTable, type Column } from "#/components/DataTable";
import SortIcon from "@/logo/sort.svg?react";
import FilterIcon from "@/logo/filter.svg?react";

export const Route = createFileRoute("/app/tickets")({
  component: TicketsPage,
});

type TicketOutcome = "Won" | "Active" | "Lost";
type TabKey = "all" | "active" | "won" | "lost";

interface TicketRecord {
  id: string;
  dateTime: string;
  game: string;
  gameEmoji: string;
  entryFee: string;
  possibleWin: string;
  outcome: TicketOutcome;
}

const DUMMY_TICKETS: TicketRecord[] = [
  { id: "012345", dateTime: "Aug 8, 2025\n10:42 pm", game: "Lagos Rush", gameEmoji: "🏎️", entryFee: "₦1,000", possibleWin: "₦10,000", outcome: "Won" },
  { id: "012346", dateTime: "Aug 8, 2025\n10:42 pm", game: "Eagle", gameEmoji: "🦅", entryFee: "₦1,000", possibleWin: "₦10,000", outcome: "Active" },
  { id: "012347", dateTime: "Aug 8, 2025\n10:42 pm", game: "Xcape", gameEmoji: "🚀", entryFee: "₦1,000", possibleWin: "₦10,000", outcome: "Lost" },
  { id: "012348", dateTime: "Aug 8, 2025\n10:42 pm", game: "Bayse", gameEmoji: "🎯", entryFee: "₦1,000", possibleWin: "₦10,000", outcome: "Won" },
  { id: "012349", dateTime: "Aug 8, 2025\n10:42 pm", game: "Lucky Rise", gameEmoji: "🍀", entryFee: "₦1,000", possibleWin: "₦10,000", outcome: "Active" },
  { id: "012350", dateTime: "Aug 9, 2025\n11:00 am", game: "Lagos Rush", gameEmoji: "🏎️", entryFee: "₦500", possibleWin: "₦5,000", outcome: "Won" },
  { id: "012351", dateTime: "Aug 9, 2025\n01:15 pm", game: "Eagle", gameEmoji: "🦅", entryFee: "₦2,000", possibleWin: "₦20,000", outcome: "Lost" },
  { id: "012352", dateTime: "Aug 10, 2025\n09:30 am", game: "Xcape", gameEmoji: "🚀", entryFee: "₦1,000", possibleWin: "₦10,000", outcome: "Won" },
  { id: "012353", dateTime: "Aug 10, 2025\n02:45 pm", game: "Bayse", gameEmoji: "🎯", entryFee: "₦3,000", possibleWin: "₦30,000", outcome: "Active" },
  { id: "012354", dateTime: "Aug 11, 2025\n08:00 am", game: "Lucky Rise", gameEmoji: "🍀", entryFee: "₦1,000", possibleWin: "₦10,000", outcome: "Won" },
  { id: "012355", dateTime: "Aug 11, 2025\n05:20 pm", game: "Lagos Rush", gameEmoji: "🏎️", entryFee: "₦1,000", possibleWin: "₦10,000", outcome: "Active" },
  { id: "012356", dateTime: "Aug 12, 2025\n10:10 am", game: "Eagle", gameEmoji: "🦅", entryFee: "₦1,000", possibleWin: "₦10,000", outcome: "Lost" },
];

const OUTCOME_STYLES: Record<TicketOutcome, string> = {
  Won: "bg-[#E8F8E5] text-[#10C300]",
  Active: "bg-[#FFF8E5] text-[#FFB000]",
  Lost: "bg-[#FEECEB] text-[#EE201C]",
};

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "All Tickets" },
  { key: "active", label: "Active" },
  { key: "won", label: "Won" },
  { key: "lost", label: "Lost" },
];

const ITEMS_PER_PAGE = 10;

function TicketsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filteredTickets = DUMMY_TICKETS.filter((t) => {
    if (activeTab === "active") return t.outcome === "Active";
    if (activeTab === "won") return t.outcome === "Won";
    if (activeTab === "lost") return t.outcome === "Lost";
    return true;
  }).filter((t) =>
    search
      ? t.id.includes(search) || t.game.toLowerCase().includes(search.toLowerCase())
      : true
  );

  const totalPages = Math.ceil(filteredTickets.length / ITEMS_PER_PAGE);
  const paginatedTickets = filteredTickets.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const columns: Column<TicketRecord>[] = [
    {
      header: "Ticket ID",
      accessor: "id",
      cellClassName: "font-mono text-gray-700",
    },
    {
      header: "Date & Time",
      accessor: (t) => (
        <span className="whitespace-pre-line text-gray-500 text-xs leading-relaxed">
          {t.dateTime}
        </span>
      ),
    },
    {
      header: "Game",
      accessor: (t) => (
        <div className="flex items-center gap-2">
          <span className="text-lg">{t.gameEmoji}</span>
          <span className="font-medium text-gray-800">{t.game}</span>
        </div>
      ),
    },
    {
      header: "Entry Fee",
      accessor: "entryFee",
      cellClassName: "font-medium text-gray-900",
    },
    {
      header: "Possible Win",
      accessor: "possibleWin",
      cellClassName: "font-medium text-gray-900",
    },
    {
      header: "Outcome",
      accessor: (t) => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${OUTCOME_STYLES[t.outcome]}`}
        >
          {t.outcome}
        </span>
      ),
    },
  ];

  return (
    <div className="flex h-[calc(100vh-120px)] flex-col gap-6 overflow-hidden px-8">
      {/* Sticky Header */}
      <div className="flex-none flex items-center justify-between">
        <div>
          <h2 className="font-bold text-2xl text-gray-900">Tickets</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            <span 
              className="relative font-medium cursor-pointer text-[#001A26] after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-[#001A26] after:transition-all after:duration-500 hover:after:w-full"
              onClick={() => navigate({ to: "/app" })}
            >Dashboard</span> &rsaquo; Ticket history
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex cursor-pointer items-center gap-2 rounded-full border-2 border-primary px-2 py-2 font-medium text-gray-900 text-sm hover:bg-gray-50">
            <SortIcon className="h-3 w-3" />
            Sort
          </button>
          <button className="inline-flex cursor-pointer items-center gap-2 rounded-full border-2 border-primary px-2 py-2 font-medium text-gray-900 text-sm hover:bg-gray-50">
            <FilterIcon className="h-3 w-3" />
            Filter
          </button>
        </div>
      </div>

      {/* Tabs + Search */}
      <div className="flex-none flex items-center justify-between gap-4">
        <div className="flex gap-8 border-b border-gray-200">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => { setActiveTab(tab.key); setPage(1); }}
              className={`pb-3 font-medium text-sm transition-colors cursor-pointer ${
                activeTab === tab.key
                  ? "border-b-2 border-[#1BAA04] text-[#1BAA04]"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-52 rounded-full border border-gray-200 bg-gray-50 py-2 pr-4 pl-9 text-sm focus:border-[#1BAA04] focus:outline-none focus:ring-1 focus:ring-[#1BAA04]"
            />
            <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          </div>
          <button className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 cursor-pointer">
            <Clock className="h-3.5 w-3.5" />
            Time periods
          </button>
        </div>
      </div>

      {/* Reusable DataTable */}
      <div className="flex-1 min-h-0">
        <DataTable
          data={paginatedTickets}
          columns={columns}
          maxHeight="100%"
          onActionClick={(t) => console.log("Action for ticket", t.id)}
          emptyMessage="No tickets found"
          pagination={{
            currentPage: page,
            totalPages,
            onPageChange: setPage,
            totalItems: filteredTickets.length,
            itemsPerPage: ITEMS_PER_PAGE,
          }}
        />
      </div>
    </div>
  );
}
