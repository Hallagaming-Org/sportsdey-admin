import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import NotificationIcon from "#/assets/NotificationIcon";
import { fetchApi } from "../../lib/api";

export const Route = createFileRoute("/app/notifications")({
    component: NotificationsPage,
});

type AdminNotification = {
    id: string;
    title: string;
    message: string;
    type: string;
    referenceId: string | null;
    isRead: boolean;
    createdAt: string;
};

function formatNotificationType(type: string) {
    return type
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
}

function NotificationsPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const router = useRouter();
    const [page] = useState(1);
    const [limit] = useState(20);

    const { data, isLoading, error } = useQuery({
        queryKey: ["admin-notifications", page, limit],
        queryFn: async () => {
            const res = await fetchApi<{ notifications: AdminNotification[]; pagination: any }>(
                `/admin/notifications?page=${page}&limit=${limit}`,
            );
            if (!res.success) throw new Error(res.error || "Failed to load notifications");
            return res.data!;
        },
    });

    const markReadMutation = useMutation({
        mutationFn: async (id: string) => {
            const r = await fetchApi(`/admin/notifications/${id}/read`, {
                method: "PATCH",
            });
            return r;
        },
        onSuccess: () => {
            toast.success("Marked as read");
            queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
            router.invalidate();
        },
        onError: (err: any) => {
            toast.error(err?.message || "Failed to mark read");
        },
    });

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-semibold">Notification</h1>
                    <div className="text-sm text-gray-500">Dashboard &gt; Notifications</div>
                </div>
            </div>

            <div className="space-y-4">
                {isLoading && <div className="text-gray-500">Loading...</div>}
                {error && <div className="rounded-xl bg-red-50 p-4 text-red-600">Failed to load notifications: {(error as Error).message}</div>}
                {!isLoading && !error && !data?.notifications?.length && <div className="text-gray-500">No notifications yet.</div>}
                {data?.notifications?.map((n) => (
                    <div
                        key={n.id}
                        className="flex items-center gap-4 rounded-xl bg-[#F9F9F9] p-4 shadow-sm cursor-pointer"
                        onClick={() => {
                            if (!n.isRead) markReadMutation.mutate(n.id);
                            if (n.type === "withdrawal_request" && n.referenceId) {
                                navigate({ to: "/app/transactions", state: { viewTransaction: n.referenceId } });
                            }
                        }}
                    >
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                            <NotificationIcon height={36} width={36} />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="font-semibold text-gray-900">{n.title}</div>
                                    <div className="text-sm text-gray-500">{formatNotificationType(n.type)}</div>
                                </div>
                                <div className="text-xs text-gray-400">{new Date(n.createdAt).toLocaleString()}</div>
                            </div>
                            <div className="mt-2 text-sm text-gray-700">{n.message}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default NotificationsPage;
