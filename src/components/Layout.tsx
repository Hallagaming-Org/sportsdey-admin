import { type ReactNode, useEffect, useState } from "react";
import type { Admin } from "../lib/auth";
import Header from "./Header";
import Sidebar from "./Sidebar";

type LayoutProps = {
	children: ReactNode;
	admin?: Admin | null;
	onLogout?: () => void;
};

export default function Layout({ children, admin, onLogout }: LayoutProps) {
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

	useEffect(() => {
		const handleResize = () => {
			setSidebarCollapsed(window.innerWidth < 1024);
		};

		handleResize();
		window.addEventListener("resize", handleResize);

		return () => window.removeEventListener("resize", handleResize);
	}, []);

	return (
		<div className="flex h-screen bg-background overflow-hidden">
			<Sidebar
				admin={admin}
				onLogout={onLogout}
				collapsed={sidebarCollapsed}
				onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
			/>
			<div className="flex-1 flex flex-col min-h-screen overflow-hidden bg-black">
				<Header admin={admin} />
				<main className="flex-1 p-6 lg:p-8 overflow-y-auto overflow-x-auto bg-background rounded-tl-[40px] custom-scrollbar">
					<div className="min-w-min lg:min-w-0">
						{children}
					</div>
				</main>
			</div>
		</div>
	);
}
