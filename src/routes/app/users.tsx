import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import {
	Document,
	Packer,
	Paragraph,
	Table,
	TableCell,
	TableRow,
	TextRun,
	WidthType,
} from "docx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Eye, PauseCircle, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
	FaFileExcel,
	FaFileExport,
	FaFilePdf,
	FaFileWord,
} from "react-icons/fa6";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import NotificationIcon from "#/assets/NotificationIcon";
import { type Column, DataTable } from "#/components/DataTable";
import { ActionDropdown } from "../../components/ActionDropdown";
import { SendNoticeModal } from "../../components/SendNoticeModal";
import {
	type TimePeriod,
	TimePeriodFilter,
} from "../../components/TimePeriodFilter";
import { UserProfileModal } from "../../components/UserProfileModal";
import { useHasPermission } from "../../hooks/useCurrentUser";
import { notificationService } from "../../lib/notifications";
import { getDateRangeForPeriod } from "../../lib/time-period";
import {
	type NewUser,
	type User,
	type UserProfile,
	userService,
} from "../../lib/users";
import { capitalizeName } from "../../lib/utils";
import { startAdminExport } from "../../lib/admin-exports";

export const Route = createFileRoute("/app/users")({
	beforeLoad: ({ context }) => {
		const admin = (context as any).admin;
		if (
			admin &&
			admin.role !== "super_admin" &&
			!admin.permissions?.includes("user_management")
		) {
			throw redirect({ to: "/app", replace: true });
		}
	},
	component: UsersPage,
});

type Tab = "all" | "recent" | "pending";

