import { useEffect, useState } from "react";
import { Clock3, Globe, Laptop, Monitor, Smartphone, Tablet } from "lucide-react";
import { toast } from "sonner";
import { type Device, adminAuth } from "@/lib/auth";

export function Sessions() {
	const [devices, setDevices] = useState<Device[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchDevices = async () => {
			setIsLoading(true);
			try {
				const deviceList = await adminAuth.listDevices();
				setDevices(deviceList);
			} catch {
				toast.error("Failed to load devices");
			} finally {
				setIsLoading(false);
			}
		};
		fetchDevices();
	}, []);

	const handleLogoutDevice = async (deviceId: string) => {
		try {
			await adminAuth.logoutDevice(deviceId);
			toast.success("Device logged out successfully");
			const deviceList = await adminAuth.listDevices();
			setDevices(deviceList);
		} catch {
			toast.error("Failed to log out device");
		}
	};

	const getDeviceIcon = (deviceName: string) => {
		const lower = deviceName.toLowerCase();
		if (
			lower.includes("iphone") ||
			lower.includes("android") ||
			lower.includes("ios")
		) {
			return <Smartphone size={22} strokeWidth={1.8} />;
		}
		if (lower.includes("ipad") || lower.includes("tablet")) {
			return <Tablet size={22} strokeWidth={1.8} />;
		}
		if (
			lower.includes("mac") ||
			lower.includes("windows") ||
			lower.includes("linux")
		) {
			return <Monitor size={22} strokeWidth={1.8} />;
		}
		return <Laptop size={22} strokeWidth={1.8} />;
	};

	const formatLastActive = (dateString: string) => {
		const date = new Date(dateString);
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const minutes = Math.floor(diff / 60000);
		const hours = Math.floor(diff / 3600000);
		const days = Math.floor(diff / 86400000);

		if (minutes < 1) return "Just now";
		if (minutes < 60)
			return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
		if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
		return `${days} day${days > 1 ? "s" : ""} ago`;
	};

	return (
		<div className="min-h-[540px]">
			{isLoading ? (
				<div className="flex items-center justify-center py-12">
					<div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent"></div>
				</div>
			) : devices.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-12 text-[#667085]">
					<Monitor size={48} className="mb-4 text-[#c1c8d0]" />
					<p>No devices found</p>
				</div>
			) : (
				<div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
					{devices.map((session) => (
						<article
							key={session.id}
							className="max-w-[300px] rounded-2xl bg-[#ececec] p-4 shadow-[0_2px_8px_rgba(16,24,40,0.04)]"
						>
							<div className="mb-4 flex items-start gap-3">
								<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#dfdfdf] text-[#101828]">
									{getDeviceIcon(session.deviceName)}
								</div>
								<div>
									<h3 className="font-semibold text-[#101828] text-3xl/[1]">
										{session.deviceName}
									</h3>
									<p className="mt-1 text-[#414141] text-xs">
										{session.ipAddress || "Unknown IP"}
									</p>
								</div>
							</div>

							<div className="space-y-1.5 text-[#202020] text-sm">
								<p className="flex items-center gap-2">
									<Globe size={13} />
									<span>{session.browser}</span>
								</p>
								<p className="flex items-center gap-2">
									<Clock3 size={13} />
									<span>{formatLastActive(session.lastActiveAt)}</span>
								</p>
							</div>

							<button
								type="button"
								onClick={() =>
									!session.isCurrentDevice &&
									handleLogoutDevice(session.id)
								}
								disabled={session.isCurrentDevice}
								className={`mt-4 h-10 w-full rounded-xl font-semibold text-base transition-colors ${
									session.isCurrentDevice
										? "bg-accent text-white"
										: "bg-[#e3e3e3] text-[#111827] hover:bg-[#d9d9d9]"
								}`}
							>
								{session.isCurrentDevice
									? "Current Device"
									: "Sign out"}
							</button>
						</article>
					))}
				</div>
			)}
		</div>
	);
}