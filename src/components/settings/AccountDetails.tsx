import { useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowUpFromLine } from "lucide-react";
import { toast } from "sonner";
import { redirectToSignIn } from "@/lib/api";
import { type Admin } from "@/lib/auth";

interface AccountDetailsProps {
	admin: Admin | null;
}

export function AccountDetails({ admin }: AccountDetailsProps) {
	const navigate = useNavigate();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [isSaving, setIsSaving] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	const [isDragging, setIsDragging] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [successMessage, setSuccessMessage] = useState("");
	const [formData, setFormData] = useState({
		name: admin?.name || "",
		email: admin?.email || "",
		mobileNumber: admin?.mobileNumber || "",
	});

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
				if (response.status === 401) {
					redirectToSignIn();
					return;
				}
				if (response.status === 400) {
					setErrors({ general: data.error || "Invalid request" });
				} else {
					toast.error(data.error || "Failed to save changes");
				}
				return;
			}

			setSuccessMessage("Profile updated successfully");
			setErrors({});
			navigate({ to: "/app", replace: true });
		} catch {
			toast.error("An error occurred. Please try again.");
		} finally {
			setIsSaving(false);
		}
	};

	const handleFileSelect = (file: File | null) => {
		if (file) {
			uploadProfilePicture(file);
		}
	};

	const uploadProfilePicture = (file: File) => {
		const allowedTypes = [
			"image/jpeg",
			"image/png",
			"image/gif",
			"image/webp",
			"image/svg+xml",
		];
		const maxSize = 5 * 1024 * 1024;

		if (!allowedTypes.includes(file.type)) {
			toast.error("Only image files (JPEG, PNG, GIF, WebP, SVG) are allowed");
			return;
		}

		if (file.size > maxSize) {
			toast.error("File size must be less than 5MB");
			return;
		}

		setIsUploading(true);
		const toastId = toast.loading("Uploading profile picture...", {
			duration: Infinity,
		});

		const formData = new FormData();
		formData.append("file", file);

		const xhr = new XMLHttpRequest();

		xhr.upload.onprogress = (event) => {
			if (event.lengthComputable) {
				const percent = Math.round((event.loaded / event.total) * 100);
				toast.loading(`Uploading... ${percent}%`, {
					id: toastId,
					duration: Infinity,
				});
			}
		};

		xhr.onload = () => {
			setIsUploading(false);
			if (xhr.status >= 200 && xhr.status < 300) {
				toast.success("Upload complete", { id: toastId });
				navigate({ to: "/app", replace: true });
			} else if (xhr.status === 401) {
				toast.dismiss(toastId);
				redirectToSignIn();
			} else {
				toast.error("An error occurred. Please try again later.", {
					id: toastId,
				});
			}
		};

		xhr.onerror = () => {
			setIsUploading(false);
			toast.error("An error occurred. Please try again later.", {
				id: toastId,
			});
		};

		xhr.open(
			"PATCH",
			`${import.meta.env.VITE_API_BASE || "https://staging-api.sportsdey.com"}/admin/me/profile-picture`,
		);
		xhr.withCredentials = true;
		xhr.send(formData);
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(true);
	};

	const handleDragLeave = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
		const files = e.dataTransfer.files;
		if (files.length > 0) {
			handleFileSelect(files[0]);
		}
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (files && files.length > 0) {
			handleFileSelect(files[0]);
		}
	};

	const fields = [
		{
			label: "Name",
			value: formData.name,
			key: "name",
			type: "text",
		},
		{
			label: "Email address",
			value: formData.email,
			key: "email",
			type: "email",
		},
		{
			label: "Mobile number",
			value: formData.mobileNumber,
			key: "mobileNumber",
			type: "tel",
		},
	];

	return (
		<div className="space-y-8">
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
				<h2 className="font-semibold text-[#1d2939] text-xl">Personal info</h2>
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
							src={admin?.image || "https://i.pravatar.cc/100?img=5"}
							alt="Profile avatar"
							className="h-16 w-16 rounded-full object-cover"
						/>
						<label
							htmlFor="profile-upload"
							className={`flex min-h-32 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#d0d5dd] bg-white px-4 py-6 text-center transition-colors ${
								isDragging ? "border-accent bg-green-50" : "hover:border-accent"
							} ${isUploading ? "pointer-events-none opacity-50" : ""}`}
							onDragOver={handleDragOver}
							onDragLeave={handleDragLeave}
							onDrop={handleDrop}
						>
							<input
								id="profile-upload"
								type="file"
								accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
								ref={fileInputRef}
								onChange={handleInputChange}
								className="hidden"
								disabled={isUploading}
							/>
							{isUploading ? (
								<>
									<div className="mb-2 h-9 w-9 animate-spin rounded-full border-2 border-accent border-t-transparent" />
									<span className="font-semibold text-[#1baa04] text-sm">
										Uploading...
									</span>
								</>
							) : (
								<>
									<span className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-[#f2f4f7] text-[#667085]">
										<ArrowUpFromLine size={16} />
									</span>
									<span className="font-semibold text-[#1baa04] text-sm">
										Click to upload
									</span>
									<span className="text-[#667085] text-sm">
										or drag and drop
									</span>
									<span className="mt-1 text-[#98a2b3] text-xs">
										SVG, PNG, JPG, GIF or WebP (max. 5MB)
									</span>
								</>
							)}
						</label>
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
	);
}