function UsersPage() {
	const queryClient = useQueryClient();
	const router = useRouter();
	const hasSendNoticePerm = useHasPermission("send_notifications");
	const hasViewPlayerPerm = useHasPermission("view_player_details");
	const hasDeactivatePerm = useHasPermission("deactivate_account");
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const [limit] = useState(10);
	const [sort] = useState<"asc" | "desc">("desc");
	const [activeTab, setActiveTab] = useState<Tab>("all");
	// const [statusFilter, setStatusFilter] = useState<"all" | "verified" | "pending">(
	// 	"all",
	// );
	const [selectedTimePeriod, setSelectedTimePeriod] =
		useState<TimePeriod>("All");
	const [customRange, setCustomRange] = useState<
		{ start: string; end: string } | undefined
	>(undefined);
	const [showAddModal, setShowAddModal] = useState(false);
	const [newUser, setNewUser] = useState<NewUser>({
		name: "",
		email: "",
		country: "",
		mobileNumber: "",
	});

	const [actionDropdown, setActionDropdown] = useState<{
		user: User;
		top: number;
		right: number;
	} | null>(null);
	const [selectedProfileUser, setSelectedProfileUser] = useState<User | null>(
		null,
	);
	const [noticeModalUser, setNoticeModalUser] = useState<User | null>(null);
	const [showGlobalNoticeModal, setShowGlobalNoticeModal] = useState(false);
	const [showExportDropdown, setShowExportDropdown] = useState(false);

	const exportToExcel = async () => {
		const toastId = toast.loading("Fetching all users for export...");
		try {
			const res = await userService.listAllUsers();
			if (!res.success) throw new Error(res.error || "Failed to fetch users");

			const usersList = res.data?.users || res.data || [];
			if (!usersList || usersList.length === 0) {
				toast.error("No users to export", { id: toastId });
				return;
			}

			const dataToExport = usersList.map((user: User) => ({
				"User Id": user.id,
				"Player Name": user.name,
				"Email Address": user.email,
				"Registration Date": user.registeredDate
					? new Date(user.registeredDate).toLocaleDateString()
					: "-",
				"Registration IP": user.registeredIpAddress || user.ipAddress || "-",
				"Wallet Balance": user.wallet,
				Status:
					user.status === "approved" || user.status === "verified"
						? "Verified"
						: user.status === "pending_verification"
							? "Pending"
							: "Not Verified",
			}));

			const worksheet = XLSX.utils.json_to_sheet(dataToExport);
			worksheet["!cols"] = [
				{ wch: 15 }, // User ID
				{ wch: 25 }, // Player Name
				{ wch: 30 }, // Email Address
				{ wch: 20 }, // Registration Date
				{ wch: 18 }, // Registration IP
				{ wch: 15 }, // Wallet Balance
				{ wch: 15 }, // Status
			];
			const workbook = XLSX.utils.book_new();
			XLSX.utils.book_append_sheet(workbook, worksheet, "Users");
			XLSX.writeFile(
				workbook,
				`Users_Export_${new Date().toISOString().split("T")[0]}.xlsx`,
			);
			toast.success("Export successful", { id: toastId });
		} catch (err: any) {
			toast.error(err.message || "Failed to export users", { id: toastId });
		}
	};

	const exportToPdf = async () => {
		const toastId = toast.loading("Fetching all users for export...");
		try {
			const res = await userService.listAllUsers();
			if (!res.success) throw new Error(res.error || "Failed to fetch users");

			const usersList = res.data?.users || res.data || [];
			if (!usersList || usersList.length === 0) {
				toast.error("No users to export", { id: toastId });
				return;
			}

			const doc = new jsPDF({ orientation: "landscape", format: [600, 300] });
			doc.text("Users", 14, 15);
			autoTable(doc, {
				head: [
					[
						"User Id",
						"Player Name",
						"Email Address",
						"Registration Date",
						"Registration IP",
						"Wallet Balance",
						"Status",
					],
				],
				body: usersList.map((u: User) => [
					u.id,
					u.name,
					u.email,
					u.registeredDate
						? new Date(u.registeredDate).toLocaleDateString()
						: "-",
					u.registeredIpAddress || u.ipAddress || "-",
					u.wallet?.toString() || "0",
					u.status === "approved" || u.status === "verified"
						? "Verified"
						: u.status === "pending_verification"
							? "Pending"
							: "Not Verified",
				]),
				startY: 20,
				styles: { overflow: 'visible', minCellWidth: 30 },
			});
			doc.save(`Users_Export_${new Date().toISOString().split("T")[0]}.pdf`);
			toast.success("Export successful", { id: toastId });
		} catch (err: any) {
			toast.error(err.message || "Failed to export users", { id: toastId });
		}
	};

	const exportToDocx = async () => {
		const toastId = toast.loading("Fetching all users for export...");
		try {
			const res = await userService.listAllUsers();
			if (!res.success) throw new Error(res.error || "Failed to fetch users");

			const usersList = res.data?.users || res.data || [];
			if (!usersList || usersList.length === 0) {
				toast.error("No users to export", { id: toastId });
				return;
			}

			const docx = new Document({
				sections: [
					{
						properties: {
							page: {
								size: {
									width: 25000,
									height: 12000,
								},
							},
						},
						children: [
							new Paragraph({
								children: [
									new TextRun({
										text: "Users",
										bold: true,
										size: 32,
									}),
								],
								spacing: { after: 400 },
							}),
							new Table({
								width: { size: 100, type: WidthType.PERCENTAGE },
								rows: [
									new TableRow({
										children: [
											"User Id",
											"Player Name",
											"Email Address",
											"Registration Date",
											"Registration IP",
											"Wallet Balance",
											"Status",
										].map(
											(header) =>
												new TableCell({
													children: [
														new Paragraph({
															children: [
																new TextRun({ text: header, bold: true }),
															],
														}),
													],
													shading: { fill: "f3f4f6" },
													margins: {
														top: 100,
														bottom: 100,
														left: 100,
														right: 100,
													},
												}),
										),
									}),
									...usersList.map(
										(u: User) =>
											new TableRow({
												children: [
													u.id,
													u.name,
													u.email,
													u.registeredDate
														? new Date(u.registeredDate).toLocaleDateString()
														: "-",
													u.registeredIpAddress || u.ipAddress || "-",
													u.wallet?.toString() || "0",
													u.status === "verified" || u.status === "approved"
														? "Verified"
														: u.status === "pending_verification"
															? "Pending"
															: "Not Verified",
												].map(
													(cell) =>
														new TableCell({
															children: [new Paragraph(String(cell))],
															margins: {
																top: 100,
																bottom: 100,
																left: 100,
																right: 100,
															},
														}),
												),
											}),
									),
								],
							}),
						],
					},
				],
			});

			Packer.toBlob(docx).then((blob) => {
				const link = document.createElement("a");
				const url = URL.createObjectURL(blob);
				link.setAttribute("href", url);
				link.setAttribute(
					"download",
					`Users_Export_${new Date().toISOString().split("T")[0]}.docx`,
				);
				link.style.visibility = "hidden";
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
				toast.success("Export successful", { id: toastId });
			});
		} catch (err: any) {
			toast.error(err.message || "Failed to export users", { id: toastId });
		}
	};

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = () => {
			setActionDropdown(null);
			setShowExportDropdown(false);
		};
		document.addEventListener("click", handleClickOutside);
		return () => document.removeEventListener("click", handleClickOutside);
	}, []);

	const { fromDate, toDate } = useMemo(
		() =>
			getDateRangeForPeriod(selectedTimePeriod, customRange, { output: "iso" }),
		[selectedTimePeriod, customRange],
	);
	const exportUsers = (format: "xlsx" | "docx" | "pdf") => {
		void startAdminExport({
			source: "users",
			format,
			filters: {
				tab: activeTab,
				search: search || undefined,
				fromDate,
				toDate,
			},
		});
	};

	useEffect(() => {
		// console.log("UsersPage: computed date range", { selectedTimePeriod, customRange, fromDate, toDate });
	}, [selectedTimePeriod, customRange, fromDate, toDate]);

	const {
		data: usersData,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["users", page, limit, sort, activeTab, search, fromDate, toDate],
		queryFn: async () => {
			// console.log("UsersPage: calling listUsers with", { page, limit, sort, tab: activeTab, fromDate, toDate });
			const result = await userService.listUsers({
				page,
				limit,
				sort,
				tab: activeTab,
				search: search || undefined,
				fromDate,
				toDate,
			});
			if (!result.success) {
				throw new Error(result.error || "Failed to fetch users");
			}
			return result.data;
		},
	});

	useEffect(() => {
		if (error) {
			toast.error(error.message || "Failed to fetch users");
		}
	}, [error]);

	const createUserMutation = useMutation({
		mutationFn: async (data: NewUser) => {
			const result = await userService.createUser(data);
			if (!result.success) {
				throw new Error(result.error || "Failed to create user");
			}
			return result.data;
		},
		onSuccess: () => {
			toast.success("User created successfully");
			setShowAddModal(false);
			setNewUser({ name: "", email: "", country: "", mobileNumber: "" });
			queryClient.invalidateQueries({ queryKey: ["users"] });
			router.invalidate();
		},
		onError: (error) => {
			toast.error(error.message || "Failed to create user");
		},
	});

	const toggleSuspendMutation = useMutation({
		mutationFn: async (userId: string) => {
			const result = await userService.toggleUserSuspend(userId);
			if (!result.success) {
				throw new Error(result.error || "Failed to update user status");
			}
			return result;
		},
		onSuccess: (_, userId) => {
			const user = usersData?.users.find((u) => u.id === userId);
			const isReactivate = user?.suspended;
			toast.success(
				isReactivate
					? "User reactivated successfully"
					: "User suspended successfully",
			);
			queryClient.invalidateQueries({ queryKey: ["users"] });
			router.invalidate();
		},
		onError: (error) => {
			toast.error(error.message || "Failed to update user status");
		},
	});

	const columns: Column<User>[] = [
		{
			header: "User Id",
			accessor: "id",
		},
		{
			header: "Player Name",
			accessor: (user) => (
				<div
					className="flex items-center gap-3 min-w-0 cursor-pointer"
					onClick={() => setSelectedProfileUser(user)}
				>
					{/* <img
						src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
						alt="avatar"
						className="h-8 w-8 rounded-full bg-gray-100 object-cover shrink-0"
					/> */}
					<span
						className="font-medium text-sm text-gray-900 hover:text-primary transition-colors truncate"
						title={capitalizeName(user.name)}
					>
						{capitalizeName(user.name)}
					</span>
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
			accessor: (user) => {
				if (!user.registeredDate) return "-";
				const dateObj = new Date(user.registeredDate);
				if (isNaN(dateObj.getTime())) return String(user.registeredDate);

				const formattedDate = dateObj.toLocaleDateString("en-US", {
					month: "short",
					day: "numeric",
					year: "numeric",
				});
				const formattedTime = dateObj
					.toLocaleTimeString("en-US", {
						hour: "numeric",
						minute: "2-digit",
						hour12: true,
					})
					.toLowerCase();

				return (
					<div className="flex flex-col">
						<span className="font-medium text-gray-900">{formattedDate}</span>
						<span className="text-xs text-gray-500">{formattedTime}</span>
					</div>
				);
			},
			cellClassName: "text-gray-500",
		},
		{
			header: "Registration IP",
			accessor: (user) => user.registeredIpAddress || user.ipAddress || "-",
			cellClassName: "text-gray-500",
		},
		{
			header: "Wallet Balance",
			accessor: (user) => `₦${user.wallet.toLocaleString()}`,
			cellClassName: "font-medium text-gray-900",
		},
		{
			header: "Status",
			accessor: (user) => (
				<span
					className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
						user.status === "approved"
							? "bg-[#E8F8E5] text-[#10C300]"
							: user.status === "pending_verification"
								? "bg-[#FFF8E5] text-[#FFB000]"
								: "bg-[#FEECEB] text-[#EE201C]"
					}`}
				>
					{user.status === "approved"
						? "Verified"
						: user.status === "pending_verification"
							? "Pending"
							: "Not Verified"}
				</span>
			),
		},
	];

	const users = usersData?.users ?? [];

	return (
		<div className="flex h-[calc(100vh-120px)] flex-1 flex-col overflow-hidden">
			<div className="flex shrink-0 flex-col justify-between gap-4 md:flex-row md:items-center">
				<div>
					<h2 className="font-bold text-[46px] leading-none text-[#11142D]">
						All Users
					</h2>
					<p className="mt-3 text-base text-[#222]">
						Manage all your users and activities.
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-3">
					{hasSendNoticePerm && (
						<button
							onClick={() => setShowGlobalNoticeModal(true)}
							className="cursor-pointer flex h-12 items-center justify-center gap-x-3 rounded-full bg-[#F5F6F7] px-6 text-[#1A1A1A]"
						>
							<NotificationIcon height={"15"} width={"15"} color={"#053209"} />
							<span className="text-base">Send a Notice</span>
						</button>
					)}

					<button
						type="button"
						onClick={() => setShowAddModal(true)}
						className="inline-flex h-12 cursor-pointer items-center gap-2 rounded-full bg-accent px-6 py-2 font-medium text-white text-base hover:bg-accent/90"
					>
						<svg
							className="h-4 w-4"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M12 4v16m8-8H4"
							/>
						</svg>
						Add new user
					</button>

					{users.length > 0 && (
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
								className="inline-flex items-center h-11 gap-1.5 rounded-full bg-[#1BAA04] px-3 py-1.5 text-sm font-medium text-white cursor-pointer hover:bg-[#158903] transition-colors"
							>
								Export File as
								<FaFileExport className="h-3.5 w-3.5 text-white" />
							</button>

							{showExportDropdown && (
								<div className="absolute right-0 z-[70] mt-2 w-40 rounded-xl border border-gray-200 bg-white p-1 shadow-lg overflow-hidden">
									<button
										type="button"
										onClick={(e) => {
											e.stopPropagation();
											setShowExportDropdown(false);
											exportUsers("pdf");
										}}
										className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
									>
										<FaFilePdf className="text-red-500 w-4 h-4" />
										PDF
									</button>
									<button
										type="button"
										onClick={(e) => {
											e.stopPropagation();
											setShowExportDropdown(false);
											exportUsers("docx");
										}}
										className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
									>
										<FaFileWord className="text-blue-600 w-4 h-4" />
										DOCX
									</button>
									<button
										type="button"
										onClick={(e) => {
											e.stopPropagation();
											setShowExportDropdown(false);
											exportUsers("xlsx");
										}}
										className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
									>
										<FaFileExcel className="text-green-600 w-4 h-4" />
										Excel
									</button>
								</div>
							)}
						</div>
					)}
				</div>
			</div>

			<div className="mt-8 mb-5 flex shrink-0 flex-col justify-between gap-4 lg:flex-row lg:items-center">
				<div className="overflow-x-auto custom-scrollbar lg:overflow-visible">
					<div className="flex min-w-max gap-8 border-gray-300 border-b">
						{[
							{ key: "all", label: "All Users" },
							{ key: "recent", label: "Recently registered" },
							{ key: "pending", label: "Pending verification" },
						].map((tab) => (
							<button
								type="button"
								key={tab.key}
								onClick={() => {
									setActiveTab(tab.key as Tab);
									setPage(1);
								}}
								className={`cursor-pointer pb-3 font-medium text-base transition-colors ${
									activeTab === tab.key
										? "border-b-2 border-accent text-accent"
										: "text-gray-600 hover:text-gray-900"
								}`}
							>
								{tab.label}
							</button>
						))}
					</div>
				</div>

				<form
					onSubmit={(e) => e.preventDefault()}
					className="relative flex items-center gap-3 flex-wrap lg:flex-nowrap"
				>
					<div className="relative">
						<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
						<input
							type="text"
							placeholder="Search users..."
							value={search}
							onChange={(e) => {
								setSearch(e.target.value);
								setPage(1);
							}}
							className="h-9 w-64 rounded-full border border-gray-200 bg-white pl-9 pr-4 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
						/>
					</div>
					{/* <button
						type="button"
						onClick={() => setSort((s) => (s === "asc" ? "desc" : "asc"))}
						className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-full bg-white px-4 font-medium text-sm text-[#2B2F38] shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:bg-gray-50"
					>
						Price range
						<ChevronDown className="h-3.5 w-3.5" />
					</button>
					<button
						type="button"
						onClick={() =>
							setStatusFilter((current) => {
								if (current === "all") return "verified";
								if (current === "verified") return "pending";
								return "all";
							})
						}
						className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-full bg-white px-4 font-medium text-sm text-[#2B2F38] shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:bg-gray-50"
>
						{statusFilter === "all"
							? "Status"
							: statusFilter === "verified"
								? "Verified"
								: "Pending"}
						<ChevronDown className="h-3.5 w-3.5" />
					</button> */}
					<TimePeriodFilter
						onFilterChange={(period, range) => {
							setSelectedTimePeriod(period);
							setCustomRange(range);
							setPage(1);
						}}
						buttonClassName="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-white px-4 font-medium text-sm text-[#2B2F38] shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:bg-gray-50"
					/>
				</form>
			</div>

			<DataTable
				data={users}
				isLoading={isLoading}
				columns={columns}
				maxHeight="100%"
				onActionClick={(user, e) => {
					e.stopPropagation();
					e.nativeEvent.stopImmediatePropagation();
					const rect = e.currentTarget.getBoundingClientRect();
					setActionDropdown({
						user,
						top: rect.bottom + window.scrollY,
						right: window.innerWidth - rect.right,
					});
				}}
				emptyMessage="No user found"
				pagination={{
					currentPage: page,
					totalPages: usersData?.totalPages ?? 0,
					onPageChange: setPage,
					totalItems: usersData?.total ?? 0,
					itemsPerPage: limit,
				}}
			/>

			{showAddModal && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
					onClick={() => setShowAddModal(false)}
				>
					<div
						className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="mb-4 flex items-center justify-between">
							<h3 className="font-bold text-xl text-gray-900">Add new user</h3>
							<button
								type="button"
								onClick={() => setShowAddModal(false)}
								className="text-gray-500 hover:text-gray-900"
							>
								<svg
									className="h-5 w-5"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							</button>
						</div>
						<form
							onSubmit={(e) => {
								e.preventDefault();
								createUserMutation.mutate(newUser);
							}}
							className="space-y-4"
						>
							<div>
								<label className="block font-medium text-gray-900 text-sm">
									Name
								</label>
								<input
									type="text"
									value={newUser.name}
									onChange={(e) =>
										setNewUser({ ...newUser, name: e.target.value })
									}
									required
									className="mt-1 w-full rounded-md border border-gray-400 px-3 py-2 text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-primary"
								/>
							</div>
							<div>
								<label className="block font-medium text-gray-900 text-sm">
									Email
								</label>
								<input
									type="email"
									value={newUser.email}
									onChange={(e) =>
										setNewUser({ ...newUser, email: e.target.value })
									}
									required
									className="mt-1 w-full rounded-md border border-gray-400 px-3 py-2 text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-primary"
								/>
							</div>
							<div>
								<label className="block font-medium text-gray-900 text-sm">
									Country (optional)
								</label>
								<input
									type="text"
									value={newUser.country || ""}
									onChange={(e) =>
										setNewUser({ ...newUser, country: e.target.value })
									}
									className="mt-1 w-full rounded-md border border-gray-400 px-3 py-2 text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-primary"
								/>
							</div>
							<div>
								<label className="block font-medium text-gray-900 text-sm">
									Mobile number (optional)
								</label>
								<input
									type="tel"
									value={newUser.mobileNumber || ""}
									onChange={(e) =>
										setNewUser({ ...newUser, mobileNumber: e.target.value })
									}
									className="mt-1 w-full rounded-md border border-gray-400 px-3 py-2 text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-primary"
								/>
							</div>
							<div className="flex justify-end gap-3 pt-2">
								<button
									type="button"
									onClick={() => setShowAddModal(false)}
									className="rounded-md border border-gray-300 px-4 py-2 font-medium text-gray-900 hover:bg-gray-50"
								>
									Cancel
								</button>
								<button
									type="submit"
									disabled={createUserMutation.isPending}
									className="rounded-md bg-accent px-4 py-2 font-medium text-white hover:bg-accent/90 disabled:opacity-50"
								>
									{createUserMutation.isPending ? "Adding..." : "Add user"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{actionDropdown && (
				<ActionDropdown
					top={actionDropdown.top}
					right={actionDropdown.right}
					onClose={() => setActionDropdown(null)}
					items={[
						...(hasViewPlayerPerm
							? [
									{
										icon: <Eye className="w-4 h-4" />,
										label: "View profile",
										onClick: () => setSelectedProfileUser(actionDropdown.user),
									},
								]
							: []),
						...(hasSendNoticePerm
							? [
									{
										icon: <NotificationIcon height={"14"} width={"14"} />,
										label: "Send a notification",
										onClick: () => setNoticeModalUser(actionDropdown.user),
									},
								]
							: []),
						...(hasDeactivatePerm
							? [
									{
										icon: <PauseCircle className="w-4 h-4" />,
										label: actionDropdown.user.suspended
											? "Reactivate"
											: "Suspend",
										onClick: () => {
											// console.log("Current user status:", actionDropdown.user.status);
											toggleSuspendMutation.mutate(actionDropdown.user.id);
											setActionDropdown(null);
										},
									},
								]
							: []),
					]}
				/>
			)}

			{/* Profile Modal */}
			{selectedProfileUser && (
				<UserProfileModal
					user={selectedProfileUser}
					onClose={() => setSelectedProfileUser(null)}
					onSendNotice={(user) => {
						setNoticeModalUser(user);
						setSelectedProfileUser(null);
					}}
					onSuspend={() => {
						if (selectedProfileUser) {
							toggleSuspendMutation.mutate(selectedProfileUser.id);
						}
						setSelectedProfileUser(null);
					}}
				/>
			)}

			{/* Send Notice Modal */}
			{(noticeModalUser || showGlobalNoticeModal) && (
				<SendNoticeModal
					user={noticeModalUser}
					availableUsers={usersData?.users ? usersData?.users : []}
					onClose={() => {
						setNoticeModalUser(null);
						setShowGlobalNoticeModal(false);
					}}
					onSubmit={async (data) => {
						if (noticeModalUser) {
							const result = await notificationService.sendNotification({
								title: data.title,
								message: data.message,
								userId: noticeModalUser.id,
							});
							if (result.success) {
								toast.success(`Notice sent to ${noticeModalUser.name}`);
							} else {
								toast.error(result.error || "Failed to send notice");
							}
						} else if (showGlobalNoticeModal && usersData?.users) {
							const userIds = usersData.users.map((u) => u.id);
							const result =
								await notificationService.sendNotificationToMultiple(
									data.title,
									data.message,
									userIds,
								);
							if (result.success) {
								toast.success("Notice sent to all users");
							} else {
								toast.error(`Notice sent with ${result.errors.length} errors`);
							}
						}
					}}
				/>
			)}
		</div>
	);
}
