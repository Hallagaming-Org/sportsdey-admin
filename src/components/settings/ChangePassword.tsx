import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { adminAuth } from "@/lib/auth";

export function ChangePassword() {
	const navigate = useNavigate();
	const [passwordData, setPasswordData] = useState({
		currentPassword: "",
		newPassword: "",
		confirmPassword: "",
	});
	const [showPassword, setShowPassword] = useState({
		currentPassword: false,
		newPassword: false,
		confirmPassword: false,
	});
	const [isSaving, setIsSaving] = useState(false);

	const handleSavePassword = async () => {
		if (!passwordData.newPassword || !passwordData.confirmPassword) {
			toast.error("Please fill in all password fields");
			return;
		}

		if (passwordData.newPassword !== passwordData.confirmPassword) {
			toast.error("New password and confirmation do not match");
			return;
		}

		setIsSaving(true);
		try {
			const result = await adminAuth.changePassword(
				passwordData.newPassword,
				passwordData.confirmPassword,
			);

			if (result.success) {
				toast.success("Password changed successfully. Please sign in again.");
				setPasswordData({
					currentPassword: "",
					newPassword: "",
					confirmPassword: "",
				});
				await adminAuth.signOut();
				navigate({ to: "/sign-in", replace: true });
			} else {
				toast.error(result.error || "Failed to change password");
			}
		} catch {
			toast.error("An error occurred while changing password");
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className="space-y-0 rounded-xl border border-[#eaecf0] bg-[#f9fafb]">
			{[
				{
					label: "Current password",
					key: "currentPassword",
					placeholder: "****************",
				},
				{
					label: "New password",
					key: "newPassword",
					placeholder: "Enter new password",
				},
				{
					label: "Confirm New password",
					key: "confirmPassword",
					placeholder: "Enter new password",
				},
			].map((item) => (
				<div
					key={item.key}
					className="grid gap-3 border-[#eaecf0] border-b px-4 py-5 last:border-b-0 md:grid-cols-[260px_1fr] md:items-center md:px-6"
				>
					<label className="font-medium text-[#344054] text-sm">
						{item.label}
					</label>
					<div className="flex h-12 items-center rounded-xl border border-[#eaecf0] bg-[#f2f4f7] px-4">
						<input
							type={
								showPassword[item.key as keyof typeof showPassword]
									? "text"
									: "password"
							}
							value={passwordData[item.key as keyof typeof passwordData]}
							placeholder={item.placeholder}
							onChange={(e) =>
								setPasswordData((prev) => ({
									...prev,
									[item.key]: e.target.value,
								}))
							}
							className="w-full bg-transparent text-[#101828] text-sm outline-none placeholder:text-[#98a2b3]"
						/>
						<button
							type="button"
							className="ml-2 cursor-pointer text-[#c1c8d0]"
							onClick={() =>
								setShowPassword((prev) => ({
									...prev,
									[item.key]: !prev[item.key as keyof typeof prev],
								}))
							}
							aria-label={`Toggle ${item.label.toLowerCase()} visibility`}
						>
							{showPassword[item.key as keyof typeof showPassword] ? (
								<EyeOff size={16} />
							) : (
								<Eye size={16} />
							)}
						</button>
					</div>
				</div>
			))}

			<div className="flex justify-end border-[#eaecf0] border-t px-4 py-5 md:px-6">
				<button
					type="button"
					onClick={handleSavePassword}
					disabled={isSaving}
					className="w-full rounded-full bg-accent px-8 py-3 font-semibold text-base text-white transition-colors hover:bg-[#159303] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-60"
				>
					{isSaving ? "Saving..." : "Save password"}
				</button>
			</div>
		</div>
	);
}