import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpFromLine, Mail, Phone, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { adminAuth } from "@/lib/auth";

export const Route = createFileRoute("/app/settings")({
	component: SettingsPage,
});

const tabs = [
	"My Account details",
	"Change password",
	"Game profits",
	"Theme settings",
	"Security & 2FA",
	"Sessions",
];

function SettingsPage() {
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		mobileNumber: "",
	});
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [successMessage, setSuccessMessage] = useState("");

	useEffect(() => {
		const fetchAdminData = async () => {
			const admin = await adminAuth.getSession();
			if (admin) {
				setFormData({
					name: admin.name || "",
					email: admin.email || "",
					mobileNumber: admin.mobileNumber || "",
				});
			}
			setIsLoading(false);
		};
		fetchAdminData();
	}, []);

	const validateForm = () => {
		const newErrors: Record<string, string> = {};

		if (!formData.name.trim()) {
			newErrors.name = "Name is required";
		}

		if (!formData.email.trim()) {
			newErrors.email = "Email is required";
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
			newErrors.email = "Invalid email format";
		}

		if (formData.mobileNumber.trim()) {
			if (!/^(0|\+234)[789][01]\d{8}$/.test(formData.mobileNumber)) {
				newErrors.mobileNumber =
					"Invalid phone number. Use format: 08012345678 or +2348012345678";
			}
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSave = async () => {
		setSuccessMessage("");
		if (!validateForm()) {
			return;
		}

		setIsSaving(true);
		try {
			const response = await fetch(
				`${import.meta.env.VITE_API_BASE || "https://staging-api.sportsdey.com"}/admin/me`,
				{
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						name: formData.name,
						email: formData.email,
						mobileNumber: formData.mobileNumber || null,
					}),
					credentials: "include",
				},
			);

			const data = await response.json();

			if (!response.ok) {
				if (response.status === 400) {
					setErrors({ general: data.error || "Invalid request" });
				} else {
					toast.error(data.error || "Failed to save changes");
				}
				return;
			}

			setSuccessMessage("Profile updated successfully");
			setErrors({});
		} catch {
			toast.error("An error occurred. Please try again.");
		} finally {
			setIsSaving(false);
		}
	};

	if (isLoading) {
		return (
<section className="mx-auto flex w-full min-w-[280px] max-w-6xl flex-col gap-6 pb-8">
				<header className="space-y-4">
					<h1 className="font-bold text-3xl text-[#101828] sm:text-4xl">
						Settings
					</h1>
				</header>
				<div className="flex items-center justify-center py-12">
					<div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent"></div>
				</div>
			</section>
		);
	}

	const fields = [
		{
			label: "Name",
			value: formData.name,
			icon: <UserRound size={16} />,
			key: "name",
			type: "text",
		},
		{
			label: "Email address",
			value: formData.email,
			icon: <Mail size={16} />,
			key: "email",
			type: "email",
		},
		{
			label: "Mobile number",
			value: formData.mobileNumber,
			icon: <Phone size={16} />,
			key: "mobileNumber",
			type: "tel",
		},
	];

	return (
		<section className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-8">
			<header className="space-y-4">
				<h1 className="font-bold text-3xl text-[#101828] sm:text-4xl">
					Settings
				</h1>
				<div className="no-scrollbar overflow-x-auto">
					<div className="flex min-w-max gap-8 border-gray-300 border-b">
						{tabs.map((tab, index) => (
							<button
								type="button"
								key={tab}
								className={`cursor-pointer border-b-2 pb-3 font-medium text-sm whitespace-nowrap transition-colors ${
									index === 0
										? "border-accent text-accent"
										: "border-transparent text-gray-600 hover:text-gray-900"
								}`}
							>
								{tab}
							</button>
						))}
					</div>
				</div>
			</header>

			<div className="overflow-x-auto space-y-8 rounded-2xl bg-[#f6f6f6] p-4 sm:p-6 lg:p-8">
				{errors.general && (
					<div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
						{errors.general}
					</div>
				)}
				{successMessage && (
					<div className="rounded-lg bg-green-50 p-4 text-sm text-green-600">
						{successMessage}
					</div>
				)}

				<section className="space-y-2 border-b border-[#d9d9d9] pb-6">
					<h2 className="font-semibold text-[#1d2939] text-xl">
						Personal info
					</h2>
					<p className="text-[#667085] text-sm">
						Update your photo and personal details here.
					</p>

					<div className="mt-6 grid gap-5 lg:grid-cols-[260px_1fr]">
						<div>
							<p className="font-medium text-[#344054] text-sm">Your photo</p>
							<p className="text-[#667085] text-sm">
								This will be displayed on your profile.
							</p>
						</div>

						<div className="grid gap-4 lg:grid-cols-[auto_1fr] lg:items-center">
							<img
								src="https://i.pravatar.cc/100?img=5"
								alt="Profile avatar"
								className="h-16 w-16 rounded-full object-cover"
							/>
							<button
								type="button"
								className="flex min-h-32 w-full cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#d0d5dd] bg-white px-4 py-6 text-center transition-colors hover:border-accent"
							>
								<span className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-[#f2f4f7] text-[#667085]">
									<ArrowUpFromLine size={16} />
								</span>
								<span className="font-semibold text-[#1baa04] text-sm">
									Click to upload
								</span>
								<span className="text-[#667085] text-sm">or drag and drop</span>
								<span className="mt-1 text-[#98a2b3] text-xs">
									SVG, PNG, JPG or GIF (max. 800x400px)
								</span>
							</button>
						</div>
					</div>
				</section>

				<div className="space-y-4">
					{fields.map((field) => (
						<div
							key={field.key}
							className="grid gap-2 border-b border-[#e4e7ec] pb-4 last:border-b-0 lg:grid-cols-[220px_1fr] lg:items-center"
						>
							<label className="font-medium text-[#344054] text-sm">
								{field.label}
							</label>
							<div className="flex h-12 items-center gap-2 rounded-xl border border-[#d0d5dd] bg-white px-3 text-[#101828] text-sm">
								{field.icon ? (
									<span className="text-[#667085]">{field.icon}</span>
								) : null}
								<input
									type={field.type}
									value={field.value}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											[field.key]: e.target.value,
										}))
									}
									className="w-full bg-transparent outline-none"
								/>
							</div>
							{errors[field.key] && (
								<p className="text-sm text-red-500 sm:col-start-2">
									{errors[field.key]}
								</p>
							)}
						</div>
					))}
				</div>

				<div className="flex justify-end pt-2">
					<button
						type="button"
						onClick={handleSave}
						disabled={isSaving}
						className="w-full cursor-pointer rounded-full bg-accent px-6 py-3 font-semibold text-white transition-colors hover:bg-[#159303] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-56"
					>
						{isSaving ? "Saving..." : "Save changes"}
					</button>
				</div>
			</div>
		</section>
	);
}
