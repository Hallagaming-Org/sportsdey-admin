import { ChevronDown, X } from "lucide-react";
import { DataTable, type Column } from "./DataTable";
import { useState, useEffect, useRef } from "react";
import { userService } from "@/lib/users";

interface User {
	id: string;
	name: string;
	email: string;
	date: string;
	balance: string;
	status: "Verified" | "Pending" | "Not verified";
}

const formatDate = (timestamp: number | Date): string => {
	const d = new Date(timestamp);
	const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
	return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};

const formatBalance = (balance: number): string => {
	return `₦${balance.toLocaleString("en-NG")}`;
};

const mapStatus = (status: string): "Verified" | "Pending" | "Not verified" => {
	switch (status) {
		case "verified":
			return "Verified";
		case "pending_verification":
			return "Pending";
		case "rejected":
			return "Not verified";
		default:
			return "Not verified";
	}
};

type StatusFilter = "all" | "verified" | "pending_verification" | "not_verified" | "rejected";

const STATUS_OPTIONS: { label: string; value: StatusFilter }[] = [
	{ label: "All statuses", value: "all" },
	{ label: "Verified", value: "verified" },
	{ label: "Pending", value: "pending_verification" },
	{ label: "Not Verified", value: "not_verified" },
	{ label: "Rejected", value: "rejected" },
];

const TIME_OPTIONS: { label: string; value: string }[] = [
	{ label: "All time", value: "all" },
	{ label: "Today", value: "today" },
	{ label: "Last 7 days", value: "7days" },
	{ label: "Last 30 days", value: "30days" },
];

