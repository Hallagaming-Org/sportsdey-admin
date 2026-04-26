import { X } from "lucide-react";
import type { User } from "../lib/users";

interface SendNoticeModalProps {
	user: User;
	onClose: () => void;
	onSubmit?: (data: { sendTo: string; authorName: string; message: string }) => void;
}

export function SendNoticeModal({ user, onClose, onSubmit }: SendNoticeModalProps) {
	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
			onClick={onClose}
		>
			<div
				className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-6"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="mb-6 flex items-center justify-between">
					<h3 className="font-bold text-2xl text-gray-900 tracking-tight">Send a Notice</h3>
					<button
						type="button"
						onClick={onClose}
						className="p-2 rounded-full transition-colors cursor-pointer border border-[#03002B]"
					>
						<X className="h-4 w-4 text-[#03002B]" />
					</button>
				</div>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						const formData = new FormData(e.currentTarget);
						onSubmit?.({
							sendTo: formData.get("sendTo") as string,
							authorName: formData.get("authorName") as string,
							message: formData.get("message") as string,
						});
						onClose();
					}}
					className="space-y-5"
				>
					<div>
						<label className="block font-medium text-gray-900 mb-1.5 text-sm">
							Send to
						</label>
						<select
							name="sendTo"
							className="w-full rounded-xl bg-[#F9F9F9] px-4 py-3 text-gray-500 focus:outline-none transition-colors"
							defaultValue="user"
						>
							<option value="user">select user type</option>
							<option value="all">All Users</option>
						</select>
					</div>
					<div>
						<label className="block font-medium text-gray-900 mb-1.5 text-sm">
							Author name
						</label>
						<input
							name="authorName"
							type="text"
							placeholder="Fullname"
							className="w-full rounded-xl bg-[#F9F9F9] px-4 py-3 text-gray-900 focus:outline-none transition-colors placeholder:text-gray-400 placeholder:text-xs"
							required
						/>
					</div>
					<div>
						<label className="block font-medium text-gray-900 mb-1.5 text-sm">
							Message
						</label>
						<textarea
							name="message"
							placeholder="Type your message here..."
							rows={4}
							className="w-full rounded-xl bg-[#F9F9F9] px-4 py-3 text-gray-900 focus:outline-none transition-colors resize-none placeholder:text-gray-400 placeholder:text-xs"
							required
						/>
					</div>
					<div className="flex justify-center pt-2">
						<button
							type="submit"
							className="w-[240px] rounded-full bg-[#10C300] px-4 py-3.5 font-medium text-white hover:bg-[#0ea800] transition-colors shadow-[0_4px_14px_0_rgba(16,195,0,0.39)] cursor-pointer"
						>
							Upload
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
