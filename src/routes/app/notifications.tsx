import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import NotificationIcon from "#/assets/NotificationIcon";
import { SendNoticeModal } from "../../components/SendNoticeModal";
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

function NotificationsPage() {
    const queryClient = useQueryClient();
    const [page] = useState(1);
    const [limit] = useState(20);
    const [showSendModal, setShowSendModal] = useState(false);

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
            queryClient.invalidateQueries(["admin-notifications"]);
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
                <div className="flex items-center gap-3">
                    <button
                        className="rounded-full bg-white border px-4 py-2"
                        onClick={() => setShowSendModal(false)}
                    >
                        Add new user
                    </button>
                    <button
                        className="rounded-full bg-accent px-4 py-2 text-white"
                        onClick={() => setShowSendModal(true)}
                    >
                        Send a Notice
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {isLoading && <div className="text-gray-500">Loading...</div>}
                {error && <div className="rounded-xl bg-red-50 p-4 text-red-600">Failed to load notifications: {(error as Error).message}</div>}
                {!isLoading && !error && !data?.notifications?.length && <div className="text-gray-500">No notifications yet.</div>}
                {data?.notifications?.map((n) => (
                    <div
                        key={n.id}
                        className="flex items-center gap-4 rounded-xl bg-[#F9F9F9] p-4 shadow-sm"
                        onClick={() => {
                            if (!n.isRead) markReadMutation.mutate(n.id);
                        }}
                    >
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                            <NotificationIcon height={36} width={36} />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="font-semibold text-gray-900">{n.title}</div>
                                    <div className="text-sm text-gray-500">{n.type}</div>
                                </div>
                                <div className="text-xs text-gray-400">{new Date(n.createdAt).toLocaleString()}</div>
                            </div>
                            <div className="mt-2 text-sm text-gray-700">{n.message}</div>
                        </div>
                    </div>
                ))}
            </div>

            {showSendModal && (
                <SendNoticeModal
                    user={null as any}
                    availableUsers={[]}
                    onClose={() => setShowSendModal(false)}
                    onSubmit={async (payload: any) => {
                        // Send via existing notificationService used elsewhere; fallback to API
                        const result = await fetchApi("/notifications/send", {
                            method: "POST",
                            body: payload,
                        });
                        if (result.success) {
                            toast.success("Notice sent");
                            setShowSendModal(false);
                        } else {
                            toast.error(result.error || "Failed to send notice");
                        }
                    }}
                />
            )}
        </div>
    );
}

export default NotificationsPage;
