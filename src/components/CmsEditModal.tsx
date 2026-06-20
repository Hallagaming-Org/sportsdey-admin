import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { ChevronDown, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { type UpdateCmsContentData, cmsService } from "../lib/cms";
import type { ApiErrorDetail } from "../lib/api";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Highlight } from "@tiptap/extension-highlight";
import { FontFamily } from "@tiptap/extension-font-family";
import { Underline } from "@tiptap/extension-underline";
import { TextAlign } from "@tiptap/extension-text-align";

type CmsFieldName = keyof UpdateCmsContentData;
type CmsMutationError = Error & {
	statusCode?: number;
	details?: ApiErrorDetail[] | null;
};

import { MenuBar, FontSize } from "./CmsEditorMenuBar";
interface CmsEditModalProps {
	editContentId: string | null;
	onClose: () => void;
}

export function CmsEditModal({ editContentId, onClose }: CmsEditModalProps) {
	const isOpen = !!editContentId;
	const queryClient = useQueryClient();
	const router = useRouter();
	const [selectedFileName, setSelectedFileName] = useState("");
	const [fieldErrors, setFieldErrors] = useState<
		Partial<Record<CmsFieldName, string>>
	>({});
	const [newContent, setNewContent] = useState<UpdateCmsContentData>({
		title: "",
		message: "",
		contentType: "news",
		authorName: "",
		bannerImage: undefined,
	});

	const { data: contentDetail, isLoading: isContentLoading } = useQuery({
		queryKey: ["cms-content-detail", editContentId],
		queryFn: async () => {
			if (!editContentId) return null;
			const result = await cmsService.getCmsContentById(editContentId);
			if (!result.success || !result.data) {
				throw new Error(result.error || "Failed to fetch content details");
			}
			return result.data;
		},
		enabled: !!editContentId,
	});

	useEffect(() => {
		if (contentDetail) {
			setNewContent({
				title: contentDetail.title,
				message: contentDetail.message,
				contentType: contentDetail.type,
				authorName: contentDetail.author.name,
				bannerImage: undefined,
			});
			if (contentDetail.image) {
				setSelectedFileName("Current image (Upload to replace)");
			}
		}
	}, [contentDetail]);

	const [isDragging, setIsDragging] = useState(false);

	const editor = useEditor({
		extensions: [
			StarterKit,
			Placeholder.configure({
				placeholder: "Write message here...",
			}),
			TextStyle,
			Color,
			Highlight.configure({ multicolor: true }),
			FontFamily,
			FontSize,
			Underline,
			TextAlign.configure({ types: ["heading", "paragraph"] }),
		],
		content: newContent.message,
		onUpdate: ({ editor }) => {
			setFieldErrors((prev) => ({ ...prev, message: undefined }));
			setNewContent((prev) => ({
				...prev,
				message: editor.getHTML(),
			}));
		},
		editorProps: {
			attributes: {
    class: "prose prose-sm sm:prose-base max-w-none focus:outline-none min-h-[200px] prose-ul:list-disc prose-ol:list-decimal prose-li:my-0",
  },
		},
	});

	useEffect(() => {
		if (isOpen && editor && editor.getHTML() !== newContent.message) {
			editor.commands.setContent(newContent.message || "", { emitUpdate: false });
		}
	}, [isOpen, editor, newContent.message]);

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(true);
	};

	const handleDragLeave = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);
		const files = e.dataTransfer.files;
		if (files && files.length > 0) {
			handleFileChange(files[0]);
		}
	};

	const { data: authors = [], error: authorsError, isLoading: isAuthorsLoading } =
		useQuery({
			queryKey: ["cms-authors"],
			enabled: isOpen,
			queryFn: async () => {
				const result = await cmsService.listCmsAuthors();
				if (!result.success) {
					const queryError = new Error(
						result.error || "Failed to fetch authors",
					) as CmsMutationError;
					queryError.statusCode = result.statusCode;
					queryError.details = result.details ?? null;
					throw queryError;
				}
				return result.data || [];
			},
		});

	useEffect(() => {
		if (authorsError) {
			toast.error("An error occurred please try again later");
		}
	}, [authorsError]);

	const updateContentMutation = useMutation({
		mutationFn: async (data: UpdateCmsContentData) => {
			if (!editContentId) throw new Error("No content ID provided");
			const result = await cmsService.updateCmsContent(editContentId, data);
			if (!result.success) {
				const apiError = new Error(
					result.error || "Failed to update cms content",
				) as CmsMutationError;
				apiError.statusCode = result.statusCode;
				apiError.details = result.details ?? null;
				throw apiError;
			}
			return result.data;
		},
		onSuccess: () => {
			toast.success("Content updated successfully");
			onClose();
			setFieldErrors({});
			setNewContent({
				title: "",
				message: "",
				contentType: "news",
				authorName: "",
				bannerImage: undefined,
			});
			setSelectedFileName("");
			queryClient.invalidateQueries({ queryKey: ["cms"] });
			queryClient.invalidateQueries({ queryKey: ["cms-content-detail", editContentId] });
			router.invalidate();
		},
		onError: (error) => {
			const apiError = error as CmsMutationError;

			if (apiError.statusCode === 400) {
				const nextFieldErrors: Partial<Record<CmsFieldName, string>> = {};
				for (const detail of apiError.details || []) {
					if (
						detail.field === "title" ||
						detail.field === "message" ||
						detail.field === "contentType" ||
						detail.field === "authorName" ||
						detail.field === "bannerImage"
					) {
						nextFieldErrors[detail.field] = detail.message;
					}
				}
				setFieldErrors(nextFieldErrors);
				toast.error("Please check the highlighted fields");
				return;
			}

			toast.error("An error occurred please try again later");
		},
	});

	const handleFileChange = (file: File | null) => {
		if (!file) {
			setSelectedFileName("");
			setNewContent((prev) => ({ ...prev, bannerImage: undefined }));
			return;
		}

		if (!file.type.startsWith("image/")) {
			toast.error("Only image uploads are supported for CMS content");
			setSelectedFileName("");
			setNewContent((prev) => ({ ...prev, bannerImage: undefined }));
			return;
		}

		const reader = new FileReader();
		reader.onload = () => {
			const encodedImage =
				typeof reader.result === "string" &&
				reader.result.startsWith("data:image/")
					? reader.result
					: undefined;

			if (!encodedImage) {
				toast.error("Failed to process image file");
				setSelectedFileName("");
				setNewContent((prev) => ({ ...prev, bannerImage: undefined }));
				return;
			}

			setNewContent((prev) => ({
				...prev,
				bannerImage: encodedImage,
			}));
			setFieldErrors((prev) => ({ ...prev, bannerImage: undefined }));
			setSelectedFileName(file.name);
		};
		reader.onerror = () => {
			toast.error("Failed to read selected file");
		};
		reader.readAsDataURL(file);
	};

	if (!isOpen) return null;

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3"
			onClick={onClose}
		>
			<div
				className="flex h-[80%] max-h-[80%] w-full max-w-5xl flex-col overflow-y-auto overflow-x-hidden rounded-2xl bg-[#f3f3f4] shadow-2xl" 
				onClick={(e) => e.stopPropagation()}
			>
				<div className="flex items-center justify-between bg-[#ececee] px-5 py-3 sm:px-8">
					<h3 className="font-bold text-[#0a0d3c] text-base sm:text-3xl">
						Edit Content
					</h3>
					<button
						type="button"
						onClick={onClose}
						className="flex h-9 w-9 items-center cursor-pointer justify-center rounded-full border-2 border-[#03002B] text-[#0a0d3c] transition-colors hover:bg-[#e4e4ea]"
					>
						<X className="h-5 w-5" />
					</button>
				</div>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						setFieldErrors({});
						updateContentMutation.mutate(newContent);
					}}
					className="flex-1 space-y-4 overflow-y-auto px-5 py-4 sm:px-8 sm:py-4"
				>
					<div>
						<label className="mb-1.5 block font-semibold text-[#11123f] text-base">
							Content/Story Title
						</label>
						<input
							type="text"
							value={newContent.title}
							onChange={(e) => {
								setFieldErrors((prev) => ({ ...prev, title: undefined }));
								setNewContent((prev) => ({
									...prev,
									title: e.target.value,
								}));
							}}
							required
							placeholder="Enter headline"
							className="h-11 w-full rounded-xl border border-transparent bg-[#ececee] px-3 text-[#11123f] text-sm placeholder:text-[#999da5] focus:outline-none sm:h-12 sm:text-base placeholder:text-sm"
						/>
						{fieldErrors.title && (
							<p className="mt-1 text-red-600 text-xs">
								{fieldErrors.title}
							</p>
						)}
					</div>

					<div className="grid gap-5 lg:grid-cols-[1fr_335px]">
						<div className="min-w-0">
							<label className="mb-1.5 block font-medium text-[#11123f] text-base">
								Message
							</label>
							<div className="flex flex-col h-[479px] w-full rounded-xl border border-transparent bg-[#F9F9F9] focus:outline-none overflow-hidden">
								<MenuBar editor={editor} />
								<EditorContent
									editor={editor}
									className="flex-1 overflow-y-auto custom-scrollbar p-3 text-[#11123f] bg-[#F9F9F9]"
								/>
							</div>
							{fieldErrors.message && (
								<p className="mt-1 text-red-600 text-xs">
									{fieldErrors.message}
								</p>
							)}
						</div>

						<div className="flex flex-col gap-4">
							<div>
								<label className="mb-1.5 block font-medium text-[#11123f] text-base">
									Author name
								</label>
								<div className="relative">
									<select
									value={newContent.authorName}
									onChange={(e) => {
										setFieldErrors((prev) => ({
											...prev,
											authorName: undefined,
										}));
										setNewContent((prev) => ({
											...prev,
											authorName: e.target.value,
										}));
									}}
										required
										disabled={isAuthorsLoading || authors.length === 0}
										className="h-11 w-full appearance-none rounded-xl border border-transparent bg-[#ececee] px-3 pr-9 text-[#56607a] text-sm focus:outline-none disabled:opacity-60 sm:h-12"
									>
										<option value="" disabled>
											{isAuthorsLoading
												? "Loading authors..."
												: "Select author"}
										</option>
										{authors.map((author) => (
											<option key={author._id} value={author.name}>
												{author.name}
											</option>
										))}
									</select>
									<ChevronDown className="-translate-y-1/2 pointer-events-none absolute top-1/2 right-3 h-4 w-4 text-[#6b7286]" />
								</div>
								{fieldErrors.authorName && (
									<p className="mt-1 text-red-600 text-xs">
										{fieldErrors.authorName}
									</p>
								)}
							</div>

							<div>
								<label className="mb-1.5 block font-medium text-[#11123f] text-base">
									Content Type/Labels
								</label>
								<div className="relative">
									<select
										value={newContent.contentType}
										onChange={(e) => {
											setFieldErrors((prev) => ({
												...prev,
												contentType: undefined,
											}));
											setNewContent((prev) => ({
												...prev,
												contentType: e.target.value as
													| "news"
													| "videos"
													| "ads",
											}));
										}}
										required
										className="h-11 w-full appearance-none rounded-xl border border-transparent bg-[#ececee] px-3 pr-9 text-[#56607a] text-sm focus:outline-none sm:h-12"
									>
										<option value="news">News</option>
										<option value="videos">Videos</option>
										<option value="ads">Ads</option>
									</select>
									<ChevronDown className="-translate-y-1/2 pointer-events-none absolute top-1/2 right-3 h-4 w-4 text-[#6b7286]" />
								</div>
								{fieldErrors.contentType && (
									<p className="mt-1 text-red-600 text-xs">
										{fieldErrors.contentType}
									</p>
								)}
							</div>

							<div>
								<label className="mb-1.5 block font-medium text-[#11123f] text-base">
									Content/Story Image
								</label>
								<div className="rounded-xl border border-dashed border-[#b9bbc5] bg-[#f5f5f6] p-3">
									{(newContent.bannerImage || contentDetail?.image) && (
										<div className="mb-3">
											<img
												src={newContent.bannerImage || contentDetail?.image || undefined}
												alt="Content Preview"
												className="h-32 w-full rounded-lg object-cover"
											/>
										</div>
									)}
									<label
										htmlFor="cms-banner-upload"
										onDragOver={handleDragOver}
										onDragLeave={handleDragLeave}
										onDrop={handleDrop}
										className={`flex min-h-[84px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 text-center transition-all ${
											isDragging
												? "border-[#1baa04] bg-[#eaffea] scale-[1.02]"
												: "border-transparent hover:bg-[#ececee]"
										}`}
									>
										<Upload className={`mb-1.5 h-5 w-5 ${isDragging ? "text-[#1baa04]" : "text-[#8a8d97]"}`} />
										<span className={`font-medium text-sm sm:text-base ${isDragging ? "text-[#1baa04]" : "text-[#737680]"}`}>
											{selectedFileName || (isDragging ? "Drop image here" : "Choose an Image or drag & drop")}
										</span>
										<span className="text-[#a7a9b2] text-xs sm:text-sm">
											Upload supports: JPG, PNG.
										</span>
									</label>
									<input
										id="cms-banner-upload"
										type="file"
										accept=".jpg,.jpeg,.png,image/*"
										className="hidden"
										onChange={(e) =>
											handleFileChange(e.target.files?.[0] ?? null)
										}
									/>
									{fieldErrors.bannerImage && (
										<p className="mt-1 text-red-600 text-xs">
											{fieldErrors.bannerImage}
										</p>
									)}
								</div>
							</div>

							<div className="mt-auto pt-1">
								<button
									type="submit"
									disabled={
										updateContentMutation.isPending ||
										isAuthorsLoading ||
										authors.length === 0 ||
										isContentLoading
									}
									className="h-11 w-full rounded-full bg-[#1baa04] font-semibold text-sm text-white transition-colors hover:bg-[#149504] disabled:cursor-not-allowed disabled:opacity-60 sm:h-12 sm:text-base"
								>
									{updateContentMutation.isPending ? "Saving..." : "Save Changes"}
								</button>
							</div>
						</div>
					</div>

					{/* <div className="flex justify-end">
						<button
							type="button"
							onClick={onClose}
							className="rounded-md px-2 py-1 text-[#5f6679] text-sm underline hover:text-[#0a0d3c]"
						>
							Cancel
						</button>
					</div> */}
				</form>
			</div>
		</div>
	);
}
