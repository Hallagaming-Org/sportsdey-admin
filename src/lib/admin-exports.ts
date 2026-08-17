import { toast } from "sonner";
import { API_BASE, fetchApi, getCookie, redirectToSignIn } from "./api";

export type ExportSource =
	| "admins"
	| "users"
	| "transactions"
	| "ticket-history"
	| "cms";
export type ExportFormat = "xlsx" | "docx" | "pdf";
export type ExportFilters = Record<string, string | number | boolean | undefined>;

interface ExportJob {
	jobId: string;
	status: "queued" | "processing" | "completed" | "completed_with_errors" | "failed";
	chunkCount: number;
	chunksDone: number;
	chunksFailed: number;
	failedChunks: Array<{ index: number; error: string | null }>;
}

const POLL_INTERVAL_MS = 2_000;
const sleep = (milliseconds: number) =>
	new Promise((resolve) => setTimeout(resolve, milliseconds));

function downloadBlob(blob: Blob, filename: string) {
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = filename;
	anchor.click();
	setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

async function downloadExport(job: ExportJob, source: ExportSource) {
	const token = getCookie("admin_session");
	const response = await fetch(`${API_BASE}/admin/exports/${job.jobId}/zip`, {
		headers: token ? { Authorization: `Bearer ${token}` } : {},
		credentials: "include",
	});
	if (response.status === 401) redirectToSignIn();
	if (!response.ok) throw new Error("The export was generated, but the download failed");
	downloadBlob(
		await response.blob(),
		`${source}-export-${new Date().toISOString().slice(0, 10)}.zip`,
	);
}

export async function startAdminExport(input: {
	source: ExportSource;
	format: ExportFormat;
	filters?: ExportFilters;
}) {
	const toastId = toast.loading(`Preparing ${input.format.toUpperCase()} export...`, {
		duration: Number.POSITIVE_INFINITY,
	});
	const created = await fetchApi<{
		jobId: string;
		rowCount: number;
		chunkCount: number;
	}>("/admin/exports", {
		method: "POST",
		body: { ...input, filters: input.filters ?? {} },
	});
	if (!created.success || !created.data) {
		toast.error(created.error || "Failed to start export", { id: toastId });
		return;
	}
	if (created.data.chunkCount === 0) {
		toast.success("Export complete: no matching records", { id: toastId });
		return;
	}

	while (true) {
		await sleep(POLL_INTERVAL_MS);
		const result = await fetchApi<ExportJob>(`/admin/exports/${created.data.jobId}`);
		if (!result.success || !result.data) {
			toast.loading("Export is still running. Reconnecting...", {
				id: toastId,
				duration: Number.POSITIVE_INFINITY,
			});
			continue;
		}
		const job = result.data;
		const finished = job.chunksDone + job.chunksFailed;
		const percentage = Math.round((finished / Math.max(1, job.chunkCount)) * 100);
		if (job.status === "queued" || job.status === "processing") {
			toast.loading(`Generating files: ${finished}/${job.chunkCount} (${percentage}%)`, {
				id: toastId,
				duration: Number.POSITIVE_INFINITY,
			});
			continue;
		}
		if (job.status === "failed") {
			toast.error(job.failedChunks[0]?.error || "Export generation failed", {
				id: toastId,
			});
			return;
		}
		try {
			await downloadExport(job, input.source);
			toast.success(
				job.status === "completed_with_errors"
					? "Export complete with some missing files"
					: "Export complete. Download started",
				{ id: toastId },
			);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Export download failed", {
				id: toastId,
			});
		}
		return;
	}
}
