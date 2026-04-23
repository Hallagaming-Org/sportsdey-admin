import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
	Activity,
	ChevronLeft,
	ChevronRight,
	FileText,
	Gamepad2,
	Home,
	LogOut,
	type LucideIcon,
	Settings,
	Ticket,
	Users,
	Wallet,
} from "lucide-react";
import type { Admin } from "../lib/auth";
	import { FaSun, FaMoon } from "react-icons/fa";

type SidebarProps = {
	admin?: Admin | null;
	onLogout?: () => void;
	collapsed: boolean;
	onToggleCollapse: () => void;
};

type NavItem = {
	label: string;
	icon?: LucideIcon;
	to?: string;
};

const menuItems: NavItem[] = [
	{ icon: Home, label: "Dashboard", to: "/app" },
	{ icon: Users, label: "User management", to: "/app/users" },
	{ icon: Wallet, label: "Transactions", to: "/app/transactions" },
	{ icon: Gamepad2, label: "Game management", to: "/app/games" },
	{ icon: Ticket, label: "Ticket history", to: "/app/tickets" },
	{ icon: Settings, label: "CMS Controls", to: "/app/cms" },
	{ icon: Activity, label: "Activity log" },
];

const otherItems: NavItem[] = [
	{ icon: FileText, label: "KYC & Document Uploads" },
	{ icon: Settings, label: "General setting" },
];

export default function Sidebar({
	admin,
	onLogout,
	collapsed,
	onToggleCollapse,
}: SidebarProps) {
	const { location } = useRouterState();

	return (
		<motion.aside
			initial={false}
			animate={{ width: collapsed ? 80 : 280 }}
			transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
			className="relative z-20 flex h-screen shrink-0 flex-col bg-black text-white"
		>
			<div
				className={`flex items-center py-5 ${collapsed ? "justify-center px-0" : "justify-between px-6"}`}
			>
				{!collapsed && (
					<img
						src="/sportsdey-logo.png"
						alt="SportsDey"
						className="h-auto w-auto object-contain"
					/>
				)}
				<button
					type="button"
					className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-[#4b4a4a] text-white transition-all duration-180 hover:bg-white/12 hover:text-white ${collapsed ? "" : ""}`}
				>
					{new Date().getHours() >= 6 && new Date().getHours() < 18 ? <FaSun className="text-white" /> : <FaMoon className="text-white" />}
				</button>
			</div>

			<button
				type="button"
				className="absolute top-[72px] -right-6 z-25 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-none bg-accent text-white transition-all duration-180"
				onClick={onToggleCollapse}
				title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
			>
				{collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
			</button>

			<div className="flex-1 overflow-y-auto pb-3 custom-scrollbar">
				<div
					className={`flex items-center justify-between px-5 py-2 ${collapsed ? "justify-center" : ""}`}
				>
					{!collapsed && (
						<span className="font-semibold text-accent text-xs uppercase tracking-wider">
							Menu
						</span>
					)}
				</div>

				<nav
					className={`flex flex-col gap-0.5 px-3 ${collapsed ? "px-2" : ""}`}
				>
					{menuItems.map((item) => {
						const isActive = item.to
							? location.pathname === item.to ||
							  (item.to !== "/app" && location.pathname.startsWith(item.to))
							: false;

						return (
							<SidebarItem
								key={item.label}
								icon={item.icon}
								label={item.label}
								to={item.to}
								active={isActive}
								collapsed={collapsed}
							/>
						);
					})}
				</nav>

				<div
					className={`mt-6 flex items-center justify-between px-5 py-2 ${collapsed ? "justify-center" : ""}`}
				>
					{!collapsed && (
						<span className="font-semibold text-green-500 text-xs uppercase tracking-wider">
							Others
						</span>
					)}
				</div>

				<nav
					className={`flex flex-col gap-0.5 px-3 ${collapsed ? "px-2" : ""}`}
				>
					{otherItems.map((item) => (
						<SidebarItem
							key={item.label}
							icon={item.icon}
							label={item.label}
							collapsed={collapsed}
						/>
					))}
				</nav>
			</div>

			<div className="mt-auto mb-10 px-8 space-y-1">
				<button
					type="button"
					onClick={onLogout}
					className={`flex w-full cursor-pointer items-center gap-2.5 border-none bg-none py-2 text-sm text-white transition-colors duration-180 hover:text-white ${collapsed ? "justify-center" : ""}`}
				>
					<LogOut size={18} />
					{!collapsed && <span>Log out</span>}
				</button>

				<div
					className={`border-[#475467] border-t px-4 py-4 flex items-center gap-2.5 ${collapsed ? "justify-center" : ""}`}
				>
					<img
						src="https://i.pravatar.cc/40"
						alt="Admin avatar"
						className="h-10 w-10 shrink-0 rounded-full object-cover"
					/>
					{!collapsed && (
						<div className="min-w-0 flex-1">
							<p className="m-0 overflow-hidden text-ellipsis whitespace-nowrap font-semibold text-[13px] text-white">
								{admin?.name || "Olivia Rhye"}
							</p>
							<p className="m-0 mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap text-[11px] text-white/45">
								{admin?.email || "olivia@untitledui.com"}
							</p>
						</div>
					)}
					{!collapsed && (
						<button
							type="button"
							className="flex shrink-0 cursor-pointer items-center justify-center border-none bg-none p-1 text-white/40 transition-colors duration-180 hover:text-white"
						>
							<LogOut size={16} />
						</button>
					)}
				</div>
			</div>
		</motion.aside>
	);
}

function SidebarItem({
	icon: Icon,
	label,
	active = false,
	to,
	collapsed = false,
}: {
	icon?: LucideIcon;
	label: string;
	active?: boolean;
	to?: string;
	collapsed?: boolean;
}) {
	const className = `flex items-center gap-3 py-2.5 px-3.5 rounded-xl text-sm font-medium text-white no-underline cursor-pointer transition-all duration-180 hover:bg-white/07 hover:text-white/85 ${active ? "bg-accent text-white hover:bg-green-600" : ""}`;

	if (to) {
		return (
			<Link to={to} className={className} title={collapsed ? label : undefined}>
				{Icon ? <Icon size={18} /> : null}
				{!collapsed && <span>{label}</span>}
			</Link>
		);
	}

	return (
		<div className={className} title={collapsed ? label : undefined}>
			{Icon ? <Icon size={18} /> : null}
			{!collapsed && <span>{label}</span>}
		</div>
	);
}