export function UserAnalyticsTable() {
	const [currentPage, setCurrentPage] = useState(1);
	const [allUsers, setAllUsers] = useState<User[]>([]);
	const [loading, setLoading] = useState(true);
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
	const [timeFilter, setTimeFilter] = useState("all");
	const [showStatusDropdown, setShowStatusDropdown] = useState(false);
	const [showTimeDropdown, setShowTimeDropdown] = useState(false);
	const statusRef = useRef<HTMLDivElement>(null);
	const timeRef = useRef<HTMLDivElement>(null);
	const itemsPerPage = 10;

	useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (statusRef.current && !statusRef.current.contains(e.target as Node)) setShowStatusDropdown(false);
			if (timeRef.current && !timeRef.current.contains(e.target as Node)) setShowTimeDropdown(false);
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	useEffect(() => {
		async function fetchUsers() {
			setLoading(true);
			setCurrentPage(1);

			let fromDate: string | undefined;
			let toDate: string | undefined;
			const now = new Date();

			if (timeFilter === "today") {
				fromDate = now.toISOString().slice(0, 10);
				toDate = now.toISOString().slice(0, 10);
			} else if (timeFilter === "7days") {
				const d = new Date(now);
				d.setDate(d.getDate() - 7);
				fromDate = d.toISOString().slice(0, 10);
				toDate = now.toISOString().slice(0, 10);
			} else if (timeFilter === "30days") {
				const d = new Date(now);
				d.setDate(d.getDate() - 30);
				fromDate = d.toISOString().slice(0, 10);
				toDate = now.toISOString().slice(0, 10);
			}

			const response = await userService.listUsers({
				page: 1,
				limit: 100,
				sort: "desc",
				tab: statusFilter !== "all" ? undefined : undefined,
				status: statusFilter !== "all" ? statusFilter : undefined,
				fromDate,
				toDate,
			});
			if (response.success && response.data) {
				setAllUsers(
					response.data.users.map((u) => ({
						id: u.id,
						name: u.name,
						email: u.email,
						date: formatDate(u.registeredDate),
						balance: formatBalance(u.wallet),
						status: mapStatus(u.status),
					})),
				);
			}
			setLoading(false);
		}
		fetchUsers();
	}, [statusFilter, timeFilter]);

	const totalPages = Math.ceil(allUsers.length / itemsPerPage);
	
	const displayedUsers = allUsers.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage,
	);

	const columns: Column<User>[] = [
		{ header: "User ID", accessor: "id" },
		{
			header: "Player Name",
			accessor: (user) => (
				<div className="flex items-center gap-3 min-w-0">
					<span className="font-medium text-gray-900 truncate" title={user.name}>{user.name}</span>
				</div>
			),
		},
		{
			header: "Email address",
			accessor: "email",
			cellClassName: "text-gray-500",
		},
		{
			header: "Registration Date",
			accessor: "date",
			cellClassName: "text-gray-500",
		},
		{
			header: "Wallet Balance",
			accessor: "balance",
			cellClassName: "font-medium text-gray-900",
		},
		{
			header: "Status",
			accessor: (user) => (
				<span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
					user.status === 'Verified' ? 'bg-[#E8F8E5] text-[#10C300]' :
					user.status === 'Pending' ? 'bg-[#FFF8E5] text-[#FFB000]' :
					'bg-[#FEECEB] text-[#EE201C]'
				}`}>
					{user.status}
				</span>
			),
		},
	];

	const statusLabel = statusFilter === "all" ? "Status" : STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label ?? "Status";
	const timeLabel = TIME_OPTIONS.find((o) => o.value === timeFilter)?.label ?? "All time";

	const filters = (
		<>
			<div className="relative" ref={statusRef}>
				<button
					onClick={() => { setShowStatusDropdown(!showStatusDropdown); setShowTimeDropdown(false); }}
					className="flex cursor-pointer items-center gap-2 rounded-full bg-[#F6F6F6] px-4 py-2 text-sm font-medium text-gray-600"
				>
					{statusLabel}
					{statusFilter !== "all" ? (
						<X
							className="h-3.5 w-3.5 text-gray-400"
							onClick={(e) => { e.stopPropagation(); setStatusFilter("all"); }}
						/>
					) : (
						<ChevronDown className="h-4 w-4 text-gray-400" />
					)}
				</button>
				{showStatusDropdown && (
					<div className="absolute right-0 top-10 z-50 w-44 rounded-xl bg-white p-2 shadow-lg border border-gray-100">
						{STATUS_OPTIONS.map((opt) => (
							<button
								key={opt.value}
								onClick={() => { setStatusFilter(opt.value); setShowStatusDropdown(false); }}
								className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-sm ${
									statusFilter === opt.value ? "bg-accent font-semibold text-white" : "text-gray-700 hover:bg-gray-50"
								}`}
							>
								{opt.label}
							</button>
						))}
					</div>
				)}
			</div>
			<div className="relative" ref={timeRef}>
				<button
					onClick={() => { setShowTimeDropdown(!showTimeDropdown); setShowStatusDropdown(false); }}
					className="flex cursor-pointer items-center gap-2 rounded-full bg-[#F6F6F6] px-4 py-2 text-sm font-medium text-gray-600"
				>
					{timeLabel}
					{timeFilter !== "all" ? (
						<X
							className="h-3.5 w-3.5 text-gray-400"
							onClick={(e) => { e.stopPropagation(); setTimeFilter("all"); }}
						/>
					) : (
						<ChevronDown className="h-4 w-4 text-gray-400" />
					)}
				</button>
				{showTimeDropdown && (
					<div className="absolute right-0 top-10 z-50 w-44 rounded-xl bg-white p-2 shadow-lg border border-gray-100">
						{TIME_OPTIONS.map((opt) => (
							<button
								key={opt.value}
								onClick={() => { setTimeFilter(opt.value); setShowTimeDropdown(false); }}
								className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-sm ${
									timeFilter === opt.value ? "bg-accent font-semibold text-white" : "text-gray-700 hover:bg-gray-50"
								}`}
							>
								{opt.label}
							</button>
						))}
					</div>
				)}
			</div>
		</>
	);

	return (
		<div className="flex flex-col rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
			<div className="mb-6 flex flex-wrap items-center justify-between gap-4">
				<div>
					<h2 className="text-xl font-bold text-gray-900">User Analytics</h2>
					<p className="mt-1 text-sm text-gray-500">Manage all your users and activities.</p>
				</div>
				<div className="flex items-center gap-3">
					{filters}
				</div>
			</div>

			{loading ? (
				<div className="flex items-center justify-center py-12 text-gray-400">
					Loading users...
				</div>
			) : (
				<DataTable
					data={displayedUsers}
					columns={columns}
					maxHeight="400px"
				/>
			)}

			{allUsers.length > itemsPerPage && (
				<div className="mt-6 flex items-center justify-between text-sm text-gray-500">
					<span>Page {currentPage} of {totalPages}</span>
					<div className="flex gap-3">
						<button
							onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
							disabled={currentPage === 1}
							className="rounded-lg bg-[#1BAA04] px-4 py-2 font-medium text-white hover:bg-[#0ea800] cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Previous
						</button>
						<button
							onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
							disabled={currentPage === totalPages}
							className="rounded-lg bg-[#1BAA04] px-4 py-2 font-medium text-white hover:bg-[#0ea800] cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Next
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
